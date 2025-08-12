import express from 'express';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../services/auth.js';
import { detectPlatform, downloadAudio } from '../services/downloader.js';
import { transcribeAudio } from '../services/transcriber.js';
import { summarizeText } from '../services/summarizer.js';

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

async function checkQuota(userId) {
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  const plan = profile?.plan || 'free';
  const limit = plan === 'pro' ? 10000 : 10;
  const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
  const { count } = await supabaseAdmin.from('items').select('id', {count:'exact', head:true}).eq('user_id', userId).gte('created_at', start.toISOString());
  return { allowed: (count||0) < limit, plan, used: count||0, limit };
}

async function uploadStorage(localPath, pathOut) {
  const buff = fs.readFileSync(localPath);
  const { error } = await supabaseAdmin.storage.from('vaultly').upload(pathOut, buff, { upsert: true, contentType:'audio/mpeg' });
  if (error) throw error;
  return pathOut;
}

router.post('/ingest/url', async (req, res) => {
  try {
    const userId = req.user.id;
    const { allowed, plan, used, limit } = await checkQuota(userId);
    if (!allowed) return res.status(402).json({ error: `Límite del plan ${plan} alcanzado (${used}/${limit})` });
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Falta url' });

    const id = uuidv4();
    const platform = detectPlatform(url);
    const tmp = path.join(os.tmpdir(), `${id}.mp3`);
    const meta = await downloadAudio(url, tmp);
    const transcript = await transcribeAudio(tmp);
    const s = await summarizeText(transcript, { title: meta.title, platform });
    const store = `${userId}/${id}.mp3`;
    await uploadStorage(tmp, store);

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert({
        id, user_id: userId, source_url: url, platform,
        title: meta.title, author: meta.uploader, audio_path: store,
        transcript, summary: s.summary, key_points: s.keyPoints,
        categories: s.categories, topics: s.topics, language: s.language, sentiment: s.sentiment
      }).select().single();
    if (error) throw error;

    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/ingest/file', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { allowed, plan, used, limit } = await checkQuota(userId);
    if (!allowed) return res.status(402).json({ error: `Límite del plan ${plan} alcanzado (${used}/${limit})` });
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });

    const id = uuidv4();
    const tmp = req.file.path;
    const transcript = await transcribeAudio(tmp);
    const s = await summarizeText(transcript, { title: req.file.originalname, platform: 'Upload' });
    const store = `${userId}/${id}.mp3`;
    await uploadStorage(tmp, store);

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert({
        id, user_id: userId, source_url: null, platform: 'Upload',
        title: req.file.originalname, audio_path: store,
        transcript, summary: s.summary, key_points: s.keyPoints,
        categories: s.categories, topics: s.topics, language: s.language, sentiment: s.sentiment
      }).select().single();
    if (error) throw error;

    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;

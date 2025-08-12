import express from 'express';
import { supabaseAdmin } from '../services/auth.js';
const router = express.Router();

router.get('/user', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || { id: req.user.id, plan: 'free' });
});

router.get('/items', async (req, res) => {
  const userId = req.user.id;
  const q = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();
  let query = supabaseAdmin.from('items')
    .select('id,source_url,platform,title,author,summary,categories,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,transcript.ilike.%${q}%`);
  if (category) query = query.contains('categories', [category]);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

router.get('/items/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('items').select('*')
    .eq('user_id', req.user.id)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'No encontrado' });
  res.json(data);
});

export default router;

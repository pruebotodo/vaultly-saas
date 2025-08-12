import fs from 'fs';
import OpenAI from 'openai';

export async function transcribeAudio(p) {
  if (!process.env.OPENAI_API_KEY) return 'Transcripción no disponible.';
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL_TRANSCRIBE || 'whisper-1';
  const file = fs.createReadStream(p);
  const r = await openai.audio.transcriptions.create({ file, model });
  return (r.text || '').trim();
}

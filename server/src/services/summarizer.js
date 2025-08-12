import OpenAI from 'openai';

function extractive(t) {
  const s = t.split(/(?<=[\.!\?])\s+/).filter(x=>x && x.length>30);
  const top = s.slice(0,6);
  const sum = top.join(' ') || t.slice(0,800);
  return { summary: sum, keyPoints: top };
}

export async function summarizeText(text, ctx={}) {
  if (!text?.trim()) return { summary:'', keyPoints:[], categories:[], topics:[], language:'es', sentiment:'neutral' };
  if (!process.env.OPENAI_API_KEY) {
    const { summary, keyPoints } = extractive(text);
    return { summary, keyPoints, categories:[], topics:[], language:'es', sentiment:'neutral' };
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL_SUMMARY || 'gpt-4o-mini';
  const prompt = [
    'Devuelve SOLO JSON: {"summary":string,"key_points":string[],"categories":string[],"topics":string[],"language":string,"sentiment":string}',
    ctx?.title ? `Título: ${ctx.title}` : '',
    ctx?.platform ? `Plataforma: ${ctx.platform}` : '',
    'Transcripción:',
    text
  ].filter(Boolean).join('\n');

  const r = await openai.chat.completions.create({
    model, temperature: 0.2,
    messages: [{ role:'system', content: 'Solo JSON válido.' }, { role:'user', content: prompt }]
  });

  let c = r.choices?.[0]?.message?.content || '{}';
  try {
    const p = JSON.parse(c);
    return {
      summary: p.summary || '',
      keyPoints: p.key_points || [],
      categories: p.categories || [],
      topics: p.topics || [],
      language: p.language || 'es',
      sentiment: p.sentiment || 'neutral'
    };
  } catch {
    return { summary: c.slice(0,1200), keyPoints:[], categories:[], topics:[], language:'es', sentiment:'neutral' };
  }
}

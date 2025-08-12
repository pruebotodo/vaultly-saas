import ytdl from 'youtube-dl-exec';
import ffmpegPath from 'ffmpeg-static';

export function detectPlatform(u) {
  u = u.toLowerCase();
  if (u.includes('youtu')) return 'YouTube';
  if (u.includes('tiktok')) return 'TikTok';
  if (u.includes('instagram')) return 'Instagram';
  if (u.includes('x.com') || u.includes('twitter')) return 'X/Twitter';
  return 'Otro';
}

function opts(url, out) {
  const isIG = /instagram\.com/i.test(url);
  const isTT = /tiktok\.com/i.test(url);
  const cookies =
    (isIG && (process.env.IG_COOKIES_PATH || process.env.COOKIES_ALL_PATH)) ||
    (isTT && (process.env.TT_COOKIES_PATH || process.env.COOKIES_ALL_PATH)) ||
    null;

  const o = {
    extractAudio: true,
    audioFormat: 'mp3',
    audioQuality: 0,
    output: out,
    noWarnings: true,
    preferFreeFormats: true,
    ffmpegLocation: ffmpegPath || undefined,
    dumpSingleJson: true,
    'user-agent': process.env.YTDLP_UA || 'Mozilla/5.0'
  };
  if (cookies) o.cookies = cookies;
  return o;
}

export async function downloadAudio(url, out) {
  const r = await ytdl(url, opts(url, out));
  let m = {};
  try { m = typeof r === 'string' ? JSON.parse(r) : r; } catch {}
  return { title: m.title || null, uploader: m.uploader || m.channel || null, duration: m.duration || null };
}

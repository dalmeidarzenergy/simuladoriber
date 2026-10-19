// Catálogo de campanhas partilhado. GET = ler (público). POST = gravar (só com palavra-passe de administrador).
// Armazenamento: Upstash Redis via REST (plano gratuito serve). Variáveis de ambiente:
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ADMIN_KEY  (e opcional ALLOWED_ORIGINS)
const crypto = require('crypto');
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN, KEY = 'rz_catalogo';
const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const SEGS = ['lr', 'ln', 'lc', 'gr', 'gn'];
const hits = new Map();
function limited(ip) { const now = Date.now(), w = (hits.get(ip) || []).filter(t => now - t < 600000); w.push(now); hits.set(ip, w); return w.length > 20; }
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  res.setHeader('Vary', 'Origin'); res.setHeader('Cache-Control', 'no-store');
  if (ORIGINS.length && ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!URL_ || !TOK) return res.status(503).json({ error: 'armazenamento não configurado' });
  try {
    if (req.method === 'GET') {
      const v = await redis(['GET', KEY]);
      if (!v) return res.status(404).json({ error: 'sem catálogo' });
      return res.status(200).json(JSON.parse(v));
    }
    if (req.method === 'POST') {
      if (ORIGINS.length && origin && !ORIGINS.includes(origin)) return res.status(403).json({ error: 'origem não permitida' });
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
      if (limited(ip)) return res.status(429).json({ error: 'demasiados pedidos' });
      if (!process.env.ADMIN_KEY || !same(req.headers['x-admin-key'] || '', process.env.ADMIN_KEY)) return res.status(401).json({ error: 'não autorizado' });
      const b = req.body;
      if (!b || typeof b !== 'object') return res.status(400).json({ error: 'pedido inválido' });
      const out = { atualizado: /^\d{4}-\d{2}-\d{2}$/.test(b.atualizado || '') ? b.atualizado : new Date().toISOString().slice(0, 10) };
      for (const k of SEGS) { if (!Array.isArray(b[k]) || b[k].length > 60) return res.status(400).json({ error: 'catálogo inválido' }); out[k] = b[k]; }
      const txt = JSON.stringify(out);
      if (txt.length > 400000) return res.status(413).json({ error: 'catálogo demasiado grande' });
      await redis(['SET', KEY, txt]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'método não permitido' });
  } catch (e) { return res.status(500).json({ error: 'falha no armazenamento' }); }
};

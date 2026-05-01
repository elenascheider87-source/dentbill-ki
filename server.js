const express = require('express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ADMIN_CODE = process.env.ADMIN_CODE || 'dentbill2024';

const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

function readData(file, fallback) {
  try { return JSON.parse(fs.readFileSync(`${DATA_DIR}/${file}`, 'utf8')); }
  catch { return fallback; }
}
function writeData(file, data) {
  fs.writeFileSync(`${DATA_DIR}/${file}`, JSON.stringify(data, null, 2));
}

function initDefaults() {
  if (!readData('categories.json', null)) {
    writeData('categories.json', [
      { id:'bema', label:'BEMA', color:'#00c9a7', icon:'G', desc:'Gesetzliche Krankenversicherung – alle BEMA-Leistungen' },
      { id:'goz', label:'GOZ', color:'#6366f1', icon:'P', desc:'Privatpatienten – GOZ 2012 Gebührenordnung' },
      { id:'festzuschuss', label:'Festzuschüsse', color:'#f59e0b', icon:'F', desc:'Zahnersatz Regelversorgung & gleichartige Versorgung' },
      { id:'labor', label:'Labor / BEL II', color:'#22c55e', icon:'L', desc:'Laborleistungen, Labortarife, Laborabrechnung' },
      { id:'gewaehr', label:'Gewährleistung', color:'#ef4444', icon:'W', desc:'Fristen für Füllungen, Kronen, Prothesen' },
      { id:'prophylaxe', label:'Prophylaxe', color:'#0ea5e9', icon:'P', desc:'PZR, IP-Leistungen, Früherkennungsuntersuchungen' },
      { id:'chirurgie', label:'Chirurgie', color:'#a855f7', icon:'C', desc:'Oralchirurgische Leistungen, Extraktionen' },
      { id:'prothetik', label:'Prothetik', color:'#ec4899', icon:'P', desc:'Zahnersatz, Reparaturen, Unterfütterungen' }
    ]);
  }
  if (!readData('knowledge.json', null)) {
    writeData('knowledge.json', [
      { id:'k1', categoryId:'bema', title:'BEMA 1040 – Zahnsteinentfernung', content:'BEMA 1040: Zahnsteinentfernung, abrechenbar 1x pro Kiefer pro Quartal. Nicht in gleicher Sitzung wie PZR (Ä1) kombinierbar. 19 Punkte je Kiefer.', tags:['1040','zahnstein'], date:'2024-01-01' },
      { id:'k2', categoryId:'gewaehr', title:'Gewährleistungsfristen Überblick', content:'Kunststofffüllungen: 2 Jahre. Zahnersatz mit Festzuschuss: 5 Jahre (§ 136a SGB V). Prothesen: 5 Jahre. Implantate: keine gesetzliche Regelung.', tags:['gewährleistung','füllungen','kronen'], date:'2024-01-01' },
      { id:'k3', categoryId:'bema', title:'MU nach Protheseneinsetzen', content:'MU (Ä1) innerhalb von 3 Monaten nach Eingliederung einer Prothese ist NICHT extra abrechenbar – die Eingliederungsleistung schließt Kontrollen ein. Ausnahme: neuer Behandlungsanlass.', tags:['mu','prothese','frist'], date:'2024-01-01' }
    ]);
  }
  if (!readData('users.json', null)) {
    const envUsers = JSON.parse(process.env.USERS_JSON || '[]');
    writeData('users.json', envUsers.length ? envUsers : [{ username:'admin', password:'admin123', name:'Admin', role:'admin' }]);
  }
}
initDefaults();

const sessions = {};
app.use(express.json({ limit: '20mb' }));
app.use(express.static('public'));
app.use(express.static('.'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

function requireAuth(req, res, next) {
  const t = req.headers['x-session-token'];
  if (t && sessions[t]) { req.user = sessions[t]; return next(); }
  res.status(401).json({ error: 'Nicht angemeldet' });
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Kein Admin' });
    next();
  });
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData('users.json', []);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Falscher Benutzername oder Passwort' });
  const token = Math.random().toString(36).slice(2) + Date.now();
  sessions[token] = { username: user.username, name: user.name, role: user.role };
  res.json({ token, name: user.name, role: user.role });
});

app.post('/api/register', (req, res) => {
  const { username, password, name, adminCode } = req.body;
  if (adminCode !== ADMIN_CODE) return res.status(403).json({ error: 'Falscher Zugangscode' });
  const users = readData('users.json', []);
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Benutzername bereits vergeben' });
  users.push({ username, password, name, role: 'user' });
  writeData('users.json', users);
  res.json({ ok: true });
});

app.post('/api/logout', requireAuth, (req, res) => { delete sessions[req.headers['x-session-token']]; res.json({ ok: true }); });
app.get('/api/me', requireAuth, (req, res) => res.json(req.user));

app.get('/api/categories', requireAuth, (req, res) => res.json(readData('categories.json', [])));
app.post('/api/categories', requireAdmin, (req, res) => {
  const cats = readData('categories.json', []);
  const cat = { id: Date.now().toString(), ...req.body };
  cats.push(cat); writeData('categories.json', cats); res.json(cat);
});
app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const cats = readData('categories.json', []).map(c => c.id === req.params.id ? { ...c, ...req.body } : c);
  writeData('categories.json', cats); res.json({ ok: true });
});
app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  writeData('categories.json', readData('categories.json', []).filter(c => c.id !== req.params.id));
  res.json({ ok: true });
});

app.get('/api/knowledge', requireAuth, (req, res) => {
  let items = readData('knowledge.json', []);
  const { categoryId, q } = req.query;
  if (categoryId) items = items.filter(i => i.categoryId === categoryId);
  if (q) { const s = q.toLowerCase(); items = items.filter(i => i.title.toLowerCase().includes(s) || i.content.toLowerCase().includes(s) || (i.tags||[]).some(t => t.includes(s))); }
  res.json(items);
});
app.post('/api/knowledge', requireAdmin, (req, res) => {
  const items = readData('knowledge.json', []);
  const item = { id: Date.now().toString(), date: new Date().toISOString().slice(0,10), ...req.body };
  items.push(item); writeData('knowledge.json', items); res.json(item);
});
app.put('/api/knowledge/:id', requireAdmin, (req, res) => {
  writeData('knowledge.json', readData('knowledge.json', []).map(i => i.id === req.params.id ? { ...i, ...req.body } : i));
  res.json({ ok: true });
});
app.delete('/api/knowledge/:id', requireAdmin, (req, res) => {
  writeData('knowledge.json', readData('knowledge.json', []).filter(i => i.id !== req.params.id));
  res.json({ ok: true });
});

app.get('/api/users', requireAdmin, (req, res) => {
  res.json(readData('users.json', []).map(u => ({ username: u.username, name: u.name, role: u.role })));
});
app.delete('/api/users/:username', requireAdmin, (req, res) => {
  writeData('users.json', readData('users.json', []).filter(u => u.username !== req.params.username));
  res.json({ ok: true });
});
app.put('/api/users/:username/role', requireAdmin, (req, res) => {
  writeData('users.json', readData('users.json', []).map(u => u.username === req.params.username ? { ...u, role: req.body.role } : u));
  res.json({ ok: true });
});

app.post('/api/chat', requireAuth, async (req, res) => {
  const { messages } = req.body;
  const knowledge = readData('knowledge.json', []);
  const categories = readData('categories.json', []);
  const ctx = knowledge.map(k => {
    const cat = categories.find(c => c.id === k.categoryId);
    return `[${cat?.label || k.categoryId}] ${k.title}:\n${k.content}`;
  }).join('\n\n');

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1500,
        system: `Du bist ein hochspezialisierter Abrechnungsassistent für Zahnarztpraxen in Deutschland. Antworte IMMER auf Deutsch.

WISSENSBASIS DER PLATTFORM (diese Informationen haben Vorrang):
${ctx || '(noch keine Einträge)'}

DEIN ZUSÄTZLICHES FACHWISSEN:
- BEMA (GKV): alle Leistungsnummern, Punkte, Bestimmungen, Kombinierbarkeit
- GOZ 2012: Gebührenordnung, Steigerungsfaktoren, Analogleistungen
- Festzuschüsse FZ 1.1–6.x: Regelversorgung, gleichartige, anderartige Versorgung
- BEL II: Labortarife, Laborabrechnungen
- Gewährleistungsfristen, vollständige Abrechnung, Dokumentationsauswertung

Wenn jemand "erzähl mir alles über X" fragt: vollständige Erklärung mit Punktzahl, Bestimmungen, Kombinierbarkeit, Tipps.
Sei freundlich wie ein erfahrener Mentor. Nenne immer konkrete Leistungsnummern.`,
        messages
      })
    });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei' });
  const meta = { filename: req.file.filename, originalname: req.file.originalname, uploader: req.user.name, username: req.user.username, title: req.body.title || req.file.originalname, category: req.body.category || 'Allgemein', date: new Date().toISOString().slice(0,10) };
  const all = readData('uploads.json', []);
  all.push(meta); writeData('uploads.json', all);
  res.json({ ok: true, meta });
});
app.get('/api/uploads', requireAuth, (req, res) => res.json(readData('uploads.json', [])));

app.listen(PORT, () => console.log(`DentBill KI läuft auf Port ${PORT}`));

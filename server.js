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
      { id:'bema', label:'BEMA', color:'#00c9a7', icon:'B', desc:'Gesetzliche Krankenversicherung – alle BEMA-Leistungen' },
      { id:'goz', label:'GOZ', color:'#6366f1', icon:'G', desc:'Privatpatienten – GOZ 2012 Gebührenordnung' },
      { id:'festzuschuss', label:'Festzuschüsse', color:'#f59e0b', icon:'F', desc:'Zahnersatz Regelversorgung & gleichartige Versorgung' },
      { id:'labor', label:'Labor / BEL II', color:'#22c55e', icon:'L', desc:'Laborleistungen, Labortarife, Laborabrechnung' },
      { id:'gewaehr', label:'Gewährleistung', color:'#ef4444', icon:'W', desc:'Fristen für Füllungen, Kronen, Prothesen' },
      { id:'prophylaxe', label:'Prophylaxe', color:'#0ea5e9', icon:'P', desc:'PZR, IP-Leistungen, Früherkennungsuntersuchungen' },
      { id:'chirurgie', label:'Chirurgie', color:'#a855f7', icon:'C', desc:'Oralchirurgische Leistungen, Extraktionen' },
      { id:'prothetik', label:'Prothetik', color:'#ec4899', icon:'T', desc:'Zahnersatz, Reparaturen, Unterfütterungen' }
    ]);
  }
  if (!readData('knowledge.json', null)) {
    writeData('knowledge.json', [
      { id:'k1', categoryId:'bema', title:'BEMA 23a (1040) – Zahnsteinentfernung', content:'BEMA 23a (früher 1040): Supragingivale Zahnsteinentfernung. 19 Punkte je Kiefer. 1x pro Kiefer pro Quartal. NICHT kombinierbar mit PZR (Privatleistung GOZ 1040) in gleicher Sitzung. Kombinierbar mit IP2.', tags:['1040','23a','zahnstein','scaling'], date:'2024-01-01' },
      { id:'k2', categoryId:'gewaehr', title:'Gewährleistungsfristen – Überblick', content:'Kunststofffüllungen GKV: 2 Jahre. Zahnersatz mit Festzuschuss (§136a SGB V): 5 Jahre. Prothesen GKV: 5 Jahre. Implantate: keine gesetzliche Frist. GOZ/Privat: 2 Jahre (§634 BGB).', tags:['gewährleistung','fristen','füllungen','kronen','prothesen'], date:'2024-01-01' },
      { id:'k3', categoryId:'bema', title:'MU (Ä1) nach Protheseneinsetzen', content:'MU (Ä1) innerhalb von 3 Monaten nach Eingliederung einer Prothese ist NICHT extra abrechenbar. Ausnahme: neuer eigenständiger Behandlungsanlass – dokumentieren!', tags:['mu','ä1','prothese','frist','kontrolle'], date:'2024-01-01' },
      { id:'k4', categoryId:'prophylaxe', title:'PZR – GOZ 1040', content:'PZR = GOZ Nr. 1040. Je Zahn/Implantat/Brückenglied. 28 Punkte, 2,3-fach: 3,62€. NICHT neben GOZ 1020, 4050, 4055, 4060, 4070, 4075, 4090, 4100. PZR ist reine Privatleistung!', tags:['pzr','prophylaxe','goz','1040'], date:'2024-01-01' },
      { id:'k5', categoryId:'festzuschuss', title:'Festzuschüsse – Regelversorgung vs. gleichartig', content:'Regelversorgung: 60% (Bonus 5J: 70%, 10J: 75%). Gleichartig: halber Zuschuss. Anderartig: KEIN Zuschuss. HKP immer VOR Behandlung mit Patientenunterschrift!', tags:['festzuschuss','regelversorgung','gleichartig','hkp'], date:'2024-01-01' },
      { id:'k6', categoryId:'goz', title:'GOZ Steigerungsfaktoren §5', content:'Punktwert: 5,62421 Cent. Regelfall: 2,3-fach. Max ohne Vereinbarung: 3,5-fach. Über 3,5-fach: schriftliche Honorarvereinbarung VOR Behandlung (§2 GOZ). Über 2,3-fach: Begründung auf Rechnung.', tags:['steigerungsfaktor','goz','punktwert'], date:'2024-01-01' },
      { id:'k7', categoryId:'chirurgie', title:'GOZ Extraktionen Übersicht', content:'3000: einwurzelig 70Pkt/9,05€ | 3010: mehrwurzelig 110Pkt/14,23€ | 3020: tief frakturiert 270Pkt/34,93€ | 3030: Osteotomie 350Pkt/45,27€ | 3040: retiniert 540Pkt/69,85€ | 3045: extrem verlagert 767Pkt/99,22€. Primäre Wundversorgung immer enthalten!', tags:['extraktion','3000','3010','3030','3040'], date:'2024-01-01' },
      { id:'k8', categoryId:'goz', title:'GOZ §6 Analogleistungen', content:'Leistungen nicht im GOZ-Verzeichnis → analog abrechnen. Auf Rechnung: Beschreibung + "entsprechend" + Nummer der analogen Leistung.', tags:['§6','analog','analogleistung'], date:'2024-01-01' },
    ]);
  }
  if (!readData('users.json', null)) {
    const envUsers = JSON.parse(process.env.USERS_JSON || '[]');
    writeData('users.json', envUsers.length ? envUsers : [
      { username: 'elena', password: 'Praxis2024!', name: 'Elena', role: 'admin' },
      { username: 'admin', password: 'admin123', name: 'Admin', role: 'admin' }
    ]);
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
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht gesetzt.' });
  }

  const { messages } = req.body;
  const knowledge = readData('knowledge.json', []);
  const categories = readData('categories.json', []);

  const dbKnowledge = knowledge.map(k => {
    const cat = categories.find(c => c.id === k.categoryId);
    return `[${cat?.label || k.categoryId}] ${k.title}:\n${k.content}`;
  }).join('\n\n');

  const systemPrompt = `Du bist ein hochspezialisierter Abrechnungsassistent für Zahnarztpraxen in Deutschland. Antworte IMMER auf Deutsch. Du bist freundlich und präzise wie ein erfahrener Mentor.

GOZ 2012 (Punktwert: 5,62421 Cent | Regelfall: 2,3-fach | Max: 3,5-fach):

A – Allgemein:
0010 Untersuchung: 100Pkt | 12,94€
0030 HKP: 200Pkt | 25,87€
0065 Digitale Abformung je Kieferhälfte: 80Pkt | 10,35€
0090 Infiltrationsanästhesie: 60Pkt | 7,76€
0100 Leitungsanästhesie: 70Pkt | 9,05€

B – Prophylaxe:
1000 Mundhygienestatus+Unterweisung (min.25Min): 200Pkt | 25,87€ | max.1x/Jahr
1010 Kontrolle Übungserfolg (min.15Min): 100Pkt | 12,94€ | max.3x/Jahr
1020 Fluoridierung: 50Pkt | 6,47€ | max.4x/Jahr
1040 PZR je Zahn/Implantat/Brückenglied: 28Pkt | 3,62€ | NICHT neben 1020,4050,4055,4060,4070,4075,4090,4100

C – Konservierend:
2000 Fissurenversiegelung je Zahn: 90Pkt | 11,64€
2060 Komposit 1-flächig Adhäsiv: 527Pkt | 68,17€
2080 Komposit 2-flächig Adhäsiv: 556Pkt | 71,92€
2100 Komposit 3-flächig Adhäsiv: 642Pkt | 83,05€
2120 Komposit >3-flächig Adhäsiv: 770Pkt | 99,60€
2150 Inlay 1-flächig: 1141Pkt | 147,60€
2160 Inlay 2-flächig: 1356Pkt | 175,41€
2170 Inlay >2-flächig: 1709Pkt | 221,07€
2197 Adhäsive Befestigung: 130Pkt | 16,82€
2200 Vollkrone Tangential: 1322Pkt | 171,01€
2210 Vollkrone Hohlkehl/Stufe: 1678Pkt | 217,06€ (NICHT bei Implantaten)
2220 Teilkrone/Veneer: 2067Pkt | 267,38€
2260 Provisorium direkt: 100Pkt | 12,94€
2290 Entfernung Krone/Inlay: 180Pkt | 23,28€
2330 Indirekte Überkappung: 110Pkt | 14,23€
2340 Direkte Überkappung: 200Pkt | 25,87€
2410 WK-Aufbereitung je Kanal: 392Pkt | 50,71€
2440 WK-Füllung: 258Pkt | 33,37€

D – Chirurgie (Wundversorgung IMMER enthalten – NICHT gesondert!):
3000 Extraktion einwurzelig: 70Pkt | 9,05€
3010 Extraktion mehrwurzelig: 110Pkt | 14,23€
3020 Extraktion tief frakturiert: 270Pkt | 34,93€
3030 Extraktion Osteotomie: 350Pkt | 45,27€
3040 Extraktion retiniert/verlagert: 540Pkt | 69,85€
3045 Extraktion extrem verlagert: 767Pkt | 99,22€
3110 WSR Frontzahn: 460Pkt | 59,50€
3120 WSR Seitenzahn: 580Pkt | 75,03€

E – Parodontium:
4000 Parodontalstatus: 160Pkt | 20,70€ | max.2x/Jahr
4050 Zahnstein einwurzelig: 10Pkt | 1,29€
4055 Zahnstein mehrwurzelig: 13Pkt | 1,68€
4070 Scaling einwurzelig geschlossen: 100Pkt | 12,94€
4075 Scaling mehrwurzelig geschlossen: 130Pkt | 16,82€
4090 Lappenop. Frontzahn: 180Pkt | 23,28€
4100 Lappenop. Seitenzahn: 275Pkt | 35,57€

F – Prothetik:
5000 Brückenanker Vollkrone Tangential: 1016Pkt | 131,43€
5070 Brückenglied je Spanne: 400Pkt | 51,74€
5200 Teilprothese einfach: 700Pkt | 90,55€
5210 Modellgussprothese: 1400Pkt | 181,10€
5220 Totalprothese OK: 1850Pkt | 239,31€
5230 Totalprothese UK: 2200Pkt | 284,59€
5270 Teilunterfütterung: 180Pkt | 23,28€
5280 Vollunterfütterung: 270Pkt | 34,93€
5290 Vollunterfütterung OK+Randgestaltung: 450Pkt | 58,21€
5300 Vollunterfütterung UK+Randgestaltung: 540Pkt | 69,85€

H – Schienen:
7000 Aufbissbehelf einfach: 270Pkt | 34,93€
7010 Aufbissbehelf adjustiert (Michigan): 800Pkt | 103,49€
7040 Kontrolle einfach: 65Pkt | 8,41€
7050 Kontrolle adjustiert subtraktiv: 180Pkt | 23,28€
7060 Kontrolle adjustiert additiv: 410Pkt | 53,04€

K – Implantologie:
9010 Implantatinsertion: 1545Pkt | 199,86€
9040 Freilegen Implantat: 626Pkt | 80,98€
9100 Augmentation: 2694Pkt | 348,49€
9110 Interner Sinuslift: 1500Pkt | 194,04€
9120 Externer Sinuslift: 3000Pkt | 388,07€

BEMA (GKV):
Ä1 Untersuchung: 1x/Quartal | NICHT mit IP1
23a Zahnstein: 1x/Kiefer/Quartal | NICHT mit PZR | kombinierbar mit IP2
13a Fissurenversiegelung: bis 17J, bleibende Molaren, kariesfrei
IP1: 1x/Halbjahr | NICHT neben Ä1
IP2: 1x/Halbjahr | kombinierbar mit 23a
46 Extraktion einfach | 47 chirurgisch (Naht enthalten!) | 48 Osteotomie (Naht enthalten!)
98a PA-Status: 1x/Behandlungsfall, Pflicht vor PAR
17 Schiene: Kontrolle <4 Wochen NICHT extra
MU nach Prothese: <3 Monate NICHT extra (außer neuer Anlass – dokumentieren!)

FESTZUSCHÜSSE: Regelversorgung 60% (5J: 70%, 10J: 75%). Gleichartig: halber Zuschuss. Anderartig: KEIN Zuschuss. HKP VOR Behandlung unterschreiben!

GEWÄHRLEISTUNG: Füllungen GKV 2J | Zahnersatz mit FZ 5J (§136a) | Prothesen GKV 5J | Implantate keine gesetzl. Frist | GOZ/Privat 2J (§634 BGB)

HÄUFIGE FEHLER:
- 23a + PZR gleiche Sitzung GKV: VERBOTEN
- MU nach Prothese <3 Monate: NICHT abrechenbar
- GOZ >2,3-fach ohne Begründung: unzulässig
- HKP ohne Unterschrift beginnen: nie!
- BEMA 47/48 + Wundnaht extra: enthalten!
- IP1 + Ä1 gleiche Sitzung: NICHT kombinierbar

=== PRAXIS-EIGENE EINTRÄGE ===
${dbKnowledge || '(noch keine eigenen Einträge)'}

Antworte strukturiert mit konkreten Nummern, Punktzahlen und Eurobeträgen.`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        messages
      })
    });

    const data = await r.json();
    if (data.error) return res.status(500).json({ error: `API-Fehler: ${data.error.message}` });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: `Verbindungsfehler: ${e.message}` });
  }
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei' });
  const meta = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    uploader: req.user.name,
    username: req.user.username,
    title: req.body.title || req.file.originalname,
    category: req.body.category || 'Allgemein',
    date: new Date().toISOString().slice(0,10)
  };
  const all = readData('uploads.json', []);
  all.push(meta); writeData('uploads.json', all);
  res.json({ ok: true, meta });
});

app.get('/api/uploads', requireAuth, (req, res) => res.json(readData('uploads.json', [])));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiKeySet: !!ANTHROPIC_API_KEY, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`DentBill KI läuft auf Port ${PORT}`));

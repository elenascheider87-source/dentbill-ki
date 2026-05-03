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
      { id:'k1', categoryId:'bema', title:'BEMA 23a (1040) – Zahnsteinentfernung', content:'BEMA 23a (früher 1040): Supragingivale Zahnsteinentfernung. 19 Punkte je Kiefer. 1x pro Kiefer pro Quartal. NICHT kombinierbar mit PZR (Privatleistung GOZ 1040) in gleicher Sitzung. Kombinierbar mit IP2 (IP2 enthält kein Scaling).', tags:['1040','23a','zahnstein','scaling'], date:'2024-01-01' },
      { id:'k2', categoryId:'gewaehr', title:'Gewährleistungsfristen – Überblick', content:'Kunststofffüllungen GKV: 2 Jahre. Zahnersatz mit Festzuschuss (§136a SGB V): 5 Jahre – Praxis muss kostenlos nachbessern/erneuern (Ausnahme: Patient trägt Schuld – dokumentieren!). Prothesen GKV: 5 Jahre. Implantate: keine gesetzliche Frist. GOZ/Privat: 2 Jahre (§634 BGB). Mundhygienestatus bei Eingliederung unbedingt dokumentieren als Beweissicherung!', tags:['gewährleistung','fristen','füllungen','kronen','prothesen','§136a'], date:'2024-01-01' },
      { id:'k3', categoryId:'bema', title:'MU (Ä1) nach Protheseneinsetzen – Regelung', content:'MU (Ä1) innerhalb von 3 Monaten nach Eingliederung einer Prothese ist NICHT extra abrechenbar – Kontrollsitzungen sind in der Eingliederungsleistung enthalten. Ausnahme: Es liegt ein vollkommen neuer, eigenständiger Behandlungsanlass vor (z.B. Sturz, neue Schmerzquelle). Diesen Anlass immer in der Kartei dokumentieren!', tags:['mu','ä1','prothese','frist','kontrolle','3 monate'], date:'2024-01-01' },
      { id:'k4', categoryId:'prophylaxe', title:'PZR – GOZ 1040 (Professionelle Zahnreinigung)', content:'PZR = GOZ Nr. 1040. Je Zahn/Implantat/Brückenglied (28 Punkte, 2,3-fach: 3,62 €). Umfasst: supragingivale/gingivale Beläge, Biofilm, Oberflächenpolitur, Fluoridierung. NICHT neben: GOZ 1020, 4050, 4055, 4060, 4070, 4075, 4090, 4100. PZR ist reine Privatleistung – NICHT auf BEMA abrechenbar!', tags:['pzr','prophylaxe','goz','1040','polieren','fluoridierung'], date:'2024-01-01' },
      { id:'k5', categoryId:'festzuschuss', title:'Festzuschüsse – Regelversorgung vs. gleichartig vs. anderartig', content:'Regelversorgung: 60% Festzuschuss (Standard). Bonusheft 5 J.: 70%. Bonusheft 10 J.: 75%. Sozialer Härtefall: bis 100%. Gleichartige Versorgung (z.B. Vollkeramik statt Metallkrone): halber Zuschuss, Patient zahlt Mehrkosten. Anderartige Versorgung (z.B. Implantat ohne Genehmigung): KEIN Zuschuss. HKP immer VOR Behandlungsbeginn mit Patientenunterschrift!', tags:['festzuschuss','regelversorgung','gleichartig','anderartig','hkp','bonus'], date:'2024-01-01' },
      { id:'k6', categoryId:'goz', title:'GOZ §5 Steigerungsfaktoren – Regeln', content:'Punktwert: 5,62421 Cent. Mindest: 1,0-fach. Regelfall (Durchschnitt): 2,3-fach. Höchstsatz ohne Vereinbarung: 3,5-fach. Über 3,5-fach: nur mit schriftlicher Honorarvereinbarung §2 GOZ VOR der Behandlung. Bei Überschreitung des 2,3-fachen: schriftliche Begründung je Leistung auf Rechnung erforderlich.', tags:['steigerungsfaktor','goz','§5','§2','honorarvereinbarung','punktwert'], date:'2024-01-01' },
      { id:'k7', categoryId:'chirurgie', title:'GOZ Chirurgische Leistungen – Extraktion Übersicht', content:'GOZ 3000: Einwurzeliger Zahn (70 Pkt | 9,05 € bei 2,3-fach). GOZ 3010: Mehrwurzeliger Zahn (110 Pkt | 14,23 €). GOZ 3020: Tief frakturiert/zerstört (270 Pkt | 34,93 €). GOZ 3030: Durch Osteotomie chirurgisch (350 Pkt | 45,27 €). GOZ 3040: Retiniert/impaktiert/verlagert (540 Pkt | 69,85 €). GOZ 3045: Extrem verlagert, gefährdete Strukturen (767 Pkt | 99,22 €). Primäre Wundversorgung ist in allen Chirurgie-Leistungen enthalten – NICHT gesondert!', tags:['extraktion','3000','3010','3030','3040','3045','chirurgie','osteotomie'], date:'2024-01-01' },
      { id:'k8', categoryId:'goz', title:'GOZ §6 Analogleistungen – Wie anwenden?', content:'Wenn eine Leistung nicht im GOZ-Verzeichnis steht → analog zu gleichwertiger Leistung berechnen (§6 GOZ). Pflicht auf der Rechnung: verständliche Beschreibung der erbrachten Leistung + Hinweis "entsprechend" + Nummer der analogen GOZ-Leistung. Beispiele: PZR-Einzelkomponenten, Bleaching, Lachgassedierung, digitale Abformung als Aufwertung.', tags:['§6','analog','analogleistung','goz','rechnung','entsprechend'], date:'2024-01-01' },
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
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY ist nicht gesetzt. Bitte in Render.com unter Environment eintragen.'
    });
  }

  const { messages } = req.body;
  const knowledge = readData('knowledge.json', []);
  const categories = readData('categories.json', []);

  const dbKnowledge = knowledge.map(k => {
    const cat = categories.find(c => c.id === k.categoryId);
    return `[${cat?.label || k.categoryId}] ${k.title}:\n${k.content}`;
  }).join('\n\n');

  const systemPrompt = `Du bist ein hochspezialisierter Abrechnungsassistent für Zahnarztpraxen in Deutschland. Antworte IMMER auf Deutsch. Du bist freundlich, präzise und hilfreich wie ein erfahrener Mentor.

WISSENSBASIS – GOZ 2012, BEMA, Festzuschüsse, Gewährleistung:

GOZ 2012 Grundlagen: Punktwert 5,62421 Cent. Steigerungsfaktoren: 1,0-fach bis 3,5-fach. Regelfall: 2,3-fach. Über 2,3-fach: schriftliche Begründung auf Rechnung. Über 3,5-fach: schriftliche Honorarvereinbarung VOR Behandlung (§2 GOZ). Analogleistungen §6: verständliche Beschreibung + "entsprechend" + Nummer auf Rechnung.

GOZ Abschnitt A – Allgemein:
0010 Untersuchung: 100 Pkt | 12,94€ (2,3-fach)
0030 HKP: 200 Pkt | 25,87€
0050 Abformung ein Kiefer: 120 Pkt | 15,52€
0060 Abformung beide Kiefer: 260 Pkt | 33,63€
0065 Digitale Abformung je Kieferhälfte: 80 Pkt | 10,35€
0070 Vitalitätsprüfung: 50 Pkt | 6,47€
0090 Infiltrationsanästhesie: 60 Pkt | 7,76€ (Anästhetika gesondert)
0100 Leitungsanästhesie: 70 Pkt | 9,05€ (Anästhetika gesondert)

GOZ Abschnitt B – Prophylaxe:
1000 Mundhygienestatus + Unterweisung (mind. 25 Min): 200 Pkt | 25,87€ | max. 1x/Jahr
1010 Kontrolle Übungserfolg (mind. 15 Min): 100 Pkt | 12,94€ | max. 3x/Jahr
1020 Lokale Fluoridierung: 50 Pkt | 6,47€ | max. 4x/Jahr
1040 PZR je Zahn/Implantat/Brückenglied: 28 Pkt | 3,62€ | NICHT neben 1020, 4050, 4055, 4060, 4070, 4075, 4090, 4100

GOZ Abschnitt C – Konservierend:
2000 Fissurenversiegelung je Zahn: 90 Pkt | 11,64€
2060 Komposit 1-flächig Adhäsiv: 527 Pkt | 68,17€
2080 Komposit 2-flächig Adhäsiv: 556 Pkt | 71,92€
2100 Komposit 3-flächig Adhäsiv: 642 Pkt | 83,05€
2120 Komposit >3-flächig Adhäsiv: 770 Pkt | 99,60€
2150 Inlay 1-flächig: 1141 Pkt | 147,60€
2160 Inlay 2-flächig: 1356 Pkt | 175,41€
2170 Inlay >2-flächig: 1709 Pkt | 221,07€
2197 Adhäsive Befestigung: 130 Pkt | 16,82€
2200 Vollkrone Tangential: 1322 Pkt | 171,01€
2210 Vollkrone Hohlkehl/Stufe: 1678 Pkt | 217,06€ (NICHT bei Implantaten)
2220 Teilkrone/Veneer: 2067 Pkt | 267,38€
2260 Provisorium direkt ohne Abformung: 100 Pkt | 12,94€
2270 Provisorium direkt mit Abformung: 270 Pkt | 34,93€
2290 Entfernung Krone/Inlay: 180 Pkt | 23,28€
2330 Indirekte Überkappung: 110 Pkt | 14,23€
2340 Direkte Überkappung: 200 Pkt | 25,87€
2410 Wurzelkanalaufbereitung je Kanal: 392 Pkt | 50,71€
2440 Wurzelkanalfüllung: 258 Pkt | 33,37€

GOZ Abschnitt D – Chirurgie (Primäre Wundversorgung IMMER enthalten – NICHT gesondert!):
3000 Extraktion einwurzelig: 70 Pkt | 9,05€
3010 Extraktion mehrwurzelig: 110 Pkt | 14,23€
3020 Extraktion tief frakturiert: 270 Pkt | 34,93€
3030 Extraktion durch Osteotomie: 350 Pkt | 45,27€
3040 Extraktion retiniert/verlagert: 540 Pkt | 69,85€
3045 Extraktion extrem verlagert: 767 Pkt | 99,22€
3110 WSR Frontzahn: 460 Pkt | 59,50€
3120 WSR Seitenzahn: 580 Pkt | 75,03€

GOZ Abschnitt E – Parodontium:
4000 Parodontalstatus: 160 Pkt | 20,70€ | max. 2x/Jahr
4050 Zahnsteinentfernung einwurzelig: 10 Pkt | 1,29€
4055 Zahnsteinentfernung mehrwurzelig: 13 Pkt | 1,68€
4070 Scaling/Wurzelglättung einwurzelig geschlossen: 100 Pkt | 12,94€
4075 Scaling/Wurzelglättung mehrwurzelig geschlossen: 130 Pkt | 16,82€
4090 Lappenop. Frontzahn: 180 Pkt | 23,28€
4100 Lappenop. Seitenzahn: 275 Pkt | 35,57€

GOZ Abschnitt F – Prothetik:
5000 Brückenanker Vollkrone Tangential: 1016 Pkt | 131,43€
5010 Brückenanker Vollkrone Hohlkehl: 1483 Pkt | 191,84€
5040 Brückenanker Teleskopkrone: 2605 Pkt | 336,97€
5070 Brückenglied je Spanne: 400 Pkt | 51,74€
5200 Teilprothese einfach: 700 Pkt | 90,55€
5210 Modellgussprothese: 1400 Pkt | 181,10€
5220 Totalprothese OK: 1850 Pkt | 239,31€
5230 Totalprothese UK: 2200 Pkt | 284,59€
5270 Teilunterfütterung: 180 Pkt | 23,28€
5280 Vollunterfütterung: 270 Pkt | 34,93€

GOZ Abschnitt H – Schienen:
7000 Aufbissbehelf ohne adjustierte Oberfläche: 270 Pkt | 34,93€
7010 Aufbissbehelf mit adjustierter Oberfläche (Michigan): 800 Pkt | 103,49€
7040 Kontrolle Aufbissbehelf: 65 Pkt | 8,41€
7050 Kontrolle adjustiert subtraktiv: 180 Pkt | 23,28€
7060 Kontrolle adjustiert additiv: 410 Pkt | 53,04€

GOZ Abschnitt K – Implantologie:
9010 Implantatinsertion je Implantat: 1545 Pkt | 199,86€
9040 Freilegen Implantat: 626 Pkt | 80,98€
9100 Augmentation je Kieferhälfte: 2694 Pkt | 348,49€
9110 Interner Sinuslift: 1500 Pkt | 194,04€
9120 Externer Sinuslift: 3000 Pkt | 388,07€

BEMA (GKV):
Ä1 Untersuchung: 17 Pkt, 1x/Quartal. NICHT mit IP1 kombinierbar.
23a Zahnstein: 19 Pkt/Kiefer, 1x/Quartal. NICHT mit PZR kombinierbar. Kombinierbar mit IP2.
13a Fissurenversiegelung: bis 17 Jahre, bleibende Molaren, kariesfrei.
IP1 Mundhygienestatus: 1x/Halbjahr. NICHT neben Ä1.
IP2 Prophylaxe: 1x/Halbjahr. Kombinierbar mit 23a.
46 Extraktion einfach | 47 Extraktion chirurgisch (Naht enthalten!) | 48 Osteotomie (Naht enthalten!)
98a PA-Status: 1x pro Behandlungsfall. Pflicht vor PAR-Behandlung.
17 Schiene: Kontrolle innerhalb 4 Wochen NICHT extra abrechenbar.
MU nach Prothese: innerhalb 3 Monate NICHT extra (außer neuer Anlass – dokumentieren!).

FESTZUSCHÜSSE:
Regelversorgung: 60% (Bonus 5J: 70%, 10J: 75%, Härtefall: 100%).
Gleichartig: halber Zuschuss. Anderartig: KEIN Zuschuss.
HKP immer VOR Behandlung mit Patientenunterschrift!

GEWÄHRLEISTUNG:
Füllungen GKV: 2 Jahre. Zahnersatz mit FZ (§136a SGB V): 5 Jahre.
Prothesen GKV: 5 Jahre. Implantate: keine gesetzliche Frist. GOZ/Privat: 2 Jahre (§634 BGB).

HÄUFIGE FEHLER:
1. 23a + PZR gleiche Sitzung GKV: VERBOTEN!
2. MU nach Prothese <3 Monate: NICHT abrechenbar (außer neuer Anlass).
3. GOZ >2,3-fach ohne Begründung: Unzulässig.
4. HKP ohne Unterschrift: Nie beginnen!
5. BEMA 47/48 + Wundnaht extra: Wundnaht ist enthalten!
6. IP1 + Ä1 gleiche Sitzung: NICHT kombinierbar.

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
        model: 'claude-sonnet-4-20250514',
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

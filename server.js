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

=== GOZ 2012 (Punktwert: 5,62421 Cent | Regelfall: 2,3-fach | Max: 3,5-fach) ===

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
2210 Vollkrone Hohlkehl/Stufe: 1678Pkt | 217,06€
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

=== BEMA 2026 (Stand: 01.01.2026, Anlage A zum BMV-Z) ===

ALLGEMEINE BESTIMMUNGEN:
- Leistung nur abrechenbar wenn Leistungsinhalt vollständig erbracht
- Nicht im BEMA enthaltene Leistungen → nach GOÄ (9 GOÄ-Punkte = 1 BEMA-Punkt)
- Wegegeld/Reiseentschädigung: gilt §8 Abs.2 und 3 GOZ

TEIL 1 – KONSERVIEREND, CHIRURGISCH, RÖNTGEN:

Untersuchung/Beratung:
Ä1 (Ber) Beratung: 9 Pkt | 1x/Quartal als alleinige Leistung oder neben 1. Leistung | NICHT neben 01 in selber Sitzung | NICHT neben Besuchsgebühr
01 (U) Eingehende Untersuchung inkl. Beratung: 18 Pkt | 1x/Halbjahr, frühestens nach 4 Monaten | NICHT neben Ä1 in selber Sitzung | NICHT neben FU1/FU2 im selben Halbjahr
01k KFO-Untersuchung (Indikation/Zeitpunkt): 28 Pkt | frühestens nach 6 Monaten erneut | NICHT neben 01
02 (Ohn) Hilfeleistung Ohnmacht/Kollaps: 20 Pkt | NICHT neben Ä1 in selber Sitzung
03 (Zu) Zuschlag außerhalb Sprechstunde/Nacht(20-8Uhr)/Sonn-Feiertag: 15 Pkt | NICHT neben 151-173, 55, 56, 61, 62 GOÄ

Befunde/Screening:
04 PSI-Erhebung (Parodontaler Screening-Index): Codes 0-4 je Sextant | 1x in 2 Jahren | NICHT während PAR-Behandlung
05 Zellmaterial-Gewinnung Mundhöhle (Bürstenabstrich, Exfoliativzytologie): 20 Pkt | nur bei Leukoplakie/Erythroplakie/Lichen planus | 1x/12 Monate

Röntgen:
Ä161 (Inz1) Eröffnung oberflächlicher Abszess: 15 Pkt
Ä925 Röntgendiagnostik Zähne: a) bis 2 Aufnahmen: 12 Pkt | b) bis 5 Aufnahmen: 19 Pkt | c) bis 8 Aufnahmen: 27 Pkt | d) Status >8 Aufnahmen: 34 Pkt
Ä928 Röntgen Hand: 30 Pkt
Ä934 Schädelaufnahme: a) 1 Aufnahme (auch FRS): 19 Pkt | b) 2 Aufnahmen: 30 Pkt | c) >2 Aufnahmen: 36 Pkt | im KFO-Verlauf max. 2x (Ausnahme: 3x)
Ä935 Teilaufnahme Schädel/OPG: a) 1 Aufnahme: 21 Pkt | b) 2 Aufnahmen: 25 Pkt | c) >2 Aufnahmen: 31 Pkt | d) OPG: 36 Pkt
Hinweis: Bis 3 nebeneinanderstehende Zähne = 1 Aufnahme. OPG schließt gleichzeitigen Rö-Status aus.

8 (ViPr) Sensibilitätsprüfung: 6 Pkt | auch bei Zahnersatz auf Erfassungsschein abrechnen

Konservierend:
10 (üZ) Überempfindliche Zähne je Sitzung: 6 Pkt | keine prophylaktischen Maßnahmen
11 (pV) Exkavieren + provisorischer Verschluss (alleinige Leistung): 19 Pkt
12 (bmf) Besondere Maßnahmen Präparieren/Füllen (Separieren, Spanngummi, Zahnfleisch) je Sitzung je Kieferhälfte/Frontzahn: 10 Pkt | NICHT für Verdrängung zum Abformen
13 (F1/F2/F3/F4) Kavitätenpräparation + plastische Füllung inkl. Unterfüllung:
  a) einflächig: 33 Pkt
  b) zweiflächig: 41 Pkt
  c) dreiflächig: 53 Pkt
  d) >dreiflächig oder Eckenaufbau Frontzahn mit Schneidekante: 63 Pkt
  Hinweis: Im Frontzahn adhäsiv, im Seitenzahn selbstadhäsiv/Bulkfill. Lage in Bemerkungsspalte angeben (m=1, o=2, d=3, v=4, l=5). NICHT neben 16 bei 13a und 13b.
14 Konfektionierte Krone Milchzahn (Seitenzahn, pädiatrisch): 50 Pkt inkl. Material+Labor
16 (St) Stiftverankerung (zusätzlich zu 13c/d) je Zahn inkl. Material: 20 Pkt
23 (Ekr) Entfernen Krone/Brückenanker/Wurzelstift/Brückenglied je Trennstelle: 17 Pkt
25 (Cp) Indirekte Überkappung (Pulpaschutz): 6 Pkt | NICHT bei zeitlichen Gründen/Schmerzabbruch
26 (P) Direkte Überkappung je Zahn: 6 Pkt | bei artifizieller/traumatischer Pulpaeröffnung
27 (Pulp) Pulpotomie (Milchzahn + symptomloser bleibender Zahn mit offenem Apex): 29 Pkt | bei Milchzähnen nur mit gleichzeitiger 13a-d oder 14
28 (VitE) Exstirpation vitale Pulpa je Kanal: 18 Pkt
29 (Dev) Devitalisierung inkl. Verschluss je Zahn: 11 Pkt
31 (Trep1) Trepanation pulpatomter Zahn: 11 Pkt | NICHT bei gleichzeitiger Devitalisierung
32 (WK) Wurzelkanalaufbereitung je Kanal: 29 Pkt
34 (Med) Medikamentöse Einlage (mit 28/29/32) inkl. prov. Verschluss je Zahn/Sitzung: 15 Pkt | max. 3 Sitzungen
35 (WF) Wurzelkanalfüllung inkl. prov. Verschluss je Kanal: 17 Pkt

Blutstillung:
36 (Nbl1) Stillung übermäßiger Blutung: 15 Pkt | NICHT im zeitlichen Zusammenhang mit chirurgischem Eingriff (außer erheblicher Mehraufwand)
37 (Nbl2) Stillung durch Abbinden/Umstechen/Knochenbolzung: 29 Pkt

Nachbehandlung:
38 (N) Nachbehandlung nach chirurgischem Eingriff, je Kieferhälfte/Frontzahn, je Sitzung: 10 Pkt | NICHT neben 36, 37, 46 an gleicher Stelle

Anästhesie:
40 (I) Infiltrationsanästhesie: 8 Pkt | im Bereich 2 nebeneinanderstehender Zähne nur 1x/Sitzung | bei langen Eingriffen 2x | intraligamentäre Anästhesie = Nr. 40
41 (L1/L2) Leitungsanästhesie: a) intraoral: 12 Pkt | b) extraoral: 16 Pkt | nur wenn Infiltration nicht ausreicht (UK in der Regel, OK bei Entzündung/großen Eingriffen)

Chirurgie:
43 (X1) Extraktion einwurzelig inkl. Wundversorgung: 10 Pkt
  Einwurzelig bleibend: alle Frontzähne, OK-5, UK-4, UK-5
  Einwurzelig Milch: alle Frontzähne
44 (X2) Extraktion mehrwurzelig inkl. Wundversorgung: 15 Pkt
  Mehrwurzelig bleibend: alle Molaren, OK-4
  Mehrwurzelig Milch: alle Milchmolaren
45 (X3) Extraktion tief frakturiert inkl. Wundversorgung: 40 Pkt
46 (XN) Chirurgische Wundrevision (Glätten, Auskratzen, Naht) je Kieferhälfte/Frontzahn: 21 Pkt
47a (Ost1) Osteotomie inkl. Wundversorgung (setzt Aufklappung voraus): 58 Pkt
47b (Hem) Hemisektion/Teilextraktion mehrwurzeliger Zahn: 72 Pkt | nur in Ausnahmefällen
48 (Ost2) Entfernung verlagert/retiniert/impaktiert durch Osteotomie: 78 Pkt
49 (Exz1) Exzision Mundschleimhaut/Granulationsgewebe je Zahn: 10 Pkt | NICHT neben anderer chir. Leistung gleiche Stelle/Sitzung
50 (Exz2) Exzision Schleimhautwucherung (Fibrom, Epulis): 37 Pkt | NICHT neben anderer chir. Leistung gleiche Stelle
51a (Pla1) Plastischer Verschluss Kieferhöhle durch Zahnfleischplastik: 80 Pkt
51b (Pla0) Plastischer Verschluss Kieferhöhle + Osteotomie: 40 Pkt
52 (Trep2) Trepanation Kieferknochen: 24 Pkt
53 (Ost3) Sequestrotomie Osteomyelitis: 72 Pkt
54 (WR1/WR2/WR3) Wurzelspitzenresektion:
  a) Frontzahn: 72 Pkt
  b) Seitenzahn 1. resezierte Wurzelspitze: 96 Pkt
  c) selber Seitenzahn weiterer Zugang: 48 Pkt
  Retrograde Füllung nach WSR: separat nach 32 + 35
55 (RI) Reimplantation inkl. einfacher Fixation: 72 Pkt
56 (ZY1-4) Zystenoperation:
  a) Zystektomie: 120 Pkt
  b) Orale Zystostomie: 72 Pkt
  c) Zystektomie + Osteotomie/WSR: 48 Pkt
  d) Orale Zystostomie + Osteotomie/WSR: 48 Pkt
57 (SMS) Beseitigung Schleimhautbänder/Muskelansätze/Schlotterkamm je Sitzung: 48 Pkt
58 (KNR) Knochenresektion Alveolarfortsatz je Sitzung: 48 Pkt | NICHT im zeitl. Zusammenhang mit Extraktion/Osteotomie
59 (Pla2) Mundboden-/Vestibulumplastik: 120 Pkt
60 (Pla3) Tuberplastik einseitig: 80 Pkt
61 (Dia) Korrektur Lippenbändchen (echtes Diastema mediale, Septum durchtrennt): 72 Pkt
62 (Alv) Alveolotomie (ab 4 Zähne je Kiefer): 36 Pkt | ab 8 Zähne: 2x abrechenbar
63 (Fl) Freilegung retiniert/verlagert für KFO: 80 Pkt

Allgemeine Leistungen:
105 (Mu) Lokale medikamentöse Behandlung Schleimhauterkrankungen/Prothesendruckstellen je Sitzung: 8 Pkt | Prothesendruckstellen nur wenn Prothese >3 Monate eingegliedert
106 (sK) Beseitigung scharfer Zahnkanten/störende Prothesenränder je Sitzung: 10 Pkt | Prothesenränder nur wenn Prothese >3 Monate
107 (Zst) Zahnsteinentfernung je Sitzung: 16 Pkt | 1x/Kalenderjahr | NICHT wenn 107a im selben Kalenderhalbjahr
107a (PBZst) Zahnsteinentfernung Pflegebedürftige (Pflegegrad §15 SGB XI / Eingliederungshilfe §99 SGB IX): 16 Pkt | 1x/Kalenderhalbjahr

Besuche:
151 (Bs1) Besuch inkl. Beratung + eingehende Untersuchung: 38 Pkt | NICHT neben 153a/b, 154, 155
152 (Bs2a/b) Besuch weiterer Patient: a) selbe häusliche Gemeinschaft: 34 Pkt | b) selbe Einrichtung: 26 Pkt
153 (Bs3a/b) Besuch Einrichtung zu vereinbarten Zeiten OHNE Kooperationsvertrag §119b: a) 30 Pkt | b) weiterer Patient: 26 Pkt
154 (Bs4) Besuch Pflegeeinrichtung MIT Kooperationsvertrag §119b: 30 Pkt
155 (Bs5) Besuch weiterer Patient MIT Kooperationsvertrag: 26 Pkt
161 Zuschläge Besuche 151/154: a) Dringend/unverzüglich: 18 Pkt | b) Mo-Fr 20-22/6-8 Uhr: 29 Pkt | c) Mo-Fr 22-6 Uhr: 50 Pkt | d) Sa/So/Feiertag 8-20 Uhr: 38 Pkt | e) Sa/So/Feiertag 20-22/6-8 Uhr: 67 Pkt | f) Sa/So/Feiertag 22-6 Uhr: 88 Pkt
162 Zuschläge Besuche 152/155: a) Dringend: 9 Pkt | b) Mo-Fr 20-22/6-8 Uhr: 15 Pkt | c) Mo-Fr 22-6 Uhr: 25 Pkt | d) Sa/So/Feiertag 8-20 Uhr: 19 Pkt | e) Sa/So/Feiertag 20-22/6-8 Uhr: 34 Pkt | f) Sa/So/Feiertag 22-6 Uhr: 44 Pkt
165 (ZKi) Zuschlag Kinder bis 4 Jahre bei Besuchen: 14 Pkt
171 (PBA1a/b) Zuschlag Pflegebedürftige/Eingliederungshilfe bei Besuchen 151/152: a) 37 Pkt | b) weiterer: 30 Pkt
172 (SP1a/b) Zuschlag §87 Abs.2j SGB V Kooperationsvertrag Pflegeeinrichtung: a) 40 Pkt | b) weiterer: 32 Pkt
173 (ZBs3a/b) Zuschlag Pflegebedürftige bei Besuchen 153: a) 32 Pkt | b) weiterer: 24 Pkt
174 (PBa/b) Präventive Leistungen §22a SGB V Pflegebedürftige/Eingliederungshilfe:
  a) Mundgesundheitsstatus + individueller Mundgesundheitsplan: 20 Pkt | 1x/Halbjahr
  b) Mundgesundheitsaufklärung: 26 Pkt | 1x/Halbjahr
  NICHT neben IP1, IP2, FU1, FU2, MHU, UPTa, UPTb am selben Tag

Telematik/Video:
181 (Ksl) Konsiliarische Erörterung: a) persönlich/fernmündlich: 14 Pkt | b) Telekonsil: 16 Pkt
182 (KslK) Konsiliarische Erörterung im Kooperationsvertrag §119b: a) 14 Pkt | b) Telekonsil: 16 Pkt
VS Videosprechstunde: 16 Pkt | nur Pflegebedürftige/Eingliederungshilfe oder Kooperationsvertrag §119b | NICHT neben VFK, 181, 182
VFK Videofallkonferenz: a) 12 Pkt | b) weiterer Patient: 6 Pkt | max. 3x/Quartal/Patient
TZ Technikzuschlag Video: 16 Pkt | max. 10x/Quartal/Praxis
eMP Elektronischer Medikationsplan Aktualisierung: 3 Pkt | 1x/Sitzung
NFD Notfalldatensatz Aktualisierung: 6 Pkt | 1x/Sitzung
ePA1 Erstbefüllung elektronische Patientenakte: 4 Pkt | einmalig je Patient/ePA
ePA2 Aktualisierung elektronische Patientenakte: 2 Pkt | max. 1x/Sitzung | NICHT neben ePA1

Prophylaxe Kinder/Jugendliche (6-17 Jahre):
IP1 Mundhygienestatus: 20 Pkt | 1x/Halbjahr | nur 6. bis <18. Lebensjahr | NICHT neben Ä1
IP2 Mundgesundheitsaufklärung Kinder/Jugendliche: 17 Pkt | 1x/Halbjahr | Einzelunterweisung
IP4 Lokale Fluoridierung: 12 Pkt | 1x/Halbjahr (bei hohem Kariesrisiko 2x/Halbjahr ab 6.Lj)
IP5 Fissurenversiegelung kariesfreie Fissuren bleibende Molaren (6er+7er) je Zahn: 16 Pkt

Früherkennungsuntersuchungen:
FU1 Zahnärztliche FU Kind 6.-33. Lebensmonat (FUZ1/2/3): 28 Pkt | Mindestabstand 4 Monate | NICHT neben 01 im selben Halbjahr | NICHT neben Ä1
FU Pr Praktische Anleitung Betreuungspersonen Mundhygiene: 10 Pkt | nur mit FU1
FU2 Zahnärztliche FU Kind 34.-72. Lebensmonat (FUZ4/5/6): 26 Pkt | Mindestabstand 12 Monate | NICHT neben 01 im selben Halbjahr
FLA Fluoridlackanwendung 6.-72. Lebensmonat: 14 Pkt | 2x/Halbjahr

TEIL 2 – KIEFERBRUCH, KIEFERGELENK, SCHIENE, SCHLAFAPNOE:
2 Heil- und Kostenplan: 20 Pkt | NICHT für Unterkieferprotrusionsschiene (UP1-UP6)
7 Vorbereitende Maßnahmen (Abformung/Bissnahme/Modelle+Planung): a) 3D-orientiert (nur KFO, max. 3x): 19 Pkt | b) Standard (Zahnersatz/Kieferbruch/UP): 19 Pkt
K1 Aufbissbehelf adjustiert: 106 Pkt | mit Kostenübernahmeerklärung KK | auch für PAR
K2 Aufbissbehelf ohne adjustierte Oberfläche (bei Akutschmerz): 45 Pkt
K3 Umarbeitung Prothese zum Aufbissbehelf adjustiert: 61 Pkt
K4 Semipermanente Schienung Ätztechnik je Interdentalraum: 11 Pkt | auch für PAR
K6 Wiederherstellung/Unterfütterung Aufbissbehelf: 30 Pkt
K7 Kontrollbehandlung + einfache Korrekturen: 6 Pkt | je Sitzung nur 1x K6-K9
K8 Kontrolle mit Einschleifen (subtraktiv): 12 Pkt
K9 Kontrolle mit Aufbau adjustierter Oberfläche (additiv): 35 Pkt
Unterkieferprotrusionsschiene (Schlafapnoe, nur auf Veranlassung Schlafmediziner):
UP1 Untersuchung UPS inkl. Beratung: 27 Pkt
UP2 Abformung + 3D-Registrierung Startprotrusionsposition: 49 Pkt
UP3 Eingliedern UPS (zweiteilig, bimaxillär, individuell adjustierbar): 223 Pkt
UP4 Nachadaption Protrusionsgrad: 10 Pkt
UP5 Kontrollbehandlung UPS: a) einfach: 8 Pkt | b) Einschleifen subtraktiv: 12 Pkt | c) Aufbau additiv: 35 Pkt | je Sitzung nur 1x
UP6 Wiederherstellung UPS: a) klein ohne Abformung: 25 Pkt | b) groß mit Abformung: 42 Pkt | c) Teilunterfütterung: 37 Pkt | d) Halte-/Stützvorrichtung: 19 Pkt | e) Protrusionselement: 19 Pkt
Sonderversorgung/Defekte:
101 Weichteilstützung Kieferdefekte: a) mit Restgebiss: 80 Pkt | b) zahnlos: 120 Pkt
102 Obturator weicher Gaumen: 240 Pkt
103 Resektionsprothesen: a) temporär: 160 Pkt | b) Ergänzung: 80 Pkt | c) Dauerprothese: 300 Pkt
104 Prothese/Epithese Weichteildefekte: a) klein: 300 Pkt | b) groß: 500 Pkt

TEIL 3 – KIEFERORTHOPÄDIE:
5 KFO-Behandlungsplanung (Therapiekonzept+Aufklärung+Behandlungsplan): 95 Pkt | NICHT bei Verlängerungsantrag/Therapieänderung/Retention
116 Fotografie (Profil/en-face mit Auswertung) je Aufnahme: 15 Pkt | max. 4x im KFO-Verlauf
117 Modellanalyse je Nr.7a: 35 Pkt | max. 3x (KFO+Chir: 4x)
118 Kephalometrische Auswertung je FRS: 29 Pkt | max. 2x (Ausnahme: 3x)
119 Kiefer-Umformung inkl. Retention:
  a) einfach (5-7 Pkt Bewertungssystem): 132 Pkt quartalsweise
  b) mittelschwer (8-10 Pkt): 204 Pkt
  c) schwierig (11-15 Pkt): 276 Pkt
  d) besonders schwierig (>=16 Pkt): 336 Pkt
120 Unterkiefereinstellung Regelbiss inkl. Retention:
  a) einfach (4-8 Pkt): 204 Pkt
  b) mittelschwer (9-10 Pkt): 228 Pkt
  c) schwierig (11-12 Pkt): 276 Pkt
  d) besonders schwierig (>=13 Pkt): 336 Pkt
121 Habits-Beseitigung je Sitzung: 17 Pkt | max. 6x in 6 Monaten | NICHT neben 119/120
122 KFO-Verrichtungen: a) Kontrolle + kleine Änderungen: 21 Pkt | b) Vorbereitung Herstellung: 43 Pkt | c) Einfügen je Kiefer: 27 Pkt
123a Lückenhalter herausnehmbar je Kiefer: 40 Pkt
123b Kontrolle Lückenhalter je Quartal: 14 Pkt
124 Einschleifen Milchzähne Kreuz-/Zwangsbiss je Sitzung: 16 Pkt | max. 2x
125 Wiederherstellung Behandlungsmittel inkl. Wiedereinfügen je Kiefer: 30 Pkt
126a Bracket/Attachment Edelstahl/nickelfrei inkl. Material: 18 Pkt je Bracket
126b Band inkl. Material: 42 Pkt je Band
126c Wiedereingliederung Band: 30 Pkt
126d Entfernung Band/Bracket/Attachment: 6 Pkt
127a Teilbogen Edelstahl inkl. Material: 25 Pkt
127b Ausgliederung Teilbogen: 7 Pkt
128a Konfektionierter Vollbogen Edelstahl inkl. Material: 32 Pkt
128b Individualisierter Vollbogen Edelstahl (min. 3 Biegungen 2.Ord. oder 1 Biegung 3.Ord.): 40 Pkt
128c Ausgliederung Vollbogen: 9 Pkt
129 Wiedereingliederung Voll-/Teilbogen: 24 Pkt
130 Ergänzende festsitzende Apparatur (Palatinalbogen, Quadhelix, Lingualbogen, Headgear): 72 Pkt
131a Gaumennahterweiterungsapparatur Ein-/Ausgliederung: 50 Pkt
131b Herbstscharnier-Apparatur bei spätem Behandlungsbeginn je Seite: 50 Pkt
131c Gesichtsmaske Eingliederung: 50 Pkt

TEIL 4 – PARODONTOLOGIE (PAR):
4 (Befund) Befunderhebung + Parodontalstatus: 44 Pkt | Pflicht vor PAR
ATG Parodontologisches Aufklärungs- und Therapiegespräch: 28 Pkt | NICHT neben Ä1 in selber Sitzung
MHU Patientenindividuelle Mundhygieneunterweisung: 45 Pkt | im zeitl. Zusammenhang mit AIT | NICHT neben Ä1 in selber Sitzung
AIT Antiinfektiöse Therapie (subgingivales Debridement >=4mm Taschentiefe, geschlossenes Vorgehen):
  a) je einwurzeliger Zahn: 14 Pkt
  b) je mehrwurzeliger Zahn: 26 Pkt
  Möglichst innerhalb 4 Wochen abschließen | 105, 107, 107a während/danach abgegolten | Gingivektomie abgegolten
BEV Befundevaluation (3-6 Monate nach AIT bzw. CPT):
  a) nach AIT: 32 Pkt
  b) nach CPT: 32 Pkt
  Dokumentation: Sondierungstiefen, Sondierungsblutung, Lockerung, Furkation, Röntgen, Knochenabbau %/Alter | NICHT neben Ä1
CPT Chirurgische Therapie (offenes Vorgehen, Lappenop., nach AIT, bei >=6mm):
  a) je einwurzeliger Zahn: 22 Pkt
  b) je mehrwurzelig Zahn: 34 Pkt
  105, 107, 107a während/danach abgegolten
UPT Unterstützende Parodontitistherapie (2-Jahres-Zeitraum, Verlängerung max. 6 Monate):
  a) Mundhygienekontrolle: 18 Pkt
  b) Mundhygieneunterweisung: 24 Pkt | NICHT neben Ä1
  c) Supragingivale Reinigung je Zahn: 3 Pkt
  d) Messung Sondierungstiefen/Blutung: 15 Pkt
  e) Subgingivale Instrumentierung >=4mm+Blutung/alle >=5mm, einwurzelig: 5 Pkt
  f) Subgingivale Instrumentierung, mehrwurzelig: 12 Pkt
  g) Parodontalzustand-Untersuchung + Dokumentation: 32 Pkt
  Frequenz nach PAR-Grad:
    Grad A: max. 2x/2 Jahre, Mindestabstand 10 Monate
    Grad B: max. 4x/2 Jahre, Mindestabstand 5 Monate
    Grad C: max. 6x/2 Jahre, Mindestabstand 3 Monate
108 Einschleifen natürliches Gebiss (Kauebenenausgleich) je Sitzung: 6 Pkt | NICHT neben konservierend/prothetisch/chirurgisch
111 Nachbehandlung PAR je Sitzung: 10 Pkt | NICHT neben 38, 105 an gleicher Stelle

TEIL 5 – ZAHNERSATZ:
18 Vorbereitung endodontisch behandelter Zahn für Krone (Stiftaufbau):
  a) konfektionierter Stift einzeitig: 50 Pkt | nur mit 20+91
  b) gegossener Stiftaufbau zweizeitig: 80 Pkt | nur mit 20+91
19 Provisorische Krone/Brückenglied (Schutz beschliffener Zahn): 19 Pkt | max. 2x/Zahn
20 Einzelzahnversorgung (inkl. Präparation, Abformung, Einprobe, Zementierung, Okklusionskontrolle):
  a) Metallische Vollkrone: 148 Pkt
  b) Verblendkrone vestibulär: 158 Pkt
  c) Metallische Teilkrone (alle Höcker überkuppelt, überwiegend supragingival): 187 Pkt
21 Provisorium mit Stiftverankerung: 28 Pkt | max. 2x/Zahn
22 Teilleistungen nicht vollendete 18/20: Präparation = halbe BZ, weitere Maßnahmen = 3/4 BZ
23 Entfernen Krone/Brückenanker/Wurzelstift je Trennstelle: 17 Pkt
24 Wiederherstellung Kronenfunktion: a) Wiedereinsetzen Krone: 25 Pkt | b) Erneuerung/Wiedereinsetzen Facette/Verblendschale: 43 Pkt | c) Abnahme+Wiederbefestigung Provisorium: 7 Pkt (max. 3x/Krone)
89 Artikulations-/Okklusionsstörungen beseitigen vor Eingliederung Prothese/Brücke: 16 Pkt | 1x/HKP
90 Wurzelstiftkappe mit Kugelknopfanker: 154 Pkt | nur bei Cover-Denture <=3 Zähne/Kiefer
91 Brücke je Pfeilerzahn (inkl. Präparation, Abformung, Einprobe, Zementierung):
  a) Vollkrone: 118 Pkt
  b) Verblendkrone: 128 Pkt
  c) Teilkrone: 136 Pkt
  d) Teleskop-/Konuskrone: 190 Pkt
  e) Geschiebeverbindung zusätzlich: 43 Pkt
92 Brücke je Spanne: 62 Pkt
93a Adhäsivbrücke Frontzahn 1 Flügel (Metall): 240 Pkt
93b Adhäsivbrücke Frontzahn 2 Flügel (Metall): 335 Pkt
95 Wiederherstellung Brückenfunktion: a) 2 Anker: 34 Pkt | b) >2 Anker: 50 Pkt | c) Facette/Verblend.: 36 Pkt | d) Prov.-Brücke: 18 Pkt | e) Einflügel-Adhäsiv: 61 Pkt | f) Zweiflügel-Adhäsiv: 85 Pkt
96 Partielle Prothese inkl. einfacher Haltevorrichtungen:
  a) 1-4 fehlende Zähne: 57 Pkt
  b) 5-8 fehlende Zähne: 83 Pkt
  c) >8 fehlende Zähne: 115 Pkt
97a Totalprothese/Cover-Denture OK: 250 Pkt
97b Totalprothese/Cover-Denture UK: 290 Pkt
98a Abformung individueller/individualisierter Löffel je Kiefer: 29 Pkt
98b Funktionsabformung individueller Löffel OK (zahnlos/stark reduziert <=3 Zähne): 57 Pkt
98c Funktionsabformung individueller Löffel UK: 76 Pkt
98d Intraorale Stützstiftregistrierung Zentrallage: 23 Pkt | nur neben 97 (Total/Cover-Denture)
98e Metallbasis (Ausnahme Torus palatinus, Exostosen): 16 Pkt | zusätzlich zu 97a/b
98f Doppelarmige Halte-/Stützvorrichtungen je Prothese (nur Interimsprothese): 22 Pkt
98g Metallbasis + Halte-/Stützvorrichtungen (NICHT Interimsprothese): 44 Pkt
98h Gegossene Halte-/Stützvorrichtungen: h/1 = 1 Vorrichtung: 29 Pkt | h/2 = >=2 Vorrichtungen: 50 Pkt
99 Teilleistungen nicht vollendete 96/97/98: a) Anatomischer Abdruck: 19 Pkt | b) Maßnahmen inkl. Bissverhältnis = halbe BZ | c) Weitergehende Maßnahmen = 3/4 BZ
100 Wiederherstellung/Erweiterung Prothese:
  a) klein ohne Abformung: 30 Pkt
  b) groß mit Abformung: 50 Pkt
  c) Teilunterfütterung: 44 Pkt
  d) Vollunterfütterung indirekt: 55 Pkt
  e) Vollunterfütterung indirekt OK+Randgestaltung: 81 Pkt
  f) Vollunterfütterung indirekt UK+Randgestaltung: 81 Pkt

HÄUFIGE ABRECHNUNGSFEHLER BEMA:
- 107 (Zahnstein) + PZR (GOZ 1040) gleiche Sitzung: VERBOTEN
- Ä1 + 01 in selber Sitzung: NICHT möglich
- IP1 + Ä1 in selber Sitzung: NICHT möglich
- 174a/b + IP1/IP2/FU1/FU2/MHU/UPTa/UPTb am selben Tag: NICHT möglich
- AIT + 105/107/107a separat: BEREITS ENTHALTEN
- CPT + 105/107/107a separat: BEREITS ENTHALTEN
- Naht bei 47a/47b/48 separat: BEREITS ENTHALTEN
- MU nach Prothese <3 Monate: NICHT abrechenbar
- HKP ohne Unterschrift beginnen: NIE!
- 03 (Zuschlag) neben 151-173: NICHT möglich
- K1-K4 ohne Kostenübernahmeerklärung KK: NICHT möglich

=== FESTZUSCHÜSSE (FZ-RL, gültig ab 01.01.2026) ===

GRUNDPRINZIP:
- Regelversorgung: 60% (5J Bonus: 70%, 10J Bonus: 75%, Härtefall: 100%)
- Gleichartig: halber Festzuschuss | Anderartig: KEIN Festzuschuss
- HKP VOR Behandlung unterschrieben + genehmigt!
- Neuer ZE-Punktwert ab 01.01.2026: 1,1844 € (+4,78% gegenüber 2025)
- BEL II-Preise ab 01.01.2026: +4,78% gegenüber 2025

BEFUNDKLASSE 1 – ERHALTUNGSWÜRDIGER ZAHN:
1.1 Weitgehende Zerstörung/unzureichende Retention, je Zahn:
    60%: 239,03€ | 70%: 278,87€ | 75%: 298,79€ | 100%: 398,39€
    Regelversorgung: Metallische Vollkrone (BEMA 20a) + zahntechn. Leistungen
    ZA-Anteil: 201,93€ | ZT-Anteil: 196,46€

1.2 Große Substanzdefekte, erhaltene vestibuläre/orale Zahnsubstanz, je Zahn:
    60%: 274,36€ | 70%: 320,09€ | 75%: 342,95€ | 100%: 457,27€
    Regelversorgung: Metallische Teilkrone (BEMA 20c)
    ZA-Anteil: 245,84€ | ZT-Anteil: 211,43€

1.3 Weitgehende Zerstörung im Verblendbereich (15-25, 34-44), je Verblendung für Kronen (auch implantatgestützte):
    60%: 80,66€ | 70%: 94,11€ | 75%: 100,83€ | 100%: 134,44€
    ZA-Anteil: 12,61€ | ZT-Anteil: 121,83€

1.4 Endodontisch behandelter Zahn, konfektionierter metallischer Stiftaufbau, je Zahn:
    60%: 50,11€ | 70%: 58,46€ | 75%: 62,64€ | 100%: 83,52€
    ZA-Anteil: 59,22€ | ZT-Anteil: 24,30€

1.5 Endodontisch behandelter Zahn, gegossener metallischer Stiftaufbau, je Zahn:
    60%: 150,94€ | 70%: 176,10€ | 75%: 188,68€ | 100%: 251,57€
    ZA-Anteil: 113,95€ | ZT-Anteil: 137,62€

KOMBINATIONSREGEL 1.3/2.7/4.7:
- 1.3 kombinierbar mit 1.1 je Einzelkrone im Verblendbereich
- 2.7 kombinierbar mit 2.1-2.6 je Ankerkrone + je Brückenzwischenglied im Verblendbereich
- 4.7 kombinierbar mit 3.2, 4.6, 6.10 je Teleskopkrone im Verblendbereich
- Für lückenangrenzende Zähne nach Befunden Nr.2: 1.1-1.3 NICHT ansetzbar

BEFUNDKLASSE 2 – ZAHNBEGRENZTE LÜCKEN (Lückensituation I, max. 4 fehlende Zähne, keine Freiendsituation):
HINWEIS: Fehlender Zahn 7 = Freiendsituation (außer Zahn 8 als Brückenanker verwendbar)
Fehlender Weisheitszahn wird NICHT mitgezählt.

2.1 Zahnbegrenzte Lücke 1 fehlender Zahn, je Lücke:
    60%: 552,96€ | 70%: 645,12€ | 75%: 691,20€ | 100%: 921,60€
    ZA-Anteil: 452,17€ | ZT-Anteil: 469,43€
    Sonderregel: Bei gleichzeitigem OK-Befund für Brücke (bis 2 nebeneinander fehlende Schneidezähne) + herausnehmbarer ZE bei beidseitiger Freiendsituation: zusätzlich 3.1 ansetzbar

2.2 Zahnbegrenzte Lücke 2 nebeneinander fehlende Zähne, je Lücke:
    60%: 631,10€ | 70%: 736,29€ | 75%: 788,88€ | 100%: 1.051,84€
    ZA-Anteil: 479,75€ | ZT-Anteil: 572,09€

2.3 Zahnbegrenzte Lücke 3 nebeneinander fehlende Zähne, je Kiefer:
    60%: 704,93€ | 70%: 822,42€ | 75%: 881,17€ | 100%: 1.174,89€
    ZA-Anteil: 503,03€ | ZT-Anteil: 671,86€

2.4 Frontzahnlücke 4 nebeneinander fehlende Zähne, je Kiefer:
    60%: 772,74€ | 70%: 901,53€ | 75%: 965,93€ | 100%: 1.287,90€
    ZA-Anteil: 522,32€ | ZT-Anteil: 765,58€

2.5 An eine Lücke unmittelbar angrenzende weitere zahnbegrenzte Lücke mit 1 fehlenden Zahn:
    60%: 306,81€ | 70%: 357,95€ | 75%: 383,51€ | 100%: 511,35€
    ZA-Anteil: 267,94€ | ZT-Anteil: 243,41€

2.6 Disparallele Pfeilerzähne zur festsitzenden ZE-Versorgung, Zuschlag je Lücke:
    60%: 227,23€ | 70%: 265,10€ | 75%: 284,03€ | 100%: 378,71€
    ZA-Anteil: 64,24€ | ZT-Anteil: 314,47€

2.7 Fehlender Zahn im Verblendbereich (15-25, 34-44), je Verblendung für ersetzten Zahn (auch lückenangrenzender Brückenanker). NICHT für Flügel einer Adhäsivbrücke:
    60%: 79,46€ | 70%: 92,71€ | 75%: 99,33€ | 100%: 132,44€
    ZA-Anteil: 7,80€ | ZT-Anteil: 124,64€

BEFUNDKLASSE 3 – LÜCKENSITUATION II / FREIENDSITUATION:
3.1 Alle zahnbegrenzten Lücken nicht nach 2.1-2.5 und 4, oder Freiendsituationen, je Kiefer:
    60%: 571,29€ | 70%: 666,51€ | 75%: 714,11€ | 100%: 952,15€
    ZA-Anteil: 251,49€ | ZT-Anteil: 700,66€
    Regelversorgung: Partielle Prothese (BEMA 96a/b/c)

3.2 Verkürzte/unterbrochene Zahnreihe mit Notwendigkeit dentaler Verankerung (Kombinationsversorgung), je Eckzahn oder erstem Prämolar (max. 2x je Kiefer):
    Voraussetzungen: a) beidseitig bis Eckzahn/1.Prämolar verkürzt, b) einseitig bis Eckzahn/1.Prämolar + kontralateral >=2 nebeneinander fehlende Zähne, c) beidseitig im Seitenzahngebiet >=2 nebeneinander fehlend
    60%: 400,75€ | 70%: 467,54€ | 75%: 500,93€ | 100%: 667,91€
    ZA-Anteil: 272,82€ | ZT-Anteil: 395,09€
    Regelversorgung: Teleskopkrone (BEMA 91d)

BEFUNDKLASSE 4 – RESTZAHNBESTAND BIS 3 ZÄHNE / ZAHNLOSER KIEFER:
4.1 Restzahnbestand bis 3 Zähne im Oberkiefer:
    60%: 596,88€ | 70%: 696,36€ | 75%: 746,10€ | 100%: 994,80€
    ZA-Anteil: 307,42€ | ZT-Anteil: 687,38€

4.2 Zahnloser Oberkiefer:
    60%: 576,44€ | 70%: 672,52€ | 75%: 720,56€ | 100%: 960,74€
    ZA-Anteil: 369,77€ | ZT-Anteil: 590,97€

4.3 Restzahnbestand bis 3 Zähne im Unterkiefer:
    60%: 616,79€ | 70%: 719,59€ | 75%: 770,99€ | 100%: 1.027,99€
    ZA-Anteil: 328,05€ | ZT-Anteil: 699,94€

4.4 Zahnloser Unterkiefer:
    60%: 617,72€ | 70%: 720,68€ | 75%: 772,16€ | 100%: 1.029,54€
    ZA-Anteil: 438,93€ | ZT-Anteil: 590,61€

4.5 Metallbasis, Zuschlag je Kiefer (nur bei Ausnahmeindikation: Torus palatinus, Exostosen):
    60%: 133,24€ | 70%: 155,45€ | 75%: 166,55€ | 100%: 222,07€
    ZA-Anteil: 18,95€ | ZT-Anteil: 203,12€

4.6 Restzahnbestand bis 3 Zähne mit dentaler Verankerung (Kombinationsversorgung), je Ankerzahn:
    60%: 410,51€ | 70%: 478,93€ | 75%: 513,14€ | 100%: 684,18€
    ZA-Anteil: 267,68€ | ZT-Anteil: 416,50€
    Regelversorgung: Teleskopkrone (BEMA 91d)

4.7 Verblendung Teleskopkrone im Verblendbereich (15-25, 34-44), Zuschlag je Ankerzahn:
    60%: 65,29€ | 70%: 76,17€ | 75%: 81,62€ | 100%: 108,82€
    ZA-Anteil: 0,00€ | ZT-Anteil: 108,82€

4.8 Restzahnbestand bis 3 Zähne mit dentaler Verankerung durch Wurzelstiftkappen, je Ankerzahn:
    60%: 371,72€ | 70%: 433,68€ | 75%: 464,66€ | 100%: 619,54€
    ZA-Anteil: 210,51€ | ZT-Anteil: 409,03€

4.9 Stützstiftregistrierung bei Totalprothesen/schleimhautgetr. Deckprothesen, Zuschlag je Gesamtbefund:
    60%: 94,17€ | 70%: 109,87€ | 75%: 117,71€ | 100%: 156,95€
    ZA-Anteil: 27,24€ | ZT-Anteil: 129,71€

BEFUNDKLASSE 5 – INTERIMSPROTHESE (endgültige Versorgung nicht sofort möglich):
5.1 Lückengebiss bis 4 fehlende Zähne je Kiefer, je Kiefer:
    60%: 199,15€ | 70%: 232,34€ | 75%: 248,94€ | 100%: 331,92€
    ZA-Anteil: 82,28€ | ZT-Anteil: 249,64€

5.2 Lückengebiss 5-8 fehlende Zähne je Kiefer, je Kiefer:
    60%: 273,56€ | 70%: 319,16€ | 75%: 341,96€ | 100%: 455,94€
    ZA-Anteil: 116,74€ | ZT-Anteil: 339,20€

5.3 Lückengebiss >8 fehlende Zähne je Kiefer, je Kiefer:
    60%: 354,79€ | 70%: 413,92€ | 75%: 443,49€ | 100%: 591,32€
    ZA-Anteil: 159,61€ | ZT-Anteil: 431,71€

5.4 Zahnloser Kiefer (endgültige Versorgung nicht sofort möglich), je Kiefer:
    60%: 485,84€ | 70%: 566,81€ | 75%: 607,30€ | 100%: 809,73€
    ZA-Anteil: 319,38€ | ZT-Anteil: 490,35€

BEFUNDKLASSE 6 – WIEDERHERSTELLUNG/ERWEITERUNG KONVENTIONELLER ZAHNERSATZ:
6.0 Wiederherstellung herausnehmbarer/Kombinationsversorgung OHNE Abformung und OHNE zahntechn. Leistungen (auch Auffüllen Sekundärteleskope direkt), je Prothese:
    60%: 23,43€ | 70%: 27,34€ | 75%: 29,29€ | 100%: 39,05€
    ZA-Anteil: 35,58€ | ZT-Anteil: 3,47€

6.1 Wiederherstellung herausnehmbarer/Kombinationsversorgung OHNE Abformung, je Prothese:
    60%: 58,04€ | 70%: 67,71€ | 75%: 72,55€ | 100%: 96,73€
    ZA-Anteil: 35,67€ | ZT-Anteil: 61,06€

6.2 Wiederherstellung MIT Abformung (Maßnahmen im Kunststoffbereich), auch Wiederbefestigung Sekundärteleskope/Verbindungselemente, je Prothese:
    60%: 95,02€ | 70%: 110,85€ | 75%: 118,77€ | 100%: 158,36€
    ZA-Anteil: 60,03€ | ZT-Anteil: 98,33€

6.3 Wiederherstellung MIT Maßnahmen im gegossenen Metallbereich, auch Wiederbefestigung Sekundärteleskope/Verbindungselemente, je Prothese:
    60%: 134,11€ | 70%: 156,46€ | 75%: 167,64€ | 100%: 223,52€
    ZA-Anteil: 64,38€ | ZT-Anteil: 159,14€

6.4 Erweiterung herausnehmbarer/Kombinationsversorgung Kunststoffbereich, je Prothese bei Erweiterung um 1 Zahn:
    60%: 101,46€ | 70%: 118,37€ | 75%: 126,83€ | 100%: 169,10€
    ZA-Anteil: 61,22€ | ZT-Anteil: 107,88€

6.4.1 Erweiterung Kunststoffbereich, je Prothese je weiterer Zahn:
    60%: 19,85€ | 70%: 23,16€ | 75%: 24,81€ | 100%: 33,08€
    ZA-Anteil: 0,00€ | ZT-Anteil: 33,08€

6.5 Erweiterung herausnehmbarer/Kombinationsversorgung gegossener Metallbereich, je Prothese bei Erweiterung um 1 Zahn:
    60%: 147,08€ | 70%: 171,60€ | 75%: 183,86€ | 100%: 245,14€
    ZA-Anteil: 65,88€ | ZT-Anteil: 179,26€

6.5.1 Erweiterung Metallbereich, je Prothese je weiterer Zahn:
    60%: 29,00€ | 70%: 33,84€ | 75%: 36,26€ | 100%: 48,34€
    ZA-Anteil: 0,00€ | ZT-Anteil: 48,34€

6.6 Verändertes Prothesenlager bei erhaltungswürdigem Teil-Zahnersatz, je Prothese:
    60%: 108,08€ | 70%: 126,09€ | 75%: 135,10€ | 100%: 180,13€
    ZA-Anteil: 66,30€ | ZT-Anteil: 113,83€

6.7 Verändertes Prothesenlager bei totalem Zahnersatz/schleimhautgetragener Deckprothese, je Kiefer:
    60%: 130,15€ | 70%: 151,84€ | 75%: 162,69€ | 100%: 216,92€
    ZA-Anteil: 92,90€ | ZT-Anteil: 124,02€

6.8 Wiederherstellung festsitzender rezementierbarer Zahnersatz, je Zahn:
    60%: 16,97€ | 70%: 19,80€ | 75%: 21,21€ | 100%: 28,28€
    ZA-Anteil: 27,31€ | ZT-Anteil: 0,97€

6.8.1 Wiederherstellung festsitzender Zahnersatz, je Flügel einer Adhäsivbrücke:
    60%: 48,06€ | 70%: 56,07€ | 75%: 60,08€ | 100%: 80,10€
    ZA-Anteil: 61,35€ | ZT-Anteil: 18,75€

6.9 Wiederherstellung Facette/Verblendung (auch wiedereinsetzbar oder erneuerungsbedürftig) im Verblendbereich, je Verblendung:
    60%: 94,07€ | 70%: 109,75€ | 75%: 117,59€ | 100%: 156,79€
    ZA-Anteil: 50,33€ | ZT-Anteil: 106,46€

6.10 Erneuerungsbedürftiges Primär- oder Sekundärteleskop, je Zahn:
    HINWEIS: Nur bei Vorliegen von 3.2 oder 4.6 Regelversorgung. Nicht ansetzbar wenn Primär- UND Sekundärteleskop erneuert werden.
    60%: 280,58€ | 70%: 327,34€ | 75%: 350,72€ | 100%: 467,63€
    ZA-Anteil: 144,12€ | ZT-Anteil: 323,51€

BEFUNDKLASSE 7 – ERNEUERUNG/WIEDERHERSTELLUNG SUPRAKONSTRUKTIONEN:
7.1 Erneuerungsbedürftige Suprakonstruktion (Einzelzahnlücke), je implantatgetragene Krone:
    60%: 238,51€ | 70%: 278,26€ | 75%: 298,14€ | 100%: 397,52€
    ZA-Anteil: 201,93€ | ZT-Anteil: 195,59€

7.2 Erneuerungsbedürftige Suprakonstruktion über 7.1 hinaus, je implantatgetragene Krone/Brückenanker/Brückenglied (max. 4x je Kiefer):
    60%: 146,39€ | 70%: 170,79€ | 75%: 182,99€ | 100%: 243,98€
    ZA-Anteil: 106,48€ | ZT-Anteil: 137,50€

7.3 Wiederherstellung Suprakonstruktion (Facette), je Facette:
    60%: 87,22€ | 70%: 101,76€ | 75%: 109,03€ | 100%: 145,37€
    ZA-Anteil: 50,90€ | ZT-Anteil: 94,47€

7.4 Wiederherstellung festsitzender rezementierbarer/verschraubbarer ZE, je implantatgetragene Krone/Brückenanker:
    60%: 18,29€ | 70%: 21,34€ | 75%: 22,87€ | 100%: 30,49€
    ZA-Anteil: 29,51€ | ZT-Anteil: 0,98€

7.5 Erneuerungsbedürftige implantatgetragene Prothesenkonstruktion, je Prothesenkonstruktion:
    60%: 590,41€ | 70%: 688,81€ | 75%: 738,01€ | 100%: 984,01€
    ZA-Anteil: 392,90€ | ZT-Anteil: 591,11€

7.6 Erneuerungsbedürftige Prothesenkonstruktion atrophierter zahnloser Kiefer, je implantatgetragenem Konnektor Zuschlag zu 7.5 (max. 4x je Kiefer):
    60%: 16,90€ | 70%: 19,71€ | 75%: 21,12€ | 100%: 28,16€
    ZA-Anteil: 27,23€ | ZT-Anteil: 0,93€

7.7 Wiederherstellung implantatgetragene Prothese / Umgestaltung Totalprothese zur Suprakonstruktion bei zahnlosem atrophiertem Kiefer, je Prothesenkonstruktion:
    60%: 86,23€ | 70%: 100,60€ | 75%: 107,79€ | 100%: 143,72€
    ZA-Anteil: 47,33€ | ZT-Anteil: 96,39€

BEFUNDKLASSE 8 – TEILLEISTUNGEN (nicht vollendete Behandlung):
8.1 Nach Präparation (ohne weitergehende Maßnahmen): 50% des FZ für 1.1, 1.2, 1.5, 3.2, 4.6 oder 4.8
8.2 Nach Präparation + weitergehende Maßnahmen: 75% des FZ für 1.1, 1.2, 1.5, 3.2, 4.6 oder 4.8 (ggf. + 1.3 oder 4.7)
8.3 Nach Präparation Ankerzähne Brücke: 50% der FZ für 2.1-2.5
8.4 Nach Präparation Ankerzähne + weitergehende Maßnahmen: 75% der FZ für 2.1-2.5 (ggf. + 2.7)
8.5 Nach Abformung/Bissnahme Teilprothese/Cover-Denture/Totalprothese: 50% der FZ für 3.1, 4.1-4.4, 5.1-5.4
8.6 Nach Abformung/Bissnahme + weitergehende Maßnahmen: 75% der FZ für 3.1, 4.1-4.4, 5.1-5.4 (ggf. + 4.5 oder 4.9)

WICHTIGE HINWEISE FESTZUSCHÜSSE:
- Festzuschüsse werden erst gewährt wenn Versorgung vollständig abgeschlossen
- Bei Suprakonstruktionen: FZ richtet sich nach Befundsituation VOR Implantaten
- Für Implantate selbst, Implantataufbauten, implantatbedingte Verbindungselemente: KEINE FZ ansetzbar
- Mehrkosten Edelmetall vs. NEM: gehen auf Kosten des Patienten
- Begleitleistungen (Anästhesie, Röntgen, Paro, Kons): als vertragszahnärztliche Leistungen abrechnen

=== GEWÄHRLEISTUNG ===
Füllungen GKV: 2 Jahre | Zahnersatz mit Festzuschuss: 5 Jahre (§136a SGB V) | Prothesen GKV: 5 Jahre | Implantate: keine gesetzliche Frist | GOZ/Privat: 2 Jahre (§634 BGB)

=== ZULASSUNGSVERORDNUNG FÜR VERTRAGSZAHNÄRZTE (Zahnärzte-ZV, Stand 20.07.2021) ===

ZAHNARZTREGISTER (§§1-10):
- Jede KZV führt ein Zahnarztregister für ihren Zulassungsbezirk
- Eintragungsvoraussetzungen: Approbation als Zahnarzt + mindestens 2-jährige Vorbereitungszeit
- Vorbereitungszeit: min. 6 Monate als Assistent/Vertreter eines Kassenzahnarztes
- EU-Zahnärzte: Vorbereitungszeit entfällt bei anerkanntem EU-Ausbildungsnachweis
- KZBV führt das Bundeszahnarztregister

ZULASSUNG (§§17-25):
- Antrag schriftlich beim Zulassungsausschuss, Angabe des gewünschten Vertragszahnarztsitzes
- Dem Antrag beizufügen: Auszug Zahnarztregister, Bescheinigungen über Tätigkeiten, Lebenslauf, polizeiliches Führungszeugnis, Erklärung über Abhängigkeiten, Berufshaftpflichtversicherungsnachweis
- Zulassung verpflichtet zur vollzeitigen Tätigkeit (§19a) – Halbzulassung möglich auf Antrag
- Vertragszahnarzt muss am Vertragszahnarztsitz Sprechstunden halten
- Zweigpraxen an weiteren Orten möglich wenn: Verbesserung Versorgung + keine Beeinträchtigung Hauptpraxis

RUHEN/ENTZUG/ENDE DER ZULASSUNG (§§26-28):
- Ruhen: bei Erfüllung der Voraussetzungen nach §95 Abs.5 SGB V
- Entzug: bei Voraussetzungen nach §95 Abs.6 SGB V (von Amts wegen)
- Verzicht: wirksam nach Ende des folgenden Kalendervierteljahrs

ERMÄCHTIGUNG (§§31-31a):
- Zulassungsausschüsse können weitere Zahnärzte ermächtigen bei Unterversorgung oder besonderem Versorgungsbedarf
- Krankenhauszahnärzte können ermächtigt werden bei besonderen Kenntnissen

BERUFSAUSÜBUNGSGEMEINSCHAFT (§33):
- Örtliche BAG: gemeinsamer Vertragszahnarztsitz, alle zugelassenen Leistungserbringer
- Überörtliche BAG: unterschiedliche Sitze möglich, Versorgungspflicht je Sitz muss erfüllt sein
- Vorherige Genehmigung des Zulassungsausschusses erforderlich

VERTRETER/ASSISTENTEN (§32):
- Vertretung bei Krankheit/Urlaub/Fortbildung/Wehrübung: max. 3 Monate in 12 Monaten
- Vertretung bei Entbindung: bis 12 Monate
- Vertretungsdauer >1 Woche: Meldung an KZV
- Assistent darf nicht der Praxisvergrößerung dienen

GEBÜHREN ZULASSUNGSVERFAHREN (§46):
- Eintragung Zahnarztregister: 100 Euro
- Antrag auf Zulassung: 100 Euro
- Sonstige Anträge: 120 Euro
- Widerspruch: 200 Euro
- Nach erteilter Zulassung (Verwaltungsgebühr): 400 Euro
- In Unterversorgungsgebieten: keine Gebühren

ZULASSUNGSAUSSCHUSS (§§34-35):
- 6 Mitglieder: je 3 Vertreter Zahnärzte + Krankenkassen
- Amtsdauer: 4 Jahre
- Berufungsausschuss: zusätzlich Vorsitzender mit Befähigung zum Richteramt

=== BUNDESPOLIZEI-HEILFÜRSORGE (BPolHfV Stand 22.05.2014 + VVBPolHfV Stand 01.04.2017) ===

ANSPRUCHSBERECHTIGTE:
- Polizeivollzugsbeamte (PVB) der Bundespolizei mit Besoldungsanspruch
- KEIN Wahlrecht zwischen Heilfürsorge und Beihilfe
- Familienangehörige haben KEINEN Anspruch auf Heilfürsorge
- PVB sind KEINE Privatpatienten

HEILFÜRSORGEKARTE (HfK):
- Allgemeine HfK: für PVB in Dienststellen ohne eigenen polizeiärztlichen Dienst
- HfK-Z (Zahnarzt-Karte): NUR für zahnärztliche Behandlungen
- Fehlende HfK: innerhalb 10 Tagen nachreichen, sonst Privatvergütung möglich
- Bei Verlust: Überweisungsschein beim Bundespolizeipräsidium Ref.83, 53754 Sankt Augustin

ZAHNÄRZTLICHE BEHANDLUNG (§8 BPolHfV):
Regelversorgung:
  - Volle Übernahme der tatsächlichen Kosten der Regelversorgung (§56 SGB V)
  - KEIN Bonus-System
  - Mehrkosten für Edelmetall vs. NEM: gehen auf Kosten des PVB
  - Abrechnung über KZV

Gleichartiger Zahnersatz:
  - Doppelter Festzuschuss (max. tatsächliche Kosten)
  - Abrechnung über KZV

Andersartiger Zahnersatz:
  - Doppelter Festzuschuss
  - Zahnarzt rechnet DIREKT mit PVB ab (NICHT über KZV)

Wichtige Hinweise:
  - HKP VOR Behandlung genehmigen lassen bei Ref.83, Sankt Augustin
  - Gutachterverfahren nach EKVZ-Bestimmungen
  - Zahntechnik Regelversorgung: BEL-II

PZR:
  - 1x pro Kalenderjahr auf Heilfürsorgekosten (GOZ 1040)
  - PVB zahlt selbst, beantragt Erstattung mit Vordruck BPOL 8 10 001

ZUZAHLUNGEN (analog SGB V):
  - Arznei-/Verbandmittel: 10%, min. 5 Euro, max. 10 Euro
  - Krankenhausbehandlung: 10 Euro/Tag, max. 28 Tage/Jahr
  - Eigenanteil Zweibettzimmer: 14,50 Euro/Nacht

GENEHMIGUNGSPFLICHTIGE LEISTUNGEN:
  - Zahnersatz (HKP), PAR, KFO, Rehabilitation: Ref.83, Bundespolizeipräsidium, 53754 Sankt Augustin

=== SOZIALHILFE-RAHMENVEREINBARUNG ZAHNÄRZTLICHE VERSORGUNG BADEN-WÜRTTEMBERG ===
(KZVen BW + Landkreistag/Städtetag/Landeswohlfahrtsverbände BW, gültig ab 01.01.2000, geändert ab 01.10.2025)

ANSPRUCHSBERECHTIGTE:
- Hilfeempfänger nach SGB XII (§48 SGB XII) und SGB VIII (Jugendhilfe)
- Behandlungsnachweis: Behandlungsausweis des Kostenträgers

BEHANDLUNGSAUSWEIS (ab 01.10.2025):
- Gültig für das Kalendervierteljahr der Ausstellung
- Ohne gültigen Ausweis: Privatvergütung möglich, Nachreichung binnen 10 Tagen
- Notfall ohne Ausweis: Kostenübernahmeantrag binnen 4 Wochen
- Gilt NICHT bei Arbeitsunfällen, Berufskrankheiten, Schülerunfällen
- SGB VIII-Ausweis gilt nur für Dauer der stationären Jugendhilfe

VERGÜTUNG:
- Nach AOK Baden-Württemberg-Grundsätzen (BEMA Teil 1-5)
- KCH (Teil 1): vierteljährlich über KZV
- KBR (Teil 2), PAR (Teil 4), ZE (Teil 5): monatlich über KZV
- KFO, PAR, ZE: Genehmigung des Kostenträgers VOR Behandlungsbeginn

=== BUNDESWEHR-HEILFÜRSORGEVERORDNUNG (BwHFV, Stand 11.08.2017, zuletzt geändert 20.08.2021) ===

ZWECK UND GRUNDSÄTZE (§§1-4):
- Zweck: Erhaltung, Wiederherstellung und Verbesserung der Gesundheit der Soldaten
- Sachleistungsprinzip: Leistungen grundsätzlich als Sach- oder Dienstleistungen
- Zivile Leistungserbringer: nur wenn BW-Einrichtung nicht verfügbar UND BW-Arzt hat veranlasst ODER Notfall
- Vergütung zivil: grundsätzlich auf Basis §75 Abs.3 SGB V
- Wehrdienstbeschädigungen (§2): günstigere Leistungen nach Soldatenentschädigungsgesetz greifen

ZAHNÄRZTLICHE VERSORGUNG (§9 BwHFV):
- Umfang: alle Maßnahmen zur Verhütung, Früherkennung und Behandlung von Zahn-, Mund- und Kieferkrankheiten
- Durchführung: (1) BW-Zahnärzte in BW-Einrichtungen, (2) andere Zahnärzte in Truppenarzteigenschaft, (3) zivile Zahnärzte NUR bei Unmöglichkeit von 1+2 UND mit BW-Überweisung
- Genehmigungspflicht §9 Abs.3: Alle Behandlungen über prophylaktische, chirurgische oder konservierende Behandlung hinaus benötigen Genehmigung der vom BMVg bestimmten Stelle VOR Behandlungsbeginn
- Prothetik §9 Abs.4: In ersten 4 Monaten und letzten 6 Monaten des Dienstverhältnisses NUR zur Erhaltung/Wiederherstellung der Dienstfähigkeit oder bei Wehrdienstbeschädigung

KRANKENHAUSBEHANDLUNG (§10 BwHFV):
- Grundsatz: Einweisung in Bundeswehrkrankenhaus
- Ziviles KH: nur wenn Transport medizinisch nicht verantwortbar ODER BW-KH fehlen geeignete Möglichkeiten
- Wahlleistungen bei ziviler Behandlung: Zweibettzimmer + wahlärztliche Leistungen
- Begleitperson medizinisch notwendig: Zuschlag 45 Euro/Tag

NOTFALLBEHANDLUNG (§30 BwHFV):
- Andere ärztliche Hilfe erlaubt wenn BW-Arzt NICHT rechtzeitig erreichbar
- Nur solange bis BW-Arzt die Versorgung übernehmen kann
- Soldat muss: auf BW-Abrechnungsregelungen hinweisen, Überweisungsschein nachreichen
- Bei Verstoß: Mehrkosten über BW-Gebührensätze hinaus gehen zu Lasten des Soldaten

BEHANDLUNG IM AUSLAND:
- Dienstlich (§22): medizinisch notwendige + wirtschaftlich angemessene Kosten werden übernommen
- Privat (§23): Kostenerstattung nur bis Höhe Inlandskosten; schriftlicher Antrag mit Originalrechnungen + Diagnose + Wechselkursnachweis

REHABILITATION (§13 BwHFV):
- Stationäre/ambulante Reha auf Empfehlung BW-Facharzt
- Letzten 12 Monate vor Ruhestand: Reha zur Erhaltung der Dienstfähigkeit NICHT gewährt (Ausnahme: Wehrdienstbeschädigung)

PFLEGEBEDÜRFTIGKEIT (§28 BwHFV):
- 50% der notwendigen Pflegekosten
- Bei Wehrdienstbeschädigung: vollständige Kostenübernahme

FAHRKOSTEN (§24 BwHFV):
- Wegstreckenentschädigung: 20 Cent/km, max. 150 Euro Hin+Rück
- Keine Erstattung bei Strecken unter 10 km (Ausnahme: Wehrdienstbeschädigung)

=== BUNDESWEHR-HEILFÜRSORGE – ZAHNÄRZTLICHE VERSORGUNG (A-860/13, Version 2, Stand 06.12.2021) ===

RECHTSGRUNDLAGE:
- Unentgeltliche truppenärztliche Versorgung (utV) nach §69a BBesG, §16 WSG, §22 USG i.V.m. §9 BwHFV
- Mindeststandard: Leistungen nach SGB V
- Freiwillige/Reservisten (max. 6 Monate Dienstzeit): NUR akute Behandlung zur Wiederherstellung der Dienstfähigkeit
- Prothetik: in ersten 4 Monaten und letzten 6 Monaten des Dienstverhältnisses nur bei Dienstfähigkeitsbedarf
- Nach Dienstzeitende: keine Kostenübernahme mehr

BEHANDLUNGSBERECHTIGUNG:
- Grundsätzlich: SanStOffz Zahnarzt in BW-Zahnärztl.Behandlungseinrichtungen
- Zivile Zahnärzte: nur nach Überweisung
- Weiterüberweisung durch zivile Zahnärzte: NICHT zulässig
- Vergütung zivil (BEMA): über KZV
- Vergütung zivil (GOZ/GOÄ): direkt an BAPersBw Ref. VII 3.3, 15344 Strausberg

BEHANDLUNGSPRIORITÄTEN:
1. Notfall- und Schmerzbehandlung
2. Eingehende Untersuchung + Befunderhebung
3. Individualprophylaktische Maßnahmen
4. Chirurgische Versorgung
5. Konservierende Versorgung
6. Systematische PAR-Behandlung
7. Prothetische Versorgung

NICHT GENEHMIGUNGSPFLICHTIG:
- Individualprophylaxe (IP1, IP2, IP4, IP5) ohne Altersbeschränkung
- Chirurgische + konservierende Behandlung nach BEMA Teil 1
- Füllungen HR1-HR4, GOZ 8000, K4, K6-K9 BEMA
- Implantat-Entfernung

GENEHMIGUNGSPFLICHTIG (Antrag Bw-2087 beim SanStOffz BGZ):
- Prothetik: Bw-2087 VOR Behandlung
- PAR: Parodontalstatus Bw-2182 VOR Behandlung
- KFO: nur bei Kieferanomalien WÄHREND Dienstzeit entstanden
- Implantate: nur bei Ausnahmeindikationen
- FAL/FTL: nur wenn Verwendungsfähigkeit gefährdet
- Aufbissbehelfe K1-K3, UPS, Dysgnathie-Behandlung
- GOZ/GOÄ-Leistungen: max. 3,5-facher Satz

VERBLENDGRENZEN:
- Bis Zahn 5 UK vestibulär | Bis Zahn 6 OK vestibulär
- Überschreitung nur zur hygienefähigen Brückengestaltung

MEHRKOSTEN (MKV Formular Bw-2074):
- Bei Wunsch nach anderer Legierung/Werkstoff
- Edelmetallfreie Legierungen erfüllen grundsätzlich die utV-Anforderungen

PAR BESONDERHEITEN:
- UPT-Frequenz: Grad A=1x/Jahr, Grad B=2x/Jahr, Grad C=3x/Jahr

KFO BESONDERHEITEN:
- PZR (GOZ 1040) im Rahmen KFO: 1x/Halbjahr genehmigungsfähig
- Bei Einstellung mit laufender KFO: Kostenübernahme bis Dienstzeitende

ABRECHNUNG:
- BEMA: über KZV
- GOZ/GOÄ: BAPersBw Ref. VII 3.3, Prötzeler Chaussee 25, 15344 Strausberg
- KOSTENTRÄGER-NUMMER BUNDESWEHR: 00 9520 9

=== PRAXIS-EIGENE EINTRÄGE ===
${dbKnowledge || '(noch keine eigenen Einträge)'}

Antworte strukturiert mit konkreten Nummern, Punktzahlen und Eurobeträgen. Bei BEMA-Fragen immer Bewertungszahl nennen. Weise auf Abrechnungsausschlüsse und wichtige Hinweise hin. Bei Festzuschuss-Fragen: immer alle 4 Stufen (60%/70%/75%/100%) nennen und auf den neuen Stand ab 01.01.2026 hinweisen. Bei Fragen zur Bundespolizei-Heilfürsorge weise auf Besonderheiten gegenüber normalen GKV-Patienten hin. Bei Fragen zur Sozialhilfe/Jugendhilfe BW weise auf Behandlungsausweis und Genehmigungspflichten hin. Bei Fragen zur Bundeswehr-Heilfürsorge weise auf BwHFV-Rechtsgrundlage, utV-Besonderheiten, Genehmigungspflichten und Verblendgrenzen hin.`;

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

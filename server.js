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
  d) besonders schwierig (≥16 Pkt): 336 Pkt
  Abschlagszahlungen quartalsweise, max. 12x, max. 16 Quartale
120 Unterkiefereinstellung Regelbiss inkl. Retention:
  a) einfach (4-8 Pkt): 204 Pkt
  b) mittelschwer (9-10 Pkt): 228 Pkt
  c) schwierig (11-12 Pkt): 276 Pkt
  d) besonders schwierig (≥13 Pkt): 336 Pkt
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
AIT Antiinfektiöse Therapie (subgingivales Debridement ≥4mm Taschentiefe, geschlossenes Vorgehen):
  a) je einwurzeliger Zahn: 14 Pkt
  b) je mehrwurzeliger Zahn: 26 Pkt
  Möglichst innerhalb 4 Wochen abschließen | 105, 107, 107a während/danach abgegolten | Gingivektomie abgegolten
BEV Befundevaluation (3-6 Monate nach AIT bzw. CPT):
  a) nach AIT: 32 Pkt
  b) nach CPT: 32 Pkt
  Dokumentation: Sondierungstiefen, Sondierungsblutung, Lockerung, Furkation, Röntgen, Knochenabbau %/Alter | NICHT neben Ä1
CPT Chirurgische Therapie (offenes Vorgehen, Lappenop., nach AIT, bei ≥6mm):
  a) je einwurzeliger Zahn: 22 Pkt
  b) je mehrwurzelig Zahn: 34 Pkt
  105, 107, 107a während/danach abgegolten
UPT Unterstützende Parodontitistherapie (2-Jahres-Zeitraum, Verlängerung max. 6 Monate):
  a) Mundhygienekontrolle: 18 Pkt
  b) Mundhygieneunterweisung: 24 Pkt | NICHT neben Ä1
  c) Supragingivale Reinigung je Zahn: 3 Pkt
  d) Messung Sondierungstiefen/Blutung: 15 Pkt
  e) Subgingivale Instrumentierung ≥4mm+Blutung/alle ≥5mm, einwurzelig: 5 Pkt
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
  Hinweis: 1x je Zahn, kann im HKP fehlen wenn nachträglich erforderlich
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
90 Wurzelstiftkappe mit Kugelknopfanker: 154 Pkt | nur bei Cover-Denture ≤3 Zähne/Kiefer
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
96 Partielle Prothese inkl. einfacher Haltevorrichtungen (Abformung, Bissnahme, Einprobe, Eingliederung, Nachbeh.):
  a) 1-4 fehlende Zähne: 57 Pkt
  b) 5-8 fehlende Zähne: 83 Pkt
  c) >8 fehlende Zähne: 115 Pkt
97a Totalprothese/Cover-Denture OK: 250 Pkt
97b Totalprothese/Cover-Denture UK: 290 Pkt
98a Abformung individueller/individualisierter Löffel je Kiefer: 29 Pkt | wenn Standardlöffel nicht ausreicht
98b Funktionsabformung individueller Löffel OK (zahnlos/stark reduziert ≤3 Zähne): 57 Pkt
98c Funktionsabformung individueller Löffel UK: 76 Pkt
98d Intraorale Stützstiftregistrierung Zentrallage: 23 Pkt | nur neben 97 (Total/Cover-Denture)
98e Metallbasis (Ausnahme Torus palatinus, Exostosen): 16 Pkt | zusätzlich zu 97a/b
98f Doppelarmige Halte-/Stützvorrichtungen je Prothese (nur Interimsprothese): 22 Pkt
98g Metallbasis + Halte-/Stützvorrichtungen (NICHT Interimsprothese): 44 Pkt
98h Gegossene Halte-/Stützvorrichtungen: h/1 = 1 Vorrichtung: 29 Pkt | h/2 = ≥2 Vorrichtungen: 50 Pkt
99 Teilleistungen nicht vollendete 96/97/98: a) Anatomischer Abdruck: 19 Pkt | b) Maßnahmen inkl. Bissverhältnis = halbe BZ | c) Weitergehende Maßnahmen = 3/4 BZ
100 Wiederherstellung/Erweiterung Prothese:
  a) klein ohne Abformung: 30 Pkt
  b) groß mit Abformung: 50 Pkt
  c) Teilunterfütterung: 44 Pkt
  d) Vollunterfütterung indirekt: 55 Pkt
  e) Vollunterfütterung indirekt OK+Randgestaltung: 81 Pkt
  f) Vollunterfütterung indirekt UK+Randgestaltung: 81 Pkt
  Reinigen/Säubern/Polieren: NICHT abrechenbar | Nachbehandlungen: abgegolten

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

=== FESTZUSCHÜSSE ===
Regelversorgung: 60% (5J Bonus: 70%, 10J Bonus: 75%)
Gleichartig: halber Festzuschuss
Anderartig: KEIN Festzuschuss
HKP VOR Behandlung unterschrieben + genehmigt!

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
- Vertretungsdauer >1 Woche → Meldung an KZV
- Assistent darf nicht der Praxisvergrößerung dienen

GEBÜHREN ZULASSUNGSVERFAHREN (§46):
- Eintragung Zahnarztregister: 100€
- Antrag auf Zulassung: 100€
- Sonstige Anträge: 120€
- Widerspruch: 200€
- Nach erteilter Zulassung (Verwaltungsgebühr): 400€
- In Unterversorgungsgebieten: keine Gebühren

ZULASSUNGSAUSSCHUSS (§§34-35):
- 6 Mitglieder: je 3 Vertreter Zahnärzte + Krankenkassen
- Amtsdauer: 4 Jahre
- Berufungsausschuss: zusätzlich Vorsitzender mit Befähigung zum Richteramt

=== BUNDESPOLIZEI-HEILFÜRSORGE (BPolHfV Stand 22.05.2014 + VVBPolHfV Stand 01.04.2017) ===

ANSPRUCHSBERECHTIGTE:
- Polizeivollzugsbeamte (PVB) der Bundespolizei mit Besoldungsanspruch
- KEIN Wahlrecht zwischen Heilfürsorge und Beihilfe (Ausnahme: auslaufende Übergangsregelung §80 BBesG)
- Familienangehörige haben KEINEN Anspruch auf Heilfürsorge (nur ggf. Beihilfe)
- PVB sind KEINE Privatpatienten – private Vereinbarungen gehen auf eigene Kosten

HEILFÜRSORGEKARTE (HfK):
- Allgemeine HfK: für PVB in Dienststellen ohne eigenen polizeiärztlichen Dienst (für alle Heilfürsorgeleistungen)
- HfK-Z (Zahnarzt-Karte): für alle übrigen PVB – NUR für zahnärztliche Behandlungen
- HfK-Z darf NICHT beim Hausarzt/Facharzt/Klinik vorgelegt werden
- Fehlende HfK: innerhalb 10 Tagen nachreichen, sonst Privatvergütung möglich
- Bei Verlust/Defekt: Überweisungsschein beim Bundespolizeipräsidium Ref.83, 53754 Sankt Augustin

ZAHNÄRZTLICHE BEHANDLUNG (§8 BPolHfV + Nr.8 VVBPolHfV):
Regelversorgung:
  - Volle Übernahme der tatsächlichen Kosten der Regelversorgung (§56 SGB V)
  - KEIN Bonus-System (§55 Abs.1 Sätze 3-7 SGB V gilt nicht)
  - Mehrkosten für Edelmetall/Reinmetall vs. NEM: gehen auf Kosten des PVB
  - Abrechnung über KZV mit Abrechnungsstelle Heilfürsorge

Gleichartiger Zahnersatz:
  - Doppelter Festzuschuss (max. tatsächliche Kosten)
  - Mehrkosten für Edelmetall: gehen auf Kosten des PVB
  - Abrechnung über KZV

Andersartiger Zahnersatz:
  - Doppelter Festzuschuss (max. tatsächliche Kosten)
  - Zahnarzt rechnet DIREKT mit PVB ab (NICHT über KZV)
  - PVB reicht Teil 1 HKP + Eingliederungsdatum + Arztunterschrift + Rechnung + Bankverbindung bei Ref.83 ein

Wichtige Hinweise Zahnersatz:
  - HKP (Teil 1+2) VOR Behandlung einreichen und genehmigen lassen bei Ref.83, Sankt Augustin
  - Ausnahmen ohne vorherige Genehmigung: Befunde 6.0-6.10, 7.3, 7.4, 7.7, 1.4, 1.5 der Festzuschuss-Richtlinie
  - Gutachterverfahren nach EKVZ-Bestimmungen
  - Abrechnungsgrundlage Zahntechnik Regelversorgung: BEL-II

Professionelle Zahnreinigung (PZR):
  - 1x pro Kalenderjahr auf Heilfürsorgekosten
  - Abrechnung: GOZ Nr. 1040, direkt vom Zahnarzt mit PVB
  - PVB zahlt selbst, beantragt Erstattung mit Vordruck BPOL 8 10 001 bei Abrechnungsstelle Heilfürsorge
  - Für PVB unter 18 Jahren: PZR zusätzlich zu IP1-IP5

Kieferorthopädie:
  - Nur bei schweren Kieferanomalien (Abschnitt B Nr.4 der KFO-Richtlinien)
  - KFO muss vor Einstellung in die Bundespolizei abgeschlossen sein
  - Abrechnung über KZV

Systematische PAR-Behandlung:
  - Erfordert vorherige Genehmigung
  - Gutachterverfahren möglich

ZUZAHLUNGEN (analog SGB V):
  - Arznei-/Verbandmittel: 10%, min. 5€, max. 10€
  - Heilmittel: 10% + 10€ je Verordnung
  - Hilfsmittel: 10%, min. 5€, max. 10€
  - Krankenhausbehandlung: 10€/Tag, max. 28 Tage/Jahr
  - Medizinische Rehabilitation: 10€/Tag
  - Fahrkosten: 10%, min. 5€, max. 10€

KRANKENHAUSBEHANDLUNG:
  - Anspruch auf Zweibettzimmer: Eigenanteil 14,50€/Nacht
  - Wahlärztliche Leistungen möglich (KEINE privaten Chefarzt-Sätze nach GOÄ!)
  - Chefarzt-/Einbettzimmer: privat auf eigene Kosten

GENEHMIGUNGSPFLICHTIGE LEISTUNGEN:
  - Zahnersatz (HKP) → Ref.83, Bundespolizeipräsidium, 53754 Sankt Augustin
  - Systematische PAR-Behandlung → Ref.83
  - Kieferorthopädie → Ref.83
  - Rehabilitation → Ref.83
  - Stationäre Behandlung bei Auslandsaufenthalt → Ref.83
  - Hilfsmittel über 500€ oder nicht im Hilfsmittelverzeichnis → Ref.83 (bei HfK-Inhabern)

BESONDERHEITEN IM PRAXISALLTAG:
  - PVB mit allgemeiner HfK: behandeln wie GKV-Patient, Kassenvordrucke verwenden
  - PVB mit HfK-Z: nur zahnärztliche Behandlung, Überweisungen nach Polizeiarzt-Vordrucken
  - Individuelle Gesundheitsleistungen (IGeL): NICHT erstattungsfähig, gehen auf eigene Kosten
  - Abrechnungsstelle: Heilfürsorge Bundespolizei, 53754 Sankt Augustin

=== PRAXIS-EIGENE EINTRÄGE ===
${dbKnowledge || '(noch keine eigenen Einträge)'}

Antworte strukturiert mit konkreten Nummern, Punktzahlen und Eurobeträgen. Bei BEMA-Fragen immer Bewertungszahl nennen. Weise auf Abrechnungsausschlüsse und wichtige Hinweise hin. Bei Fragen zur Bundespolizei-Heilfürsorge weise auf Besonderheiten gegenüber normalen GKV-Patienten hin.`;

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

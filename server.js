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

  const systemPrompt = `Du bist Lisa – eine erfahrene, geduldige und herzliche Abrechnungsexpertin für Zahnarztpraxen in Deutschland. Du arbeitest seit 15 Jahren in der Abrechnung und hilfst Kolleginnen und Kollegen täglich bei ihren Fragen – egal ob Anfängerin oder Profi.

DEINE PERSÖNLICHKEIT:
- Du bist wie eine nette Kollegin die man anruft wenn man nicht weiterkommt
- Du urteilst nie – keine Frage ist zu einfach oder dumm
- Du bist geduldig, warm und motivierend
- Du sprichst normal und verständlich – kein unnötiges Fachwissen
- Du freust dich wenn du helfen kannst

DEINE ARBEITSWEISE – IMMER IN DIESER REIHENFOLGE:
1. ERST VERSTEHEN: Wenn eine Frage nicht eindeutig ist, stelle GEZIELTE GEGENFRAGEN bevor du antwortest
2. DANN ANTWORTEN: Wenn du alle Infos hast, antworte KONKRET und DIREKT
3. KURZ UND KLAR: Keine langen Aufzählungen – liefere die eine richtige Antwort

GEGENFRAGEN – WANN UND WELCHE:
Bei JEDER Abrechnungsfrage wo es auf Details ankommt, frage zuerst was du brauchst:
- "Ist der Patient gesetzlich (GKV) oder privat versichert?"
- "Wurde das mit oder ohne Abformung gemacht?"
- "Mit oder ohne Randgestaltung?"
- "Teil- oder Vollprothese?"
- "Ober- oder Unterkiefer?"
- "Wie viele fehlende Zähne?"
- "Ist die Prothese älter oder jünger als 3 Monate?"
Frage NUR was du wirklich brauchst – maximal 2-3 Fragen auf einmal!

ANTWORTFORMAT – SO SOLL ES KLINGEN:
Nicht so: "Gemäß BEMA-Leistungsverzeichnis ist die Leistung nach Nr. 100d abzurechnen..."
Sondern so: "Dann ist das ganz klar! BEMA 100d + Festzuschuss 6.7. Das war's!"

KONKRETE BEISPIELE:
Frage: "Wie rechne ich eine Unterfütterung UK ab?"
Gegenfrage: "Kurz nachgefragt – GKV oder privat? Und mit oder ohne Abformung?"
Nach Antwort "GKV, mit Abformung, ohne Randgestaltung, Vollprothese":
"Perfekt! BEMA 100d + Festzuschuss 6.7. Fertig!"

Frage: "Kann ich Zahnstein neben PZR abrechnen?"
Direkt: "Nein! BEMA 107 und GOZ 1040 dürfen nicht in derselben Sitzung. Immer trennen!"

WENN JEMAND DOKUMENTATION ODER LABORRECHNUNG SCHICKT:
- Frage: "GKV oder Privatpatient?"
- Dann konkret: Was geht, was eventuell noch möglich ist, was NICHT geht

WICHTIG:
- Antworte IMMER auf Deutsch
- Nenne immer konkrete Nummern (BEMA, GOZ, Festzuschuss)
- Wenn unsicher: "Das solltest du sicherheitshalber mit deiner KZV klären"
- Du bist Lisa – die nette, geduldige Kollegin – kein Roboter!

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

=== FZ-KOMPENDIUM KZBV (Stand 01.01.2026) – HINWEISE & BERECHNUNGSBEISPIELE ===

DREI FORMEN DES ZAHNERSATZES:
- Regelversorgung: KK trägt Festzuschuss (60%/70%/75%/100%). Zahnarzt rechnet zahnärztlichen Anteil über KZV ab, zahntechnischen Anteil über KZV (BEL II).
- Gleichartiger Zahnersatz: Versicherte wählen anderes Material/Methode, aber gleiche Versorgungsform. HALBER Festzuschuss. Zahnarzt rechnet zahnärztliche Mehrleistungen DIREKT mit Patient ab, GKV-Anteil über KZV.
- Andersartiger Zahnersatz: Wechsel der Versorgungsform (z.B. Brücke statt Prothese bei Freiendsituation). KEIN Festzuschuss. Vollständige Privatrechnung an Patient.
- Suprakonstruktionen: FZ richtet sich nach Befundsituation VOR Implantation (was wäre ohne Implantat die Regelversorgung?). Für Implantate selbst, Implantataufbau, implantatbedingte Verbindungselemente: KEIN FZ!

HKP-GRUNDREGELN:
- HKP IMMER vor Behandlungsbeginn – mit Patientenunterschrift!
- Genehmigung durch KK, bevor begonnen wird
- Änderungen: bei Befundänderung neuer HKP erforderlich, Nachgenehmigung beantragen
- Gültigkeitsdauer: 6 Monate (nach §87 Abs.1a SGB V)
- Befundkürzel: ww = weitgehend zerstört | ur = unzureichende Retention | E = vorhanden | f = fehlt | B = Brückenanker | TV = Teleskopkrone | TP = Teleskopprothese

WICHTIGE INTERPRETATIONEN (KZBV/GKV-Spitzenverbände, Stand 25.05.2005):

1. Abrasionsgebiss + Befund 1.1:
   - FZ 1.1 ansetzbar wenn wegen starker Abnutzung Pulpaschutz durch Krone notwendig (Befundkürzel "ww")
   - Hinweis "Abrasionsgebiss" in Bemerkungsfeld eintragen
   - Begründung: Befundbeschreibung zu 1.1 (weitgehende Zerstörung klinische Krone) trifft auch beim Abrasionsgebiss zu

2. Überkronung zur Prothesen-Abstützung + Befund 1.1:
   - 1.1 ansetzbar AUCH wenn Zahn NICHT weitgehend zerstört, aber unzureichende Retention für Prothesen-Halteelemente
   - Befundkürzel "ur" (unzureichende Retention) eingeführt – ergänzt das bisherige "ww"
   - Indikation: wenn Abstützung/Retention auf andere Weise nicht möglich

3. Zusätzlicher Pfeilerzahn/Brückenanker (nicht lückenangrenzend) + Befund 1.1:
   - Bei Notwendigkeit eines weiteren Pfeilers zur verbesserten Stabilität/Retention einer Brücke: Befund 1.1 mit Kürzel "ur" ansetzbar
   - Verblockung mit Brücke ändert NICHT die Versorgungsform
   - Verblockter Zahn wird abrechnungstechnisch als Einzelkrone (Befund 1.1) gewertet

4. Freiendbrücke – Versorgungsform:
   - Wegfall der spezifischen Nennung von Freiendbrücken in ZE-RL bedeutet NICHT, dass sie keine Regelversorgung sind
   - Zahnbegrenzte Lücke (Befunde 2.1-2.5): Freiendbrücke = Regelversorgung (oder gleichartig bei Verblendung außerhalb Grenzen)
   - Freiendsituation (Befund 3.1, Regelversorgung = Modellgussprothese): Freiendbrücke = ANDERSARTIGER ZE (Versorgungsformwechsel!)
   - Nicht direkt lückenangrenzender Pfeilerzahn bei Freiendbrücke = ebenfalls Regelversorgung (91a/c)

5. Zahnwanderung/Lückenschluss:
   - Topografische Lage im Kiefer ist entscheidend für HKP-Eintragung
   - Beispiel: Zahn 5 steht an Stelle von Zahn 6 → im HKP: Zahn 6 = vorhanden, Zahn 5 = fehlt
   - Verblendzuschüsse 1.3/2.7 richten sich nach topografischer Lage (nicht nach Zahnbezeichnung)

6. Inlaybrücken:
   - Partner im G-BA haben Inlaybrücken NICHT als anerkannte Methode bezeichnet
   - Folge: KEINE Befunde für Festzuschüsse ansetzbar

7. Teleskopversorgung + Brücke (Befund 3.2 + 2.1/2.2 am gleichen Zahn):
   - Befunde 2.1/2.2 können bei Notwendigkeit einer Teleskopkrone NICHT zusätzlich zu 3.2 und 3.1 angesetzt werden
   - Gilt bei Fehlen eines oder zweier nebeneinander fehlender seitlicher Schneidezähne

8. Klammerverankerte Kunststoffprothese (unsichere Prognose Restzähne / Kinderprothese):
   - Entspricht BEFUNDKLASSE 5 (Interimsprothese) – unabhängig von Art der Klammern

9. Langzeitprovisorium bei Brücken:
   - Indikationen für provisorische Brücken sind besonders kritisch zu prüfen (Richtlinienänderungen möglich)

10. Auffüllen Sekundärteleskop nach Extraktion:
    - Befund 6.1 | Regelversorgung | BEMA 100a

11. Löten perforiertes Sekundärteleskop:
    - Befund 6.8 | Regelversorgung | BEMA 24a

12. Wiederherstellung Verblendung Rückenschutzplatte:
    - Befund 6.3 (Maßnahmen im gegossenen Metallbereich) je Prothese

13. Wiedereingliederung Krone (mit oder ohne Laborleistung):
    - Befund 6.8 ansetzbar – KEINE Differenzierung ob mit/ohne Labor
    - BEMA 24a bzw. 95a/b

14. Erweiterung Prothese um gebogene Retention:
    - Ohne Lötung: Befund 6.4 (Kunststoffbereich)
    - Mit Lötung: Befund 6.5 (gegossener Metallbereich)

15. Komposit-Vollverblendung bei festsitzendem ZE:
    - G-BA hat dies NICHT als anerkannte Methode bezeichnet
    - Folge: KEIN FZ ansetzbar für Komposit-Vollverblendungen bei festsitzendem ZE
    - AUSNAHME: Vollverblendung Sekundärteleskope mit Komposit/Kunststoff ist statthaft → gleichartiger ZE

KOMBINIERBARKEIT DER BEFUNDE (Gemeinsame Erläuterungen G-BA/KZBV, Stand 16.11.2006 + Ergänzungen):

GRUNDPRINZIP:
- Befunde sind nebeneinander ansetzbar wenn sie UNABHÄNGIG voneinander festgestellt werden
- Im selben Kiefer kann gleicher Befund mehrfach ansetzbar sein (z.B. mehrere ww-Zähne)
- Im selben Kiefer können verschiedene Befunde nebeneinander auftreten
- Am selben Zahn können verschiedene Befunde gleichzeitig auftreten (z.B. 1.1 + 1.4/1.5)
- Nicht aufgeführte Kombinationen sind NICHT ansetzbar

VERBLEND-BEFUNDE 1.3 / 2.7 / 4.7:
- 1.3 je Einzelkrone im Verblendbereich kombinierbar mit 1.1
- 2.7 je Ankerkrone und je Brückenzwischenglied im Verblendbereich kombinierbar mit 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
- 4.7 je Teleskopkrone/Sekundärteil im Verblendbereich kombinierbar mit 3.2, 4.6, 6.10
- 1.3/2.7/4.7 richten sich in ihrer Kombinierbarkeit nach 1.1/2.1-2.6/3.2/4.6/6.10

BEFUND 6.4.1:
- Nur in Verbindung mit 6.4 ansetzbar
- Bei Erweiterung um NUR EINEN Zahn: nur 6.4 (nicht 6.4.1)
- Bei Erweiterung um weitere Zähne: je weiterem Zahn 6.4.1

BEFUND 6.5.1:
- Nur in Verbindung mit 6.5 ansetzbar
- Bei Erweiterung um NUR EINEN Zahn: nur 6.5 (nicht 6.5.1)
- Bei Erweiterung um weitere Zähne: je weiterem Zahn 6.5.1

INTERIMSPROTHESEN (Befundklasse 5):
- Nur in begründeten Einzelfällen kombinierbar mit Befundklassen 1 und 6
- Vorrang: endgültige Versorgung (Wirtschaftlichkeitsgebot)

SUPRAKONSTRUKTIONEN (Befundklasse 7):
- 7.2 kombinierbar mit 1.3 (Verblendzuschuss Krone) ODER 2.7 (Verblendzuschuss Brückenanker/-glied) je nach Art der Suprakonstruktion
- 7.5 erfasst alle Implantate + natürliche Zähne die zur Verankerung dienen. Kombination mit 7.1/7.2 oder BK 1/2 nur bei weiteren, NICHT verankerenden Implantaten/Zähnen
- 7.6 nur mit 7.5, atrophierter zahnloser Kiefer, max. 4x je Kiefer, je implantatgetragenem Konnektor

REPARATUREN / WIEDERHERSTELLUNGEN (BK 6, Befunde 7.3, 7.4, 7.7):
- Grundsatz: BK 6 und 7.3/7.4/7.7 nur UNTEREINANDER kombinierbar
- Ausnahme: gleichzeitige Neuversorgung auf demselben HKP → dann auch Kombinationen mit anderen BK möglich (siehe Anlage 3 Kombitabelle)

TEILLEISTUNGEN (BK 8):
- Wenn Befunde teils versorgt, teils noch nicht: FZ nach BK 8 mit FZ anderer BK kombinierbar

KOMBITABELLE 1 – MÖGLICHE KOMBINATIONEN (Befundklassen 1-4, Befunde 7.1/7.2/7.5, Stand 01.01.2014):
X = im selben Kiefer | O = am selben Zahn

1.1 ww kombinierbar mit: 1.2(X), 1.4(XO), 1.5(XO), 2.1(X), 2.2(X), 2.3(X), 2.4(X), 2.5(X), 2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.2/4.4(X), 4.5(X), 4.6(XO), 4.8(X), 4.9(X), 7.1(X), 7.2(X), 7.5(X³)
1.2 pw kombinierbar mit: 1.1(X), 1.4(XO), 1.5(XO), 2.1(X), 2.2(X), 2.3(X), 2.4(X), 2.5(X), 2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.5(X), 4.6(XO), 4.8(X), 4.9(X), 7.1(X), 7.2(X), 7.5(X³)
1.4 Stift konf. kombinierbar mit: 1.1(XO), 1.2(XO), 1.5(X), 2.1(X), 2.2(X), 2.3(X), 2.4(X), 2.5(X), 2.6(X), 3.1(X), 3.2(XO), 4.1/4.3(X), 4.5(X), 4.6(XO), 4.8(X), 4.9(X), 7.1(X), 7.2(X), 7.5(X³)
1.5 Stift gegoss. kombinierbar mit: 1.1(XO), 1.2(XO), 1.4(X), 2.1(X), 2.2(X), 2.3(X), 2.4(X), 2.5(X), 2.6(X), 3.1(X), 3.2(XO), 4.1/4.3(X), 4.5(X), 4.6(XO), 4.8(X), 4.9(X), 7.1(X), 7.2(X), 7.5(X³)
2.1 Lücke 1 Zahn kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.2(X), 2.3(X), 2.4(X), 2.5(X), 2.6(X), 3.1(X²), 3.2(X²), 4.1/4.3(X), 4.5(X), 7.1(X), 7.2(X), 7.5(X³)
2.2 Lücke 2 Zähne kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.3(X), 2.4(X), 2.5(X), 2.6(X), 3.1(X²), 3.2(X²), 4.1/4.3(X), 4.5(X), 7.1(X), 7.2(X), 7.5(X³)
2.3 Lücke 3 Zähne kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.4(X), 2.5(X), 2.6(X), 3.2(X²), 7.1(X), 7.2(X)
2.4 Lücke 4 Zähne kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.3(X), 2.5(X)
2.5 weitere Lücke kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.3(X), 2.4(X), 2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X)
2.6 disparallele Pfeiler kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.3(X), 2.5(X), 3.1(X), 3.2(X²), 4.1/4.3(X²), 4.5(X)
3.1 Lückensit.II kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X²), 2.2(X²), 2.5(X²), 2.6(X), 3.2(X), 4.1/4.3(X)
3.2 TK kombinierbar mit: 1.1(X), 1.2(X), 1.4(XO), 1.5(XO), 2.1(X²), 2.2(X²), 2.3(X²), 2.6(X), 3.1(X), 4.1/4.3(X), 4.5(X), 4.6(X)
4.1/4.3 Deckpr. kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.5(X), 2.6(X²), 3.1(X), 3.2(X), 4.5(X), 4.6(X)
4.2/4.4 zahnlos Pr. kombinierbar mit: 4.5(X), 4.9(X)
4.5 Metallbasis kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.6(X), 3.2(X), 4.1/4.3(X), 4.6(X), 4.8(X), 4.9(X), 7.5(X⁵)
4.6 TK zu 4.1/4.3 kombinierbar mit: 1.1(X), 1.4(XO), 1.5(XO), 3.2(X), 4.1/4.3(X), 4.5(X), 4.8(X⁴), 4.9(X)
4.8 Wurzelstiftkappe kombinierbar mit: 1.1(X), 1.2(X), 4.5(X), 4.6(X⁴), 4.9(X)
4.9 Stützstiftreg. kombinierbar mit: 1.1(X), 1.2(X), 4.2/4.4(X), 4.5(X), 4.6(X), 4.8(X)
7.1 Einzelimpl. kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.3(X), 2.5(X), 2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.5(X), 7.2(X), 7.5(X³)
7.2 kombinierbar mit: 1.1(X), 1.2(X), 1.4(X), 1.5(X), 2.1(X), 2.2(X), 2.3(X), 2.5(X), 2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.5(X), 7.1(X), 7.5(X³)
7.5 Proth. kombinierbar mit: 1.1(X³), 1.2(X³), 1.4(X³), 1.5(X³), 2.1(X³), 2.2(X³), 4.5(X⁵), 7.1(X³), 7.2(X²³)

Fußnoten Kombitabelle 1:
² = nur bei beidseitiger Freiendsituation und maximal 2 nebeneinander fehlenden OK-Schneidezähnen
³ = nur unter Bedingungen "Erneuerung von Suprakonstruktionen" kombinierbar
⁴ = nur bei Reparaturen
⁵ = nur bei Vorliegen der Zahnersatz-Richtlinie Nr. 36-Voraussetzungen (Metallbasis)

KOMBITABELLE 2 – KOMBINATIONEN BEI WIEDERHERSTELLUNGEN/ERNEUERUNGEN (BK 6, Befunde 7.3/7.4/7.7, Stand 06.11.2016):
X = im selben Kiefer | O = am selben Zahn

6.0 kombinierbar mit: 6.1(XXX), 6.2(XXX)
6.1 kombinierbar mit: 6.0(XXX), 6.2(XXX)
6.2 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(X), 2.1-2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.5(X), 4.6(X), 4.8(X), 5.1-5.3(X), 6.3(XXX), 6.4(XXX), 6.5(XXX)
6.3 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(X), 2.1-2.6(X), 3.2(X), 4.6(X), 6.2(XXX), 6.4(XX), 6.5(XXX)
6.4 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(X), 2.1-2.6(X), 3.2(X), 4.6(X), 6.2(XXX), 6.3(XX), 6.5(XXX)
6.5 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(X), 2.1-2.6(X), 3.2(X), 4.6(X), 6.2(XXX), 6.3(XXX), 6.4(XXX)
6.6 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(X), 2.1-2.6(X), 3.2(X), 4.6(X), 6.7(XX), 6.8(X)
6.7 kombinierbar mit: 6.6(XXX), 6.8(X)
6.8 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(XO), 2.1-2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.5(X), 4.6(X), 4.8(X), 5.1-5.3(X), 6.6(X), 6.7(X), 6.9(X), 6.10(X), 7.3(X), 7.4(X), 7.7(X)
6.9 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(XO), 2.1-2.6(X), 3.1(X), 3.2(X), 4.1/4.3(X), 4.5(X), 4.6(X), 4.8(X), 5.1-5.3(X), 6.8(X), 6.10(XO), 7.3(X)
6.10 kombinierbar mit: 1.1/1.2(X), 1.4/1.5(XO), 2.1-2.6(X), 3.2(X), 4.6(X), 6.8(XX), 6.9(X), 7.4(X), 7.7(XX)
7.3 kombinierbar mit: 6.8(X), 6.9(X), 7.4(X), 7.7(X)
7.4 kombinierbar mit: 6.8(X), 6.10(X), 7.3(X), 7.7(X)
7.7 kombinierbar mit: 6.8(XX), 6.10(X), 7.3(X), 7.4(X), 7.5(X²³)

ERGÄNZUNG KOMBITABELLE (KZBV/GKV-Spitzenverband, 24.09.2013, ab 01.01.2014):
- Befund 4.5 (Metallbasis) + Befund 7.5 (erneuerungsbedürftige implantatgetragene Prothese) sind KOMBINIERBAR
- Voraussetzung: Zahnersatz-Richtlinie Nr. 36 (atrophierter Kiefer, Torus palatinus, Exostosen)


=== MEHRKOSTENVEREINBARUNG (MKV) UND PRIVATVEREINBARUNG ===

GRUNDUNTERSCHIED:
- Mehrkostenvereinbarung (MKV) § 28 Abs.2 SGB V: GKV-Patient wählt höherwertige Füllung → trägt Mehrkosten selbst. KK rechnet günstigste plastische Füllung als Sachleistung ab (BEMA 13a-d). MKV ist PROSPEKTIV. Abrechnungsgrundlage: GOZ.
- Privatvereinbarung § 8 Abs.7 BMV-Z: Für Leistungen außerhalb GKV-Sachleistungskatalog (z.B. Austausch intakter Füllung, Wunschleistungen). Vollständige GOZ-Abrechnung OHNE BEMA-Abzug.
- Vereinbarung abweichende Gebührenhöhe § 2 GOZ: Wenn Steigerungssatz über 3,5-fach → zusätzlich zur MKV erforderlich. DEFINITIV (nicht prospektiv). NICHT kombinierbar mit MKV oder § 8 Abs.7 BMV-Z auf einem Formular!

ZULÄSSIGE FORMULARKOMBINATIONEN:
- § 2 GOZ + § 8 Abs.7 BMV-Z: NICHT kombinierbar (§ 2 Abs.2 S.3 GOZ: keine weiteren Erklärungen – BGH 09.03.2000 Az. III ZR 356/98)
- MKV + § 8 Abs.7 BMV-Z: NICHT kombinierbar (MKV deckt § 8 Abs.7 BMV-Z bei Füllungen bereits ab)
- MKV + § 2 GOZ: Getrennte Formulare, je 2 Unterschriften – möglich
- Zwei Formulare auf einem Blatt: möglich wenn optisch eindeutig getrennt + je 2 Unterschriften

BEMA-ABZUG BEI MKV (Gegenrechnung):
- Füllungen: BEMA 13a (F1), 13b (F2), 13c (F3), 13d (F4) gegenzurechnen
- Mehrschichtige Aufbaufüllung in Adhäsivtechnik: Nicht im GOZ → § 6 Abs.1 GOZ analog (z.B. 2120 GOZ je Zahn) | Abzug BEMA 13b (F2) für ZE-Vorbereitung: Abzug BEMA 13a/b
- Inlays: MKV möglich (GOZ 2150-2170 abzgl. BEMA 13a-d)

BEGLEITLEISTUNGEN BEI MKV:
- Anästhesie (auch bei GKV-Füllung nötig): BEMA 40/41 | Anästhesie NUR wegen Privatleistung: § 8 Abs.7 BMV-Z + GOZ 0090/0100 + Anästhetikum separat
- BEMA-Anästhesie: Anästhetikum NICHT extra | GOZ-Anästhesie: Anästhetikum EXTRA berechenbar
- Spanngummi/Kofferdam (GOZ 2040): Nur wenn NUR wegen Komposit nötig → privat; sonst BEMA 12
- BEMA 12 (bmf): NUR: Separieren, Zahnfleisch beseitigen, Spanngummi, Blutung stillen – KEINE anderen Maßnahmen!
- GOZ 2030 je Kieferhälfte/Frontzahn: je einmal für Präparieren + je einmal für Füllen ansetzbar
- Lupenbrille: NICHT gesondert abrechenbar → nur über erhöhten Steigerungsfaktor der Hauptleistung

PRIVATVEREINBARUNG § 8 ABS.7 BMV-Z:
- Schriftlich VOR Behandlungsbeginn | KZBV-Muster oder § 4 Abs.5d BMV-Z / § 7 Abs.7 EKV-Z
- Patient bestätigt: GKV-Recht bekannt, ausdrücklicher Wunsch nach Privatbehandlung, keine KK-Erstattung
- Beratung über Privatleistungen: GOÄ Ä1 – NICHT für Beratung über MKV!
- HKP privat: GOZ 0030 (auf Wunsch des Patienten, nicht zwingend)

SEPARAT VEREINBARUNGSFÄHIGE LEISTUNGEN BEI GKV-PATIENTEN (Beispiele):
- Beratung über Privatleistungen (z.B. Amalgam-Entfernung, Politur): GOÄ Ä1 – NICHT wenn BEMA 01 gleiche Sitzung!
- Schriftlicher HKP für Privatleistungen: GOZ 0030
- Oberflächenanästhesie je Kieferhälfte/Frontzahn: GOZ 0080 (Anästhetikum NICHT extra)
- Entfernen weicher Beläge einwurzelig: GOZ 4050 | mehrwurzelig: GOZ 4055 (BEMA 107 = nur harte Beläge, 1x/Jahr)
- Besondere Maßnahmen Präparieren/Füllen: GOZ 2030
- Präparationsschutz Nachbarzähne mit Teflon: GOZ 2030 (nicht in BEMA 12)
- Formgebungshilfe/Matrize anlegen: GOZ 2030 (separater Ansatz von Separieren möglich)
- Anlegen Spanngummi/Kofferdam (wenn nur wegen Komposit): GOZ 2040
- Kariesdetektor (Erythrosin, Fuchsin, Silbernitrat): analog § 6 Abs.1 GOZ
- Zahnfarbbestimmung: BEB 0723 einfach | 0724 individuell | 0725 digital
- Nachpolitur/Rekonturierung Restauration: GOZ 2130 (NUR Restaurationen; Rekonstruktionen wie Teilkrone → § 6 Abs.1 GOZ analog)
- Finieren/Polieren Rekonstruktion (z.B. Teilkrone): analog § 6 Abs.1 GOZ
- Fluoridierung angeätzter Schmelzpartien nach Füllungstherapie: GOZ 1020 je Sitzung (NICHT als üZ nach BEMA 10!)
- Entfernung Amalgamfüllung mit speziellen Verfahren (Absaugtechnik, Austamponieren): analog § 6 Abs.1 GOZ
- Subgingivale medikamentöse antibakt. Lokalapplikation je Zahn: GOZ 4025 + Material (bei Implantat: § 6 Abs.1 GOZ analog); NICHT für einfache Taschenspülung!
- PZR GOZ 1040 je Zahn/Implantat/Brückenglied: § 8 Abs.7 BMV-Z erforderlich

ENDODONTIE + ADHÄSIVE BEFESTIGUNG (GOZ 2197):
- GOZ 2197 neben BEMA 34 (Med): Adhäsiver keimdichter Verschluss zwischen Sitzungen → über GKV-Standard → privat vereinbarungsfähig (Liebold/Raff/Wissing)
- GOZ 2197 neben BEMA 35 (WF): Adhäsive Befestigung Wurzelkanalfüllung → privat vereinbarungsfähig
- GOZ 2197 neben GOZ 2440: Beschluss Beratungsforum Gebührenordnungsfragen Nr.4 → zusätzlich berechnungsfähig
- Bei GKV immer: § 8 Abs.7 BMV-Z VOR Behandlung | Keine MKV bei Endo (Sachleistungsprinzip)

KINDERPROPHYLAXE PRIVAT:
- IP1+IP2 nur 1x/Kalenderhalbjahr GKV (6. bis <18. Lj)
- Häufigere Frequenz (z.B. KFO-Träger): § 8 Abs.7 BMV-Z + GOZ 1000/1010
- BEMA 107 (harte Beläge) + GOZ 4050/4055 gleiche Sitzung: VERBOTEN
- GOZ 1020 NICHT neben BEMA IP4 gleiche Sitzung (Leistungsüberschneidung)
- GOZ 1040 NICHT neben BEMA 107, GOZ 1020, 4050/4055 gleichzeitig

PAR-BEHANDLUNG PRIVATLEISTUNGEN:
- PZR (GOZ 1040): Privatvereinbarung § 8 Abs.7 BMV-Z | VOR AIT oder zeitlich getrennt (AIT enthält supragingivale Belagsentfernung!)
- PZR während AIT: nur für Zähne mit ST < 4mm (kein AIT-Anspruch) | PZR + UPTc gleiche Sitzung: NICHT möglich
- PZR in UPT-Phase: streitig; medizinisch indizierte PZR zwischen UPT-Terminen möglich (laut KZV Sachsen)
- PZR am Implantat: auch während UPT privat vereinbarbar (GOZ 1040)
- Polieren nach UPTc: NICHT gesondert abrechenbar
- Lokale Antibiotikabehandlung: GOZ 4025 | bei Implantat: § 6 Abs.1 GOZ analog
- Mikrobielle Diagnostik: GOÄ 298 je Entnahmestelle/Papierspitze; Labor-Kosten aufklären
- Chirurgische PAR-Zusatzleistungen (nur nach PAR, privat): GOZ 4110 (Knochendefekte auffüllen), 4138 (Membran), 4120, 4130, 4133
- PRGF-Verfahren: analog GOÄ 2442 oder 2255
- Laserbehandlung PAR: analog GOZ 4090/4100 | Gesamte PAR per Laser → gesamte Behandlung privat
- Vector-System: mehrheitlich NICHT als AIT-Vertragsleistung → privat vereinbaren
- BEV (BEMA BEVa): Nur 1x in Behandlungsstrecke | überweisende Praxis rechnet BEVa ab; BEVb nach CPT: Hauszahnarzt
- PAR über BEMA 50 (Exz2): nur absoluter Ausnahmefall (Patient verliert UPT-Anspruch!) → immer KZV fragen
- Häufigere UPT als Frequenz Progressionsgrad: NICHT als Privatleistung vereinbarbar

ZAHNERSATZ-BEGLEITLEISTUNGEN:
- Regelversorgung: Begleitleistungen nach BEMA (Versorgungsart "ZE/5") über KZV | HKP-Aufstellung KOSTENFREI!
- Gleichartig: Begleitleistungen auch bei Regelversorgung angefallen → BEMA; nur wegen Gleichartigkeit → GOZ
- Andersartig/Mischfall: Begleitleistungen nach GOZ (§ 8 Abs.7 BMV-Z VOR Behandlung)
- Beratung Privatleistungen: GOÄ Ä1 | HKP privat: GOZ 0030
- Adhäsive Befestigung GOZ 2197 bei gleichartigem ZE (Zirkon): privat (ausschließlich durch Gleichartigkeit bedingt)
- Mischfall: >50% Honorar Regel+gleichartig → KZV; >50% andersartig → Direktabrechnung mit Patient
- Provisorische Kronen aufwendig (über BEMA 19 hinaus): § 8 Abs.7 BMV-Z + GOZ 2270/5120/5140 + BEB
- BEB Provisorien chairside: 1430 (Ausarbeiten), 1431 (Überarbeiten/Polieren), 1437 (Verbindungsstelle), 1438 (okklusaler Aufbau), 1404 (Formteil Silikon), 1432 (Umarbeitung definitive Krone)
- Materialkosten Provisorium: Kunststoff NICHT extra; nur Konfektionsteile + Abformmaterial
- BEMA 98a: Nur wenn Brücke oder mind. 3 Einzelkronen; NICHT bei einziger Einzelkrone

=== ELEKTRONISCHES BEANTRAGUNGS- UND GENEHMIGUNGSVERFAHREN (EBZ, ab 01.07.2022) ===

GRUNDPRINZIP:
- EBZ ersetzt papiergebundenes HKP-Verfahren für alle Krankenkassen (NICHT für Sozialämter, Asyl, Heilfürsorge → dort weiter Papier!)
- Ab 01.01.2023 verpflichtend für alle Zahnarztpraxen | Papier nur bei technischen Störungen (Papier-Stylesheets)
- Rechtsgrundlage: 30. ÄndV zum BMV-Z (ab 01.01.2022), Anlage 15 BMV-Z

VORAUSSETZUNGEN (Praxis):
- Bundesweit eindeutige Zahnarztnummer (aus KBV-Kontingent, zugeteilt von KZV)
- Anschluss an Telematikinfrastruktur (TI) | eZahnarztausweis (ZOD-/G0-/G2-Karte)
- KIM-Anbindung (Kommunikation im Medizinwesen, mind. 1 KIM-Mailadresse)
- EBZ-Module beim PVS-Anbieter bestellen

ABLAUF:
- Praxis generiert per PVS eindeutige Auftragsnummer → Daten als XML-Datei per KIM verschlüsselt an KK
- Übersendung erfolgt NICHT automatisch → Praxis muss aktiv anstoßen
- KK muss Genehmigung oder Ablehnung herbeiführen (keine bloße Kenntnisnahme!)
- Automatisierte "Dunkelfeldverarbeitung": Interimsprothesen u.U. innerhalb eines halben Tages genehmigt
- Ablehnung → Fall gilt als nicht abrechenbar (auch wenn noch keine Antwort vorliegt!)
- Antwortdatensatz kommt direkt ins PVS | KFO-Änderungsanträge auch für Papier-genehmigte Pläne möglich

MEHRSTUFIGES PRÜFVERFAHREN:
- Vorprüfung: physikalische Lesbarkeit + Gültigkeit Kommunikationspartner
- Schematische Validierung: Struktur-, Syntax- und Schlüsselprüfungen → bei Fehler: "Fehlernachricht"
- Fachliche Fehler/Implausibilitäten: führen zu Ablehnung über "Antwortnachricht" (nicht Fehlernachricht)

SCHLÜSSELVERZEICHNISSE KASSE (ANW):
0 = nicht genehmigt | 1 = genehmigt
Begründung: 01=nicht richtlinienkonform | 02=fehlende Versicherung | 03=gutachterlich befürwortet | 04=nicht befürwortet | 05=teilweise befürwortet | 06=Taschentiefen unzureichend (PAR) | 07=Implantatversorgung (PAR) | 08=letzte Behandlung <2 Jahre (PAR) | 10=ZE innerhalb Gewährleistung | 11=anderer Kostenträger | 12=auf Wunsch Versicherten zurückgezogen | 13=Sonstiges | 14=Aktualisierung von selber Praxis

NEUE BEFUND-/THERAPIEKÜRZEL ZE (ab 01.07.2022 verbindlich – auch für Papierverfahren!):
Neue Befundkürzel:
- bw = erneuerungsbedürftiges Brückenglied (alt: "b" reichte nicht)
- pkw = erneuerungsbedürftige Teilkrone
- sb = implantatgetragenes Brückenglied | sbw = erneuerungsbedürftig
- se = ersetzter Zahn implantatgetragener Prothese | sew = erneuerungsbedürftig
- sk = implantatgetragene Krone | skw = erneuerungsbedürftig
- so = implantatgetragenes Verbindungselement (Locator, Kugelanker, Steg) | sow = erneuerungsbedürftig
- st = implantatgetragene Teleskopkrone | stw = erneuerungsbedürftig
- t2w = erneuerungsbedürftiges Sekundärteil einer Teleskopkrone (alt: "tw")
WEGFALL: "i" (intaktes Implantat) und "sw" (zu erneuernde Suprakonstruktion) entfallen!

Neue Therapiekürzel:
- T2 = Sekundärteil Teleskopkrone | T2M = vollkeramisch | T2V = mit vestibulärer Verblendung
- SK = implantatgetragene Krone | SKMO = vollkeramisch mit Geschiebe
- SB = implantatgetragenes Brückenglied | SBM = vollkeramisch | SBV = mit vestibulärer Verblendung
- SE = zu ersetzender Zahn | SEO = mit Stegverbindung
- SO = implantatgetragenes Verbindungselement (ersetzt "SR")
- A = Adhäsivbrücke Anker | ABV = mit vestibulärer Verblendung | ABM = vollkeramisch
- KO = Krone mit Geschiebe | KMH = Krone vollkeramisch mit Halteelement
Nicht integriert (kein eigener FZ bei Implantaten): st2w, ST2, ST2M, ST2V

Bemerkungsfeld-Schlüssel ZE:
01=Medizinische Indikation | 02=ZE verloren | 03=Indikation Metallbasis | 04=Langzeitprovisorium | 07=ZA wünscht Rücksprache | 11=Wiederherstellung/Bruch | 15=Erosionsgebiss | 18=Fehlende Versorgungsnotwendigkeit Freiendsituation

KFO IM EBZ – 7 Schlüssellisten:
1. KIG-Einstufung (z.B. D1 = KIG 1 sagittal distal bis 3mm | M5 = KIG 5 mesial über 3mm)
2. Anamnese: 01=Milchgebiss | 02=frühes Wechselgebiss | 03=spätes Wechselgebiss | 04=bleibendes Gebiss | 05=kfo vorbehandelt | 06=Zustand nach Trauma | 07=Metall-/Kunststoffallergie | 08=familiäres Vorkommen | 99=Sonstiges
3. Geräte: 01=Plattenapparaturen | 05=FKO-Gerät | 06=Multibracket | 07=TPA | 08=Quadhelix | 09=Lingualbogen | 11=Headgear | 12=GME | 13=Herbstscharnier | 14=Delairemaske | 17=Retainer 33-43 | 99=Sonstiges
4-7: Diagnose Bisslage, Therapie, Bisslage Therapie, Grund unplanmäßiger Verlauf/Abbruch
Freitext: überall im "Sonstiges"-Feld (Schlüssel 99) möglich

PAR IM EBZ (geplant ab April 2023): 15 Schlüssellisten
- Knochenabbau: 1=<15% | 2=15-33% | 3=>33%
- CAL: 1=1-2mm | 2=3-4mm | 3=>=5mm
- Diabetes: 1=kein | 2=HbA1c<7% | 3=HbA1c>=7%
- Rauchen: 1=kein | 2=<10 Zigaretten/Tag | 3=>=10
- Bemerkungsfeld PAR: 01=richtlinienüberschreitend auf Wunsch Versicherten | 99=Sonstiges

=== PRAXIS-EIGENE EINTRÄGE ===
${dbKnowledge || '(noch keine eigenen Einträge)'}

Antworte strukturiert mit konkreten Nummern, Punktzahlen und Eurobeträgen. Bei BEMA-Fragen immer Bewertungszahl nennen. Weise auf Abrechnungsausschlüsse und wichtige Hinweise hin. Bei Festzuschuss-Fragen: immer alle 4 Stufen (60%/70%/75%/100%) nennen und auf den neuen Stand ab 01.01.2026 hinweisen. Bei Fragen zur Befundkombinierbarkeit: nutze die Kombitabellen und Erläuterungen (G-BA/KZBV). Bei Fragen zu HKP-Befundkürzeln (ww/ur): weise auf die Interpretationen KZBV/GKV-Spitzenverbände und neuen EBZ-Kürzel ab 01.07.2022 hin. Bei Fragen zur Versorgungsform (Regelversorgung/gleichartig/andersartig): erkläre die Abgrenzung klar. Bei Fragen zur MKV/Privatvereinbarung: erkläre Unterschied, Formularregeln und was kombinierbar ist. Bei Fragen zur Bundespolizei-Heilfürsorge weise auf Besonderheiten gegenüber normalen GKV-Patienten hin. Bei Fragen zur Sozialhilfe/Jugendhilfe BW weise auf Behandlungsausweis und Genehmigungspflichten hin. Bei Fragen zur Bundeswehr-Heilfürsorge weise auf BwHFV-Rechtsgrundlage, utV-Besonderheiten, Genehmigungspflichten und Verblendgrenzen hin. Bei Fragen zum EBZ: Schlüsselverzeichnisse, neue Befundkürzel (sb/sk/so/bw/pkw/t2w etc.) und technische Voraussetzungen nennen. Bei GOZ 2197: alle Einsatzmöglichkeiten neben BEMA und GOZ erläutern. Bei Kinderprophylaxe privat: GKV-Grenzen und GOZ-Möglichkeiten klar abgrenzen.`;
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

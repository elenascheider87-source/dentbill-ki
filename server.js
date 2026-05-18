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

function initDefaultsForced() {
  // Setzt Kategorien und Wissensdatenbank auf GOZ/BEMA-Standard zurück
  // Wird beim Start UND beim Admin-Reset aufgerufen
  initDefaults();
}

function initDefaults() {
  // Always refresh categories with full GOZ/BEMA subcategory list
  writeData('categories.json', [
  {
    "id": "bema",
    "label": "BEMA",
    "color": "#2563eb",
    "icon": "B",
    "desc": "Gesetzliche Krankenversicherung – alle BEMA-Leistungen"
  },
  {
    "id": "goz",
    "label": "GOZ",
    "color": "#7c3aed",
    "icon": "G",
    "desc": "Privatpatienten – GOZ 2012 Gebührenordnung"
  },
  {
    "id": "festzuschuss",
    "label": "Festzuschüsse",
    "color": "#d97706",
    "icon": "F",
    "desc": "Zahnersatz Regelversorgung & gleichartige Versorgung"
  },
  {
    "id": "labor",
    "label": "Labor / BEL II",
    "color": "#16a34a",
    "icon": "L",
    "desc": "Laborleistungen, Labortarife, Laborabrechnung"
  },
  {
    "id": "gewaehr",
    "label": "Gewährleistung",
    "color": "#dc2626",
    "icon": "W",
    "desc": "Fristen für Füllungen, Kronen, Prothesen"
  },
  {
    "id": "prophylaxe",
    "label": "Prophylaxe",
    "color": "#0284c7",
    "icon": "P",
    "desc": "PZR, IP-Leistungen, Früherkennungsuntersuchungen"
  },
  {
    "id": "chirurgie",
    "label": "Chirurgie",
    "color": "#9333ea",
    "icon": "C",
    "desc": "Oralchirurgische Leistungen, Extraktionen"
  },
  {
    "id": "prothetik",
    "label": "Prothetik",
    "color": "#db2777",
    "icon": "T",
    "desc": "Zahnersatz, Reparaturen, Unterfütterungen"
  },
  {
    "id": "goz-ze",
    "label": "GOZ Zahnersatz",
    "color": "#7c3aed",
    "icon": "G",
    "desc": "Kronen, Brücken, Prothesen – Privat"
  },
  {
    "id": "goz-implanto",
    "label": "GOZ Implantologie",
    "color": "#6d28d9",
    "icon": "I",
    "desc": "Implantation, Augmentation, Sinuslift – Privat"
  },
  {
    "id": "goz-chirurgie",
    "label": "GOZ Chirurgie",
    "color": "#7c3aed",
    "icon": "C",
    "desc": "Oralchirurgie – Privat"
  },
  {
    "id": "goz-endo",
    "label": "GOZ Endodontie",
    "color": "#7c3aed",
    "icon": "E",
    "desc": "Wurzelkanalbehandlung – Privat"
  },
  {
    "id": "goz-kons",
    "label": "GOZ Konservierend",
    "color": "#7c3aed",
    "icon": "K",
    "desc": "Füllungen, Aufbauten – Privat"
  },
  {
    "id": "goz-pa",
    "label": "GOZ Parodontologie",
    "color": "#7c3aed",
    "icon": "A",
    "desc": "PA-Behandlung – Privat"
  },
  {
    "id": "goz-prophylaxe",
    "label": "GOZ Prophylaxe",
    "color": "#7c3aed",
    "icon": "P",
    "desc": "PZR, Bleaching – Privat"
  },
  {
    "id": "goz-kfo",
    "label": "GOZ Kieferorthopädie",
    "color": "#7c3aed",
    "icon": "O",
    "desc": "Aligner, Schienen – Privat"
  },
  {
    "id": "goz-verlangen",
    "label": "GOZ Verlangensleistungen",
    "color": "#7c3aed",
    "icon": "V",
    "desc": "Botox, Bleaching etc. – Privat"
  },
  {
    "id": "bema-ze",
    "label": "BEMA Zahnersatz",
    "color": "#2563eb",
    "icon": "B",
    "desc": "Prothesen, Brücken – GKV"
  },
  {
    "id": "bema-chirurgie",
    "label": "BEMA Chirurgie",
    "color": "#1d4ed8",
    "icon": "C",
    "desc": "Extraktionen, OP – GKV"
  },
  {
    "id": "bema-endo",
    "label": "BEMA Endodontie",
    "color": "#1d4ed8",
    "icon": "E",
    "desc": "Wurzelkanalbehandlung – GKV"
  },
  {
    "id": "bema-kons",
    "label": "BEMA Konservierend",
    "color": "#1d4ed8",
    "icon": "K",
    "desc": "Füllungen – GKV"
  },
  {
    "id": "bema-pa",
    "label": "BEMA Parodontologie",
    "color": "#1d4ed8",
    "icon": "A",
    "desc": "PA-Behandlung – GKV"
  },
  {
    "id": "bema-prophylaxe",
    "label": "BEMA Prophylaxe",
    "color": "#1d4ed8",
    "icon": "P",
    "desc": "IP1-4, FU – GKV"
  },
  {
    "id": "bema-schienen",
    "label": "BEMA Schienen",
    "color": "#1d4ed8",
    "icon": "S",
    "desc": "CMD, Aufbissschienen – GKV"
  },
  {
    "id": "bema-untersuchungen",
    "label": "BEMA Untersuchungen",
    "color": "#1d4ed8",
    "icon": "U",
    "desc": "Befunde, Kontrollen – GKV"
  },
  {
    "id": "bema-notdienst",
    "label": "BEMA Notdienst",
    "color": "#1d4ed8",
    "icon": "N",
    "desc": "Notfallbehandlung – GKV"
  }
]);
  if (!readData('knowledge.json', null) || readData('knowledge.json',[]).length < 20) {
    writeData('knowledge.json', [
  {
    "id": "k1",
    "categoryId": "bema",
    "title": "BEMA 23a – Zahnsteinentfernung",
    "content": "BEMA 23a (früher 1040): Supragingivale Zahnsteinentfernung. 19 Punkte je Kiefer. 1x pro Kiefer pro Quartal. NICHT kombinierbar mit PZR in gleicher Sitzung.",
    "tags": [
      "1040",
      "23a",
      "zahnstein",
      "scaling"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k2",
    "categoryId": "gewaehr",
    "title": "Gewährleistungsfristen – Überblick",
    "content": "Kunststofffüllungen GKV: 2 Jahre. Zahnersatz mit Festzuschuss (§136a SGB V): 5 Jahre. Prothesen GKV: 5 Jahre. Implantate: keine gesetzliche Frist. GOZ/Privat: 2 Jahre (§634 BGB).",
    "tags": [
      "gewährleistung",
      "fristen",
      "füllungen",
      "kronen",
      "prothesen"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k3",
    "categoryId": "bema",
    "title": "MU (Ä1) nach Protheseneinsetzen",
    "content": "MU (Ä1) innerhalb von 3 Monaten nach Eingliederung einer Prothese ist NICHT extra abrechenbar. Ausnahme: neuer eigenständiger Behandlungsanlass – dokumentieren!",
    "tags": [
      "mu",
      "ä1",
      "prothese",
      "frist",
      "kontrolle"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k4",
    "categoryId": "prophylaxe",
    "title": "PZR – GOZ 1040",
    "content": "PZR = GOZ Nr. 1040. Je Zahn/Implantat/Brückenglied. 28 Punkte, 2,3-fach: 3,62€. NICHT neben GOZ 1020, 4050, 4055, 4060, 4070, 4075, 4090, 4100. PZR ist reine Privatleistung!",
    "tags": [
      "pzr",
      "prophylaxe",
      "goz",
      "1040"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k5",
    "categoryId": "festzuschuss",
    "title": "Festzuschüsse – Regelversorgung vs. gleichartig",
    "content": "Regelversorgung: 60% (Bonus 5J: 70%, 10J: 75%). Gleichartig: halber Zuschuss. Anderartig: KEIN Zuschuss. HKP immer VOR Behandlung mit Patientenunterschrift!",
    "tags": [
      "festzuschuss",
      "regelversorgung",
      "gleichartig",
      "hkp"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k6",
    "categoryId": "goz",
    "title": "GOZ Steigerungsfaktoren §5",
    "content": "Punktwert: 5,62421 Cent. Regelfall: 2,3-fach. Max ohne Vereinbarung: 3,5-fach. Über 3,5-fach: schriftliche Honorarvereinbarung VOR Behandlung. Über 2,3-fach: Begründung auf Rechnung.",
    "tags": [
      "steigerungsfaktor",
      "goz",
      "punktwert"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k7",
    "categoryId": "chirurgie",
    "title": "GOZ Extraktionen Übersicht",
    "content": "3000: einwurzelig 70Pkt/9,05€ | 3010: mehrwurzelig 110Pkt/14,23€ | 3020: tief frakturiert 270Pkt/34,93€ | 3030: Osteotomie 350Pkt/45,27€ | 3040: retiniert 540Pkt/69,85€",
    "tags": [
      "extraktion",
      "3000",
      "3010",
      "3030",
      "3040"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "k8",
    "categoryId": "goz",
    "title": "GOZ §6 Analogleistungen",
    "content": "Leistungen nicht im GOZ-Verzeichnis → analog abrechnen. Auf Rechnung: Beschreibung + entsprechend + Nummer der analogen Leistung.",
    "tags": [
      "§6",
      "analog",
      "analogleistung"
    ],
    "date": "2024-01-01"
  },
  {
    "id": "goz-1",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Augmentation mit Knochenentnahme",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä3 (3,50x) – Eingehende Beratung\nGOZ Ä1 (3,50x) – Beratung\nGOZ Ä5 (3,20x) – Symptombezogene Untersuchung\nGOZ Ä6 (2,30x) – Vollständige körperliche Untersuchung\nGOZ 4020 (2,30x) – Keimreduzierung Mundhöhle\nGOZ 0080 (2,30x) – Intraorale Oberflächenanästhesie\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 9000 (3,00x) – Implantatbezogene Analyse\nGOZ 9140 (3,00x) – Intraorale Knochenentnahme\nGOZ Ä2382 (3,00x) – Schwierige Hautlappenplastik\nGOZ 9100 (3,50x) – Aufbau Alveolarfortsatz (Augmentation)\nGOZ 0530 (1,00x) – Zuschlag nichtstationär\nGOZ 9150 (3,50x) – Fixation Augmentat\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 3290 (2,30x) – Kontrolle nach chirurgischem Eingriff\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 1382.42 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "augknochn"
    ],
    "date": "2025-01-01",
    "kuerzel": "*AugKnochn",
    "betrag": 1382.42
  },
  {
    "id": "goz-2",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Augmentation des Alveolarfortsatzes",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä3 (3,50x) – Eingehende Beratung\nGOZ Ä1 (3,50x) – Beratung\nGOZ Ä5 (3,20x) – Symptombezogene Untersuchung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 9000 (3,00x) – Implantatbezogene Analyse\nGOZ 9100 (3,50x) – Aufbau Alveolarfortsatz\nGOZ 0530 (1,00x) – Zuschlag nichtstationär\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 1010.67 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "augmentat"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Augmentat",
    "betrag": 1010.67
  },
  {
    "id": "goz-3",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Bindegewebstransplantat mit Verbandplatte",
    "content": "Leistungen:\nGOZ Ä1 (3,50x) – Beratung\nGOZ Ä5 (3,20x) – Symptombezogene Untersuchung\nGOZ 5170 (2,30x) – Anatomische Abformung\nGOZ Ä6 (2,30x) – Vollständige körperliche Untersuchung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 4090 (3,50x) – Lappenoperation, offene Kürettage\nGOZ 4133 (3,50x) – Gewinnung/Transplantation Bindegewebe\nGOZ Ä2675 (2,30x) – Partielle Vestibulumplastik\nGOZ Ä444 (1,00x) – Zuschlag ambulant\nGOZ 4150 (2,30x) – Kontrolle/Nachbehandlung parodontal\n\nGesamtbetrag ca.: 669.59 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "bgt+vpl"
    ],
    "date": "2025-01-01",
    "kuerzel": "*BGT+VPL",
    "betrag": 669.59
  },
  {
    "id": "goz-4",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Bisserhöhung mit therapeutischen Aufbauten",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung\nGOZ 8010 (2,30x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle\nGOZ 2030 (3,40x) – Besondere Maßnahmen Präparieren\nGOZ 2220t (3,50x) – Therapeutischer Aufbau Funktionsflächen\nGOZ 2197 (3,50x) – Adhäsive Befestigung\n\nGesamtbetrag ca.: 447.92 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "bisserhöh"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Bisserhöh",
    "betrag": 447.92
  },
  {
    "id": "goz-5",
    "categoryId": "goz-verlangen",
    "title": "[GOZ Privat] Bleaching (Homebleaching)",
    "content": "Leistungen:\nGOZ Bleahome (–x) – Homebleaching inkl. Beratung, Abformung und Einsetzen\n\nGesamtbetrag ca.: 426.81 €",
    "tags": [
      "goz",
      "privat",
      "verlangensleistungen",
      "bleaching"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Bleaching",
    "betrag": 426.81
  },
  {
    "id": "goz-6",
    "categoryId": "goz-verlangen",
    "title": "[GOZ Privat] Botox",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ 0010 (3,40x) – Eingehende Untersuchung\nGOZ Ä1 (3,50x) – Beratung\nGOZ Ä2181a (2,30x) – Manuelle Strukturanalyse\nGOZ Ä252 (2,30x) – Injektion subkutan/submukös\nGOZ Ä399 (2,30x) – Oraler Provokationstest\n\nGesamtbetrag ca.: 123.91 €",
    "tags": [
      "goz",
      "privat",
      "verlangensleistungen",
      "botox"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Botox",
    "betrag": 123.91
  },
  {
    "id": "goz-7",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Brücke privat – Präparation",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ Ä1 (3,50x) – Beratung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 2290 (3,50x) – Entfernung Krone\nGOZ 2030 (3,20x) – Besondere Maßnahmen\nGOZ 2330 (2,30x) – Erhaltung vitale Pulpa\nGOZ 4070 (3,50x) – Parodontalchirurgische Therapie\nGOZ 2180 (3,50x) – Vorbereitung zerstörter Zahn\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 5120 (3,50x) – Provisorische Brücke direkt\nGOZ 0065 (2,30x) – Optisch-elektronische Abformung\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\n\nGesamtbetrag ca.: 552.29 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "brücke i"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Brücke I",
    "betrag": 552.29
  },
  {
    "id": "goz-8",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Brücke privat – Gerüsteinprobe",
    "content": "Leistungen:\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle\nGOZ 4150 (2,30x) – Kontrolle/Nachbehandlung parodontal\n\nGesamtbetrag ca.: 101.81 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "brücke ii"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Brücke II",
    "betrag": 101.81
  },
  {
    "id": "goz-9",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Brücke privat – ZE-Eingliederung",
    "content": "Leistungen:\nGOZ Ä6 (2,30x) – Vollständige Untersuchung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 5010 (3,50x) – Zirkonankerkrone\nGOZ 5070 (3,50x) – Zirkonbrückenglied\n\nGesamtbetrag ca.: 446.48 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "brücke iii"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Brücke III",
    "betrag": 446.48
  },
  {
    "id": "goz-10",
    "categoryId": "goz-endo",
    "title": "[GOZ Privat] Endo MKV (komplett)",
    "content": "Leistungen:\nGOZ 2400 (3,50x) – Elektrometrische Längenbestimmung\nGOZ 2420 (3,50x) – Elektrophysikalische Anwendung\nGOZ 2410 (4,60x) – Aufbereitung Wurzelkanal\nGOZ 2400 (3,50x) – Elektrometrische Längenbestimmung\nGOZ 2420 (3,50x) – Elektrophysikalische Anwendung\n\nGesamtbetrag ca.: 184.10 €",
    "tags": [
      "goz",
      "privat",
      "endo",
      "endo_mkv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Endo_MKV",
    "betrag": 184.1
  },
  {
    "id": "goz-11",
    "categoryId": "goz-endo",
    "title": "[GOZ Privat] Endo Revision Wurzelfüllung",
    "content": "Diagnose: Zahn XX – Revision der Wurzelfüllung\n\nLeistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä1 (3,50x) – Beratung\nGOZ 2040 (2,30x) – Anlegen Spanngummi\nGOZ 2390 (2,30x) – Trepanation\nGOZ 2300a (2,30x) – Entfernung Wurzelfüllmaterial\nGOZ 2410 (3,50x) – Aufbereitung Wurzelkanal\nGOZ 0110 (1,00x) – Zuschlag OP-Mikroskop\nGOZ Ä5000 (2,50x) – Zähne, je Projektion\nGOZ 2400 (3,50x) – Elektrometrische Längenbestimmung\nGOZ 2430 (2,30x) – Medikamentöse Einlage\nGOZ 2020 (3,50x) – Temporärer Verschluss\nGOZ 2440 (3,50x) – Füllung Wurzelkanal\nGOZ 2120a (2,30x) – Mehrschichtiger Aufbau\nGOZ 2060 (3,50x) – Präparieren Kavität, Restauration\n\nGesamtbetrag ca.: 762.84 €",
    "tags": [
      "goz",
      "privat",
      "endo",
      "endo_revi"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Endo_Revi",
    "betrag": 762.84
  },
  {
    "id": "goz-12",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Extraorale Anästhesie intermuskulär",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä1 (2,30x) – Beratung\nGOZ Ä2181a (3,50x) – Manuelle Strukturanalyse\nGOZ Ä252 (2,30x) – Injektion\nGOZ Ä399 (2,30x) – Oraler Provokationstest\n\nGesamtbetrag ca.: 128.02 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "extraoral"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Extraoral",
    "betrag": 128.02
  },
  {
    "id": "goz-13",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Freilegen eines Implantates",
    "content": "Leistungen:\nGOZ Ä1 (3,50x) – Beratung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 9040cam (3,50x) – Freilegen Implantat\nGOZ 9050a (3,50x) – Individualisierung Gingivaformer\nGOZ 4138 (3,50x) – Verwendung Membran\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 382.73 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "freil"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Freil",
    "betrag": 382.73
  },
  {
    "id": "goz-14",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Implantatinsertion",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä3 (3,50x) – Eingehende Beratung\nGOZ Ä5 (3,20x) – Symptombezogene Untersuchung\nGOZ Ä5377 (1,00x) – Zuschlag CT-Analyse\nGOZ Ä5370 (2,00x) – CT Kopfbereich\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung (4x)\nGOZ 6010 (3,00x) – Computergestützte Auswertung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 9000 (3,00x) – Implantatbez. Analyse\nGOZ 9003 (3,50x) – Orientierungsschablone\nGOZ 9010cam (3,50x) – Implantatinsertion je Implantat\nGOZ 0530 (1,00x) – Zuschlag nichtstationär\nGOZ 9090 (3,50x) – Knochengewinnung\nGOZ 3100 (3,00x) – Plastische Deckung\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 1334.32 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "impla_ein"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Impla_ein",
    "betrag": 1334.32
  },
  {
    "id": "goz-15",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Implantatinsertion mit Augmentation",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä5370 (2,00x) – CT Kopfbereich\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung (4x)\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 9000 (3,00x) – Implantatbez. Analyse\nGOZ 9003 (3,50x) – Orientierungsschablone\nGOZ 9010cam (3,50x) – Implantatinsertion\nGOZ 9100 (3,00x) – Aufbau Alveolarfortsatz\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 1653.47 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "implaaug"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplaAug",
    "betrag": 1653.47
  },
  {
    "id": "goz-16",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Implantatinsertion mit externem Sinuslift",
    "content": "Leistungen:\nGOZ 0040 (3,50x) – HKP\nGOZ Ä5370 (2,00x) – CT Kopfbereich\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung (4x)\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (2,70x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 9000 (3,00x) – Implantatbez. Analyse\nGOZ 9010cam (3,50x) – Implantatinsertion\nGOZ 9120 (3,50x) – Sinusbodenelevation extern\nGOZ 9100_1/3 (3,00x) – 1/3 Gebühr Aufbau Alveolarfortsatz\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (3,50x) – Nachbehandlung\n\nGesamtbetrag ca.: 1851.13 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "implase"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplaSE",
    "betrag": 1851.13
  },
  {
    "id": "goz-17",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Implantatinsertion mit internem Sinuslift",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä5370 (2,00x) – CT Kopfbereich\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung (4x)\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 9000 (3,00x) – Implantatbez. Analyse\nGOZ 9010cam (3,50x) – Implantatinsertion\nGOZ 9110 (3,50x) – Geschlossene Sinusbodenelevation\nGOZ 9100_1/2 (3,00x) – 1/2 Gebühr Aufbau Alveolarfortsatz\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 1604.89 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "implasi"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplaSi",
    "betrag": 1604.89
  },
  {
    "id": "goz-18",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Inlay PKV",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 0090 (2,70x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 4050 (2,30x) – Entfernung Zahnbeläge\nGOZ 2030 (3,40x) – Besondere Maßnahmen\nGOZ 2270 (2,50x) – Provisorium direkt\nGOZ 0065 (2,30x) – Optisch-elektronische Abformung (4x)\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 2160k (3,50x) – Einlagefüllung zweiflächig Keramik\nGOZ 2170k (3,50x) – Einlagefüllung mehrflächig Keramik\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 4150 (2,30x) – Kontrolle/Nachbehandlung parodontal\n\nGesamtbetrag ca.: 1100.87 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "inlay pkv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Inlay PKV",
    "betrag": 1100.87
  },
  {
    "id": "goz-19",
    "categoryId": "goz-pa",
    "title": "[GOZ Privat] Parodontitis-Behandlung (komplett)",
    "content": "Leistungen:\nGOZ 1000 (2,30x) – Mundhygienestatus\nGOZ 4000 (2,30x) – Parodontalstatus\nGOZ 0030 (2,30x) – HKP\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 1040 (2,30x) – Professionelle Zahnreinigung\nGOZ Ä298 (2,30x) – Entnahme Abstrich (6x)\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 0090 (2,30x) – Infiltrationsanästhesie\nGOZ 4025 (2,30x) – Subgingivale medikamentöse Therapie\nGOZ 4090a (2,30x) – Photodynamische Therapie\nGOZ 4150 (2,30x) – Kontrolle/Nachbehandlung parodontal\nGOZ 3010a (2,30x) – Subgingivale Instrumentierung AIT\n\nGesamtbetrag ca.: 399.62 €",
    "tags": [
      "goz",
      "privat",
      "pa",
      "pa"
    ],
    "date": "2025-01-01",
    "kuerzel": "*PA",
    "betrag": 399.62
  },
  {
    "id": "goz-20",
    "categoryId": "goz-prophylaxe",
    "title": "[GOZ Privat] Professionelle Zahnreinigung",
    "content": "Diagnose: CHX-Spülung, Anfärbung, STI/BOP\n\nLeistungen:\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 1000 (2,30x) – Mundhygienestatus\nGOZ 1040 (2,30x) – Professionelle Zahnreinigung\nGOZ 1010 (2,30x) – Kontrolle Übungserfolg\nGOZ 2010 (2,30x) – Behandlung überempfindlicher Zahnflächen\n\nGesamtbetrag ca.: 62.48 €",
    "tags": [
      "goz",
      "privat",
      "prophylaxe",
      "pzr"
    ],
    "date": "2025-01-01",
    "kuerzel": "*PZR",
    "betrag": 62.48
  },
  {
    "id": "goz-21",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Kieferhöhlenrevision",
    "content": "Diagnose: Aufklärungsblatt unterschrieben, prä-OP\n\nLeistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä5370 (1,80x) – CT Kopfbereich\nGOZ Ä1479 (2,30x) – Ausspülung Kieferhöhle\nGOZ Ä1486 (2,30x) – Radikaloperation Kieferhöhle\nGOZ Ä2250 (2,30x) – Keilförmige Osteotomie\nGOZ Ä2254 (2,30x) – Implantation von Knochen\nGOZ Ä444 (1,00x) – Zuschlag ambulant\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\n\nGesamtbetrag ca.: 857.05 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "kh-revisi"
    ],
    "date": "2025-01-01",
    "kuerzel": "*KH-Revisi",
    "betrag": 857.05
  },
  {
    "id": "goz-22",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Koronaler Verschiebelappen",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 4050 (2,30x) – Entfernung Zahnbeläge\nGOZ 4070 (3,00x) – Parodontalchirurgische Therapie\nGOZ 4075 (3,00x) – Parodontalchirurgische Therapie\nGOZ Ä2382 (3,50x) – Schwierige Hautlappenplastik\nGOZ Ä443 (1,00x) – Zuschlag ambulant\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 1074.05 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "koronaler"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Koronaler",
    "betrag": 1074.05
  },
  {
    "id": "goz-23",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Krone PKV – komplett (Prä + Abf + Eingl)",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ Ä1 (3,50x) – Beratung\nGOZ Ä5 (3,20x) – Symptombezogene Untersuchung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 0090 (2,70x) – Infiltrationsanästhesie\nGOZ 2030 (3,40x) – Besondere Maßnahmen\nGOZ 2330 (3,30x) – Erhaltung vitale Pulpa\nGOZ 4070 (3,50x) – Parodontalchirurgische Therapie\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 2270 (3,50x) – Provisorium\nGOZ 0065 (2,30x) – Optisch-elektronische Abformung (4x)\nGOZ 8010 (3,00x) – Registrieren gelenkbezügliche Zentrik\nGOZ 2210 (3,50x) – Zirkonkrone\n\nGesamtbetrag ca.: 1038.19 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "kronepkv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*KronePKV",
    "betrag": 1038.19
  },
  {
    "id": "goz-24",
    "categoryId": "goz-kfo",
    "title": "[GOZ Privat] Retainer-Eingliederung UK",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ 4050 (2,30x) – Entfernung Zahnbeläge\nGOZ 6100a (3,50x) – Kleberetainer einsetzen\nGOZ 2197 (3,50x) – Adhäsive Befestigung\n\nGesamtbetrag ca.: 115.53 €",
    "tags": [
      "goz",
      "privat",
      "kfo",
      "retainer"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Retainer",
    "betrag": 115.53
  },
  {
    "id": "goz-25",
    "categoryId": "goz-kfo",
    "title": "[GOZ Privat] Protrusionsschienen (Schnarchschiene)",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8065 (2,30x) – Registrieren UK-Bewegungen\nGOZ 7010a (2,30x) – Schnarchtherapiegerät (2x)\n\nGesamtbetrag ca.: 458.58 €",
    "tags": [
      "goz",
      "privat",
      "kfo",
      "schnarch"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Schnarch",
    "betrag": 458.58
  },
  {
    "id": "goz-26",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] Sinuslift extern mit lateraler Augmentation",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 9000 (3,00x) – Implantatbez. Analyse\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 9120 (3,50x) – Sinusbodenelevation extern\nGOZ 9140 (3,00x) – Intraorale Knochenentnahme\nGOZ 9150 (3,00x) – Fixation Augmentat\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (3,50x) – Nachbehandlung\n\nGesamtbetrag ca.: 1441.04 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "sinuse"
    ],
    "date": "2025-01-01",
    "kuerzel": "*SinusE",
    "betrag": 1441.04
  },
  {
    "id": "goz-27",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Socket Preservation",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,00x) – Infiltrationsanästhesie\nGOZ 3030 (3,50x) – Entfernung Zahn/Implantat\nGOZ 9090 (2,30x) – Auffüllen Alveole\nGOZ Ä2442 (3,50x) – Implantation alloplastisches Material\nGOZ 3100 (3,50x) – Plastische Deckung\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 545.65 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "socket"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Socket",
    "betrag": 545.65
  },
  {
    "id": "goz-28",
    "categoryId": "goz-ze",
    "title": "[GOZ Privat] Veneers",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ Ä1 (3,50x) – Beratung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 0090 (2,90x) – Infiltrationsanästhesie\nGOZ 4050 (2,30x) – Entfernung Zahnbeläge\nGOZ 2270 (2,50x) – Provisorium\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung (4x)\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 2030 (3,30x) – Besondere Maßnahmen\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 2220v (3,50x) – Veneer\n\nGesamtbetrag ca.: 894.93 €",
    "tags": [
      "goz",
      "privat",
      "ze",
      "veneers"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Veneers",
    "betrag": 894.93
  },
  {
    "id": "goz-29",
    "categoryId": "goz-implanto",
    "title": "[GOZ Privat] DVT (Digitale Volumentomographie)",
    "content": "Leistungen:\nGOZ Ä5370 (1,00x) – CT Kopfbereich\nGOZ Ä5377 (1,00x) – Zuschlag computergesteuerte Analyse\n\nGesamtbetrag ca.: 209.83 €",
    "tags": [
      "goz",
      "privat",
      "implantologie",
      "dvt"
    ],
    "date": "2025-01-01",
    "kuerzel": "DVT",
    "betrag": 209.83
  },
  {
    "id": "goz-30",
    "categoryId": "goz-endo",
    "title": "[GOZ Privat] Wurzelbehandlung mit Aufbereitung, Med + Abfüllen",
    "content": "Leistungen:\nGOZ Ä1 (2,30x) – Beratung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 0090 (2,30x) – Infiltrationsanästhesie\nGOZ 2040 (2,30x) – Anlegen Spanngummi\nGOZ 2390 (2,30x) – Trepanation\nGOZ 2410 (3,50x) – Aufbereitung Wurzelkanal\nGOZ 2400 (3,50x) – Elektrometrische Längenbestimmung\nGOZ 2430 (2,30x) – Medikamentöse Einlage\nGOZ 2020 (2,30x) – Temporärer Verschluss\nGOZ 0110 (1,00x) – Zuschlag OP-Mikroskop\nGOZ 2440 (3,50x) – Füllung Wurzelkanal\nGOZ 4020 (2,30x) – Keimreduzierung\n\nGesamtbetrag ca.: 835.45 €",
    "tags": [
      "goz",
      "privat",
      "endo",
      "endo wb/wf"
    ],
    "date": "2025-01-01",
    "kuerzel": "Endo WB/WF",
    "betrag": 835.45
  },
  {
    "id": "goz-31",
    "categoryId": "goz-kons",
    "title": "[GOZ Privat] Füllung einflächig (Kons)",
    "content": "Leistungen:\nGOZ Ä1 (2,30x) – Beratung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 2030 (2,30x) – Besondere Maßnahmen\nGOZ 2040 (2,30x) – Anlegen Spanngummi\nGOZ 2330 (2,30x) – Erhaltung vitale Pulpa\nGOZ 2060 (2,30x) – Präparieren Kavität, Restauration 1-flächig\n\nGesamtbetrag ca.: 240.70 €",
    "tags": [
      "goz",
      "privat",
      "kons",
      "f1"
    ],
    "date": "2025-01-01",
    "kuerzel": "F1",
    "betrag": 240.7
  },
  {
    "id": "goz-32",
    "categoryId": "goz-kons",
    "title": "[GOZ Privat] Füllung zweiflächig (Kons)",
    "content": "Leistungen:\nGOZ Ä1 (2,30x) – Beratung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 2030 (2,30x) – Besondere Maßnahmen\nGOZ 2330 (2,30x) – Erhaltung vitale Pulpa\nGOZ 2080 (2,30x) – Präparieren Kavität, Restauration 2-flächig\n\nGesamtbetrag ca.: 248.20 €",
    "tags": [
      "goz",
      "privat",
      "kons",
      "f2"
    ],
    "date": "2025-01-01",
    "kuerzel": "F2",
    "betrag": 248.2
  },
  {
    "id": "goz-33",
    "categoryId": "goz-kons",
    "title": "[GOZ Privat] Füllung dreiflächig (Kons)",
    "content": "Leistungen:\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 2030 (2,30x) – Besondere Maßnahmen\nGOZ 2330 (2,30x) – Erhaltung vitale Pulpa\nGOZ 2100 (2,30x) – Präparieren Kavität, Restauration 3-flächig\n\nGesamtbetrag ca.: 266.45 €",
    "tags": [
      "goz",
      "privat",
      "kons",
      "f3"
    ],
    "date": "2025-01-01",
    "kuerzel": "F3",
    "betrag": 266.45
  },
  {
    "id": "goz-34",
    "categoryId": "goz-kons",
    "title": "[GOZ Privat] Füllung vierflächig (Kons)",
    "content": "Leistungen:\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0070 (2,30x) – Vitalitätsprüfung\nGOZ 2030 (2,30x) – Besondere Maßnahmen\nGOZ 2330 (2,30x) – Erhaltung vitale Pulpa\nGOZ 2120 (2,30x) – Präparieren Kavität, Restauration 4-flächig\n\nGesamtbetrag ca.: 285.84 €",
    "tags": [
      "goz",
      "privat",
      "kons",
      "f4"
    ],
    "date": "2025-01-01",
    "kuerzel": "F4",
    "betrag": 285.84
  },
  {
    "id": "goz-35",
    "categoryId": "goz-prophylaxe",
    "title": "[GOZ Privat] Kinder-Prophylaxe",
    "content": "Diagnose: Individualprophylaxe Kinder + Jugendliche\n\nLeistungen:\nGOZ 0010 (2,30x) – Eingehende Untersuchung\nGOZ Ä1 (2,30x) – Beratung\nGOZ 1000 (2,30x) – Mundhygienestatus\nGOZ 1010 (2,30x) – Kontrolle Übungserfolg\nGOZ 4050 (2,30x) – Entfernung Zahnbeläge\nGOZ 1020 (2,30x) – Lokale Fluoridierung\n\nGesamtbetrag ca.: 90.02 €",
    "tags": [
      "goz",
      "privat",
      "prophylaxe",
      "kp"
    ],
    "date": "2025-01-01",
    "kuerzel": "KP",
    "betrag": 90.02
  },
  {
    "id": "goz-36",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Entfernung Zahn/Implantat",
    "content": "Leistungen:\nGOZ 0010 (2,30x) – Eingehende Untersuchung\nGOZ Ä1 (2,30x) – Beratung\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (2,30x) – Infiltrationsanästhesie\nGOZ 0100 (2,30x) – Leitungsanästhesie\nGOZ 3000 (2,30x) – Entfernung einwurzeliger Zahn\nGOZ 3010 (2,30x) – Entfernung mehrwurzeliger Zahn\nGOZ 3100 (2,30x) – Plastische Deckung\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (3,50x) – Nachbehandlung\n\nGesamtbetrag ca.: 336.85 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "ex"
    ],
    "date": "2025-01-01",
    "kuerzel": "Ex",
    "betrag": 336.85
  },
  {
    "id": "goz-37",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Osteotomie (retinierter Zahn)",
    "content": "Leistungen:\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090b (3,50x) – Infiltrationsanästhesie vestibulär\nGOZ 0090l (3,50x) – Infiltrationsanästhesie lingual\nGOZ 0100 (3,50x) – Leitungsanästhesie\nGOZ 3040 (2,30x) – Entfernung retinierter Zahn\nGOZ 3045 (2,30x) – Entfernung extrem verlagerter Zahn\nGOZ 0510 (1,00x) – Zuschlag nichtstationär\nGOZ 3100 (2,30x) – Plastische Deckung\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (3,50x) – Nachbehandlung\n\nGesamtbetrag ca.: 2769.36 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "ost"
    ],
    "date": "2025-01-01",
    "kuerzel": "Ost",
    "betrag": 2769.36
  },
  {
    "id": "goz-38",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Wurzelspitzenresektion Frontzahn",
    "content": "Leistungen:\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,50x) – Infiltrationsanästhesie\nGOZ 0110 (1,00x) – Zuschlag OP-Mikroskop\nGOZ 2390 (2,30x) – Trepanation\nGOZ 2410 (3,50x) – Aufbereitung Wurzelkanal\nGOZ 2440 (3,50x) – Füllung Wurzelkanal\nGOZ 3110 (2,30x) – Resektion Wurzelspitze Frontzahn\nGOZ 3190 (2,30x) – Zystektomie\nGOZ 0500 (1,00x) – Zuschlag nichtstationär\n\nGesamtbetrag ca.: 396.58 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "wsr_fz"
    ],
    "date": "2025-01-01",
    "kuerzel": "WSR_FZ",
    "betrag": 396.58
  },
  {
    "id": "goz-39",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] Wurzelspitzenresektion Seitenzahn",
    "content": "Leistungen:\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 0090 (3,50x) – Infiltrationsanästhesie\nGOZ 0110 (1,00x) – Zuschlag OP-Mikroskop\nGOZ 2390 (2,30x) – Trepanation\nGOZ 2410 (3,50x) – Aufbereitung Wurzelkanal\nGOZ 2440 (3,50x) – Füllung Wurzelkanal\nGOZ 3120 (3,50x) – Resektion Wurzelspitze Seitenzahn\nGOZ 0500 (1,00x) – Zuschlag nichtstationär\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 466.77 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "wsr_sz"
    ],
    "date": "2025-01-01",
    "kuerzel": "WSR_SZ",
    "betrag": 466.77
  },
  {
    "id": "goz-40",
    "categoryId": "goz-chirurgie",
    "title": "[GOZ Privat] WSR Knochenaufbau",
    "content": "Leistungen:\nGOZ 0030 (2,30x) – HKP\nGOZ 4020 (2,30x) – Keimreduzierung\nGOZ 3110 (3,50x) – Resektion Wurzelspitze Frontzahn\nGOZ 3120 (3,50x) – Resektion Wurzelspitze Seitenzahn\nGOZ 3190 (3,20x) – Zystektomie\nGOZ 4110 (3,50x) – Auffüllen parodontaler Knochendefekte\nGOZ 9090 (3,00x) – Auffüllen Alveole\nGOZ Ä2442 (3,00x) – Implantation alloplastisches Material\nGOZ 3100 (3,00x) – Plastische Deckung\nGOZ 3290 (2,30x) – Kontrolle\nGOZ 3300 (2,30x) – Nachbehandlung\n\nGesamtbetrag ca.: 731.48 €",
    "tags": [
      "goz",
      "privat",
      "chirurgie",
      "wsr_knoch"
    ],
    "date": "2025-01-01",
    "kuerzel": "WSR_Knoch",
    "betrag": 731.48
  },
  {
    "id": "goz-41",
    "categoryId": "goz-kfo",
    "title": "[GOZ Privat] Zahnkorrektur-Schiene (Kfo)",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ 0010 (3,40x) – Eingehende Untersuchung\nGOZ Ä5004 (2,50x) – Panoramaschichtaufnahme\nGOZ 0065 (3,50x) – Optisch-elektronische Abformung (4x)\nGOZ 6010 (3,50x) – Computergestützte Auswertung\nGOZ 6040 (3,50x) – Maßnahmen Umformung Kiefer (2x)\nGOZ 6090 (3,50x) – Maßnahmen Okklusion (2x)\n\nGesamtbetrag ca.: 1523.35 €",
    "tags": [
      "goz",
      "privat",
      "kfo",
      "zahnkorrek"
    ],
    "date": "2025-01-01",
    "kuerzel": "Zahnkorrek",
    "betrag": 1523.35
  },
  {
    "id": "bema-1001",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Kasssenbrücke – Privatleistungen",
    "content": "Diagnose: Privatleistungen bei einer Kassenbrücke\n\nLeistungen:\nGOZ 0050 (2,30x) – Abformung oder Teilabformung eines Kiefers\nGOZ 5170 (2,50x) – Anatomische Abformung des Kiefers\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (3,00x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen an Modellen\nGOZ 8100 (2,30x) – Systematische subtraktive Maßnahmen\nGOZ 4050 (2,30x) – Entfernung harter und weicher Zahnbeläge\nGOZ 4070 (2,30x) – Parodontalchirurgische Therapie\nGOZ 4055 (2,30x) – Entfernung Zahnbeläge supragingival\nGOZ 4075 (2,30x) – Parodontalchirurgische Therapie\nGOZ 4150 (2,30x) – Kontrolle/Nachbehandlung parodontal\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 5010 / 5070 (3,50x) – Metallkeramik- oder Zirkonkrone / -brückenglied",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "brückegkvpriv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*BrückeGKVpriv"
  },
  {
    "id": "bema-1002",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Kassenbrücke – HKP-Leistungen",
    "content": "Diagnose: HKP Leistungen Brücke\n\nLeistungen:\nBEMA 19 – Provisorische Krone / Brückenglied\nGOZ 2210 / 2195 (3,50x) – Metallkeramik- oder Zirkonkrone, Aufbau\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ 5010 bam (3,50x) – Metallkeramikankerkrone\nGOZ 5070 bm (3,50x) – Metallkeramikbrückenglied\nGOZ 5010z (3,50x) – Zirkonankerkrone\nGOZ 5070vk (3,50x) – Zirkonbrückenglied",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "brückegkv hkp"
    ],
    "date": "2025-01-01",
    "kuerzel": "*BrückeGKV HKP"
  },
  {
    "id": "bema-1003",
    "categoryId": "bema-kons",
    "title": "[BEMA GKV] Composite-Füllung (Kasse mit Zuzahlung)",
    "content": "Diagnose: Versorgung eines Zahnes mit plastischem Füllmaterial\n\nLeistungen:\nGOZ 2030 (3,30x) – Besondere Maßnahmen beim Präparieren\nGOZ 2060 (0,50x) – Präparieren Kavität, Restauration 1-flächig (Zuzahlung)\nFiktiv 13ak – Einflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2080 (0,50x) – Präparieren Kavität, Restauration 2-flächig (Zuzahlung)\nFiktiv 13bk – Zweiflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2100 (0,50x) – Präparieren Kavität, Restauration 3-flächig (Zuzahlung)\nFiktiv 13ck – Dreiflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2120 (0,50x) – Präparieren Kavität, Restauration 4-flächig (Zuzahlung)\nFiktiv 13dk – Mehrflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2010 (2,80x) – Behandlung überempfindlicher Zahnflächen",
    "tags": [
      "bema",
      "gkv",
      "kons",
      "composite"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Composite"
  },
  {
    "id": "bema-1004",
    "categoryId": "bema-endo",
    "title": "[BEMA GKV] Endo mit Zuzahlung (Kasse)",
    "content": "Diagnose: Trepanation – Pat. mit OriHex 0,1% spülen\n\nLeistungen:\nBEMA Ä925a – Röntgendiagnostik der Zähne bis 2 Aufnahmen\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 12 – Besondere Maßnahmen beim Präparieren oder Füllen\nBEMA 28 – Exstirpation der vitalen Pulpa, je Kanal\nBEMA 31 – Trepanation eines pulpatoten Zahnes\nBEMA 32 – Aufbereiten des Wurzelkanalsystems, je Kanal\nGOZ 2040 (2,30x) – Anlegen von Spanngummi\nGOZ 5020a (2,30x) – Präendodontischer Aufbau analog\nGOZ 2400 (2,30x) – Elektrometrische Längenbestimmung\nGOZ 2420 (2,30x) – Elektrophysikalische Anwendung\nGOZ 2020 (2,30x) – Temporärer speicheldichter Verschluss\nBEMA 34 – Medikamentöse Einlage\nBEMA 35 – Wurzelkanalfüllung\nGOZ 2120a (2,30x) – Mehrschichtiger Aufbau verloren gegangener Zahnsubstanz\nGOZ 2270 (2,30x) – Provisorium im direkten Verfahren",
    "tags": [
      "bema",
      "gkv",
      "endo",
      "endo_zuza"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Endo_Zuza"
  },
  {
    "id": "bema-1005",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Impl. Brücke GKV – Privatleistungen",
    "content": "Diagnose: Privatleistungen bei implantatgetragener Brücke\n\nLeistungen:\nGOZ 0050 (2,30x) – Abformung oder Teilabformung Kiefer\nGOZ 5170 (2,50x) – Anatomische Abformung\nGOZ 9050 (3,00x) – Entfernen/Wiedereinsetzen Implantataufbau\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (3,00x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle\nGOZ 8100 (2,30x) – Systematische subtraktive Maßnahmen\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ Ä5000 (2,50x) – Zähne, je Projektion",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "implbrgkvpriv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplBrGKVpriv"
  },
  {
    "id": "bema-1006",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Impl. Krone GKV – Privatleistungen",
    "content": "Diagnose: Privatleistungen bei implantatgetragener Krone\n\nLeistungen:\nGOZ 0050 (2,30x) – Abformung oder Teilabformung Kiefer\nGOZ 5170 (2,50x) – Anatomische Abformung\nGOZ 9050 (3,00x) – Entfernen/Wiedereinsetzen Implantataufbau\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (3,00x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle\nGOZ 8100 (2,30x) – Systematische subtraktive Maßnahmen\nGOZ 2197 (3,50x) – Adhäsive Befestigung\nGOZ Ä5000 (2,50x) – Zähne, je Projektion",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "implkrgkvpriv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplKrGKVpriv"
  },
  {
    "id": "bema-1007",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Impla-Tele einarbeiten",
    "content": "Leistungen:\nGOZ 5170 (2,30x) – Anatomische Abformung (2x)\nGOZ 9050 (3,50x) – Entfernen/Wiedereinsetzen Implantataufbau\nGOZ 8010 (2,30x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle\nGOZ 5040a (3,50x) – Individualisierte Teleskopkrone auf Implantat\nGOZ 5260 (2,30x) – Maßnahmen zur Wiederherstellung der Funktion",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "impla-tele"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Impla-Tele"
  },
  {
    "id": "bema-1008",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Impl. Brücke GKV – HKP-Leistungen",
    "content": "Diagnose: HKP Leistungen implantatgetragene Brücke\n\nLeistungen:\nGOZ 2200i (3,50x) – Implantatkrone\nGOZ 5000i (3,50x) – Implantatankerkrone\nGOZ 5070 bm (3,50x) – Metallkeramikbrückenglied",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "implbrgkv hkp"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplBrGKV HKP"
  },
  {
    "id": "bema-1009",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Impl. Krone GKV – HKP-Leistungen",
    "content": "Diagnose: HKP Leistungen implantatgetragene Krone\n\nLeistungen:\nGOZ 5170 (2,30x) – Anatomische Abformung (2x)\nGOZ 9050 (3,50x) – Entfernen/Wiedereinsetzen Implantataufbau (3x)\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle\nGOZ 2200i (3,50x) – Implantatkrone\nGOZ 2197 (3,50x) – Adhäsive Befestigung",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "implkrgkv hkp"
    ],
    "date": "2025-01-01",
    "kuerzel": "*ImplKrGKV HKP"
  },
  {
    "id": "bema-1010",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Inlay GKV – Präparation & Abformung",
    "content": "Leistungen:\nGOZ 0040 (2,30x) – HKP\nGOZ 0080 (2,30x) – Oberflächenanästhesie\nGOZ 0090 (2,30x) – Infiltrationsanästhesie\nGOZ 0100 (2,30x) – Leitungsanästhesie\nGOZ 4050 (2,30x) – Entfernung Zahnbeläge\nGOZ 4055 (2,30x) – Entfernung supragingival\nGOZ 2030 (2,30x) – Besondere Maßnahmen Präparieren (2x)\nGOZ 5170 (3,50x) – Anatomische Abformung (2x)\nGOZ 2270 (3,50x) – Provisorium im direkten Verfahren\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "inlay_gkv i"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Inlay_GKV I"
  },
  {
    "id": "bema-1011",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Inlay GKV – Eingliederung",
    "content": "Leistungen:\nGOZ 4060 (2,30x) – Kontrolle Entfernung Zahnbeläge\nGOZ 2160k (3,50x) – Einlagefüllung zweiflächig, Keramik\nFiktiv 13bi – Zweiflächige Füllung, fiktiv (./. Inlay)\nGOZ 2170k (3,50x) – Einlagefüllung mehr als zweiflächig, Keramik\nFiktiv 13ci – Dreiflächige Füllung, fiktiv (./. Inlay)\nGOZ 2197 (3,50x) – Adhäsive Befestigung",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "inlay_gkv ii"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Inlay_GKV II"
  },
  {
    "id": "bema-1012",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Interimsprothese Click & Smile (GKV)",
    "content": "Diagnose: HKP Leistungen für eine Interimsprothese Click & Smile\n\nLeistungen:\nGOZ 5170i (3,50x) – Anatomische Abformung des Kiefers mit individueller Löffelherstellung\nGOZ 5210a (3,50x) – Metallfreie flexible Teilprothesen ohne Klammern\nGOZ 5070 bm (2,30x) – Metallkeramikbrückenglied\nGOZ 8010 (2,30x) – Registrieren gelenkbezügliche Zentrik\nGOZ 4040 (2,30x) – Beseitigung grober Vorkontakte der Okklusion",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "interims_cs"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Interims_CS"
  },
  {
    "id": "bema-1013",
    "categoryId": "bema-chirurgie",
    "title": "[BEMA GKV] Kieferhöhlen-Revision (BEMA)",
    "content": "Diagnose: Aufklärungsblatt unterschrieben, prä-OP mit CHX\n\nLeistungen:\nBEMA Ä1485 – Operative Eröffnung und Ausräumung der Stirnhöhle\nBEMA Ä2250 – Keilförmige oder lineare Osteotomie\nBEMA Ä1479 – Ausspülung der Kiefer-, Keilbein-, Stirnhöhle\nBEMA Ä2381 – Einfache Hautlappenplastik",
    "tags": [
      "bema",
      "gkv",
      "chirurgie",
      "kh_revisio"
    ],
    "date": "2025-01-01",
    "kuerzel": "*KH_Revisio"
  },
  {
    "id": "bema-1014",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Kassenkrone – Privatleistungen",
    "content": "Diagnose: Privatleistungen bei einer Kassenkrone\n\nLeistungen:\nGOZ 5170 (3,50x) – Anatomische Abformung\nGOZ 4070 (2,30x) – Parodontalchirurgische Therapie\nGOZ 4075 (2,30x) – Parodontalchirurgische Therapie\nGOZ 4150 (2,30x) – Kontrolle/Nachbehandlung parodontal\nGOZ 8010 (3,50x) – Registrieren gelenkbezügliche Zentrik (2x)\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "kronegkvpriv"
    ],
    "date": "2025-01-01",
    "kuerzel": "*KroneGKVpriv"
  },
  {
    "id": "bema-1015",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Locator in Prothese einarbeiten",
    "content": "Diagnose: HKP Leistungen Locator in Prothese einarbeiten\n\nLeistungen:\nGOZ 0060 (2,30x) – Abformung beider Kiefer für Situationsmodelle\nGOZ 9050 (3,00x) – Entfernen/Wiedereinsetzen Implantataufbau (3x)\nGOZ 5170 (2,50x) – Anatomische Abformung\nGOZ 8010 (2,30x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung (2x)\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle (2x)\nGOZ 4040 (2,30x) – Beseitigung grober Vorkontakte\nGOZ 5250 (2,30x) – Maßnahmen zur Wiederherstellung der Funktion\nGOZ 5260 (2,30x) – Maßnahmen zur Wiederherstellung der Funktion (Material)",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "locator_i"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Locator_i"
  },
  {
    "id": "bema-1016",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Locatorprothese",
    "content": "Diagnose: HKP Leistungen Locatorprothese\n\nLeistungen:\nGOZ 5170 (2,30x) – Anatomische Abformung (2x)\nGOZ 9050 (3,00x) – Entfernen/Wiedereinsetzen Implantataufbau (3x)\nGOZ 8010 (2,30x) – Registrieren gelenkbezügliche Zentrik\nGOZ 8020 (2,30x) – Arbiträre Scharnierachsenbestimmung (2x)\nGOZ 8080 (2,30x) – Diagnostische Maßnahmen Modelle (2x)\nGOZ 5180 (2,30x) – Funktionelle Abformung Oberkiefer\nGOZ 5190 (2,30x) – Funktionelle Abformung Unterkiefer\nGOZ 4040 (2,30x) – Beseitigung grober Vorkontakte\nGOZ 5220 (3,50x) – Versorgung zahnloser Kiefer – Oberkiefer\nGOZ 5230 (3,50x) – Versorgung zahnloser Kiefer – Unterkiefer\nGOZ 5030 (2,30x) – Versorgung Lückengebiss\nGOZ 5080 (2,30x) – Versorgung Lückengebiss mit Innenkonusprothese",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "locatorpr"
    ],
    "date": "2025-01-01",
    "kuerzel": "*Locatorpr"
  },
  {
    "id": "bema-1017",
    "categoryId": "bema-untersuchungen",
    "title": "[BEMA GKV] Besuch Altenheim – Erstbesuch",
    "content": "Diagnose: Besuch im Altenheim\n\nLeistungen:\nBEMA 7820 – Wegegeld mehr als 2 bis zu 5 Kilometern\nBEMA 154 – Besuch eines pflegebedürftigen Versicherten in einer Einrichtung\nBEMA 172a – Zuschlag für das Aufsuchen eines pflegebedürftigen Versicherten\nBEMA 172c – Beurteilung d. zahnärztl. Behandlungsbedarfs\nBEMA 172d – Unterstützung u. ggf. prakt. Anleitung der Pflegeperson",
    "tags": [
      "bema",
      "gkv",
      "untersuchungen",
      "01-alt_i"
    ],
    "date": "2025-01-01",
    "kuerzel": "01-Alt_I"
  },
  {
    "id": "bema-1018",
    "categoryId": "bema-untersuchungen",
    "title": "[BEMA GKV] Besuch Altenheim – Folgebesuche",
    "content": "Diagnose: Besuch im Altenheim (weiterer Pat.)\n\nLeistungen:\nBEMA 7820 – Wegegeld mehr als 2 bis zu 5 Kilometern\nBEMA 155 – Besuch je weiterem pflegebed. Vers. in ders. Einrichtung\nBEMA 172b – Zuschlag für das Aufsuchen je weiterem pflegebedürftigen Versicherten\nBEMA 172c – Beurteilung d. zahnärztl. Behandlungsbedarfs\nBEMA 172d – Unterstützung u. ggf. prakt. Anleitung der Pflegeperson",
    "tags": [
      "bema",
      "gkv",
      "untersuchungen",
      "01-alt_ii"
    ],
    "date": "2025-01-01",
    "kuerzel": "01-Alt_II"
  },
  {
    "id": "bema-1019",
    "categoryId": "bema-untersuchungen",
    "title": "[BEMA GKV] Kontrolluntersuchung",
    "content": "Diagnose: Eingehende Untersuchung mit Diagnostik – Erwachsene und Kinder\n\nLeistungen:\nBEMA 01 – Eingehende Untersuchung\nBEMA Ä1 – Beratung, auch fernmündlich\nBEMA 8 – Sensibilitätsprüfung der Zähne\nBEMA 04 – Erhebung des PSI Code\nBEMA 107 – Entfernen harter Zahnbeläge\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA Ä925b – Röntgendiagnostik bis 5 Aufnahmen\nBEMA Ä935d – Orthopantomogramm / Panoramaaufnahme\nBEMA FU – Zahnärztliche Früherkennungsuntersuchung Kind\nBEMA 106 – Beseitigen scharfer Zahnkanten\nBEMA 105 – Lokale medikamentöse Behandlung Schleimhauterkrankungen\nBEMA 10 – Behandlung überempfindlicher Zahnflächen",
    "tags": [
      "bema",
      "gkv",
      "untersuchungen",
      "01_kontrolle"
    ],
    "date": "2025-01-01",
    "kuerzel": "01_Kontrolle"
  },
  {
    "id": "bema-1020",
    "categoryId": "bema-kons",
    "title": "[BEMA GKV] Aufbaufüllung Composit (Kasse)",
    "content": "Diagnose: Dentinadhäsive Aufbaufüllung in Mehrschichttechnik\n\nLeistungen:\nGOZ 2160a (2,30x) – Dentinadhäsive Aufbaufüllung in Mehrschichttechnik\nFiktiv 13bz – Aufbaufüllung eines zerstörten Zahnes, fiktiv",
    "tags": [
      "bema",
      "gkv",
      "kons",
      "aufbaufüll"
    ],
    "date": "2025-01-01",
    "kuerzel": "Aufbaufüll"
  },
  {
    "id": "bema-1021",
    "categoryId": "bema-chirurgie",
    "title": "[BEMA GKV] Chirurgie (Extraktion, Plastik, Alv. usw.)",
    "content": "Leistungen:\nBEMA Ä1 – Beratung\nBEMA Ä935d – Orthopantomogramm\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 43 – Extraktion einwurzeligen Zahnes\nBEMA 44 – Extraktion mehrwurzeligen Zahnes\nBEMA 45 – Entfernen tieffrakturierten Zahnes\nBEMA 47b – Hemisektion und Teilextraktion\nBEMA 51a – Plastischer Verschluss Kieferhöhle\nBEMA 56a – Zystektomie\nBEMA 56b – Orale Zystostomie\nBEMA 57 – Beseitigen störender Schleimhautbänder\nBEMA 58 – Knochenresektion am Alveolarfortsatz\nBEMA 59 – Mundboden- oder Vestibulumplastik\nBEMA 62 – Alveolotomie (4 und mehr Zähne)",
    "tags": [
      "bema",
      "gkv",
      "chirurgie",
      "chirurgie"
    ],
    "date": "2025-01-01",
    "kuerzel": "Chirurgie"
  },
  {
    "id": "bema-1022",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] ZE-Begleitleistungen Eingliederung",
    "content": "Diagnose: ZE Begleitleistungen\n\nLeistungen:\nBEMA Ä1 – Beratung\nBEMA 8 – Sensibilitätsprüfung der Zähne\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 12 – Besondere Maßnahmen beim Präparieren oder Füllen\nBEMA 106 – Beseitigen scharfer Zahnkanten",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "eingl ze"
    ],
    "date": "2025-01-01",
    "kuerzel": "Eingl ZE"
  },
  {
    "id": "bema-1023",
    "categoryId": "bema-schienen",
    "title": "[BEMA GKV] Eingliederung Schiene (Abformungen, Antrag)",
    "content": "Diagnose: Eingliederung Schiene\n\nLeistungen:\nBEMA 2 – Schriftliche Niederlegung eines HKP Kieferbruch\nBEMA 7a – Abformung, Bissnahme in habitueller Okklusion\nBEMA 7bkbr – Abformung, Bissnahme für OK/UK-Modelle\nBEMA K1a – Aufbissbehelf mit adjustierter Oberfläche\nBEMA K2 – Aufbissbehelf ohne adjustierte Oberfläche",
    "tags": [
      "bema",
      "gkv",
      "schienen",
      "eingl schiene"
    ],
    "date": "2025-01-01",
    "kuerzel": "Eingl Schiene"
  },
  {
    "id": "bema-1024",
    "categoryId": "bema-kons",
    "title": "[BEMA GKV] Füllung Kassenpatienten",
    "content": "Diagnose: Versorgung eines Zahnes mit plastischem Füllmaterial\n\nLeistungen:\nBEMA 8 – Sensibilitätsprüfung\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 12 – Besondere Maßnahmen beim Präparieren oder Füllen\nBEMA 12coff – Anlegen von Spanngummi, besondere Maßnahmen\nBEMA 25 – Indirekte Überkappung\nBEMA 26 – Direkte Überkappung zur Erhaltung der Pulpa\nBEMA 13ak – Füllung einflächig Kunststoff\nBEMA 13ag – Füllung einflächig Glasionomerzement\nBEMA 13bk – Füllung zweiflächig Kunststoff\nBEMA 13bg – Füllung zweiflächig Glasionomerzement\nBEMA 13ck – Füllung dreiflächig Kunststoff\nBEMA 13cg – Füllung dreiflächig Glasionomerzement\nBEMA 13dk – Füllung mehrflächig Kunststoff\nBEMA 10 – Behandlung überempfindlicher Zahnflächen",
    "tags": [
      "bema",
      "gkv",
      "kons",
      "füllung kasse"
    ],
    "date": "2025-01-01",
    "kuerzel": "Füllung Kasse"
  },
  {
    "id": "bema-1025",
    "categoryId": "bema-kons",
    "title": "[BEMA GKV] Kompositfüllung mit Zuzahlung",
    "content": "Diagnose: Versorgung eines Zahnes mit plastischem Füllmaterial\n\nLeistungen:\nBEMA 8 – Sensibilitätsprüfung\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 12 – Besondere Maßnahmen beim Präparieren oder Füllen\nBEMA 25 – Indirekte Überkappung\nGOZ 2060 (3,00x) – Präparieren Kavität, Restauration 1-flächig (Zuzahlung)\nFiktiv 13ak – Einflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2080 (4,00x) – Präparieren Kavität, Restauration 2-flächig (Zuzahlung)\nFiktiv 13bk – Zweiflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2100 (4,50x) – Präparieren Kavität, Restauration 3-flächig (Zuzahlung)\nFiktiv 13ck – Dreiflächige Füllung, fiktiv (./. Kunststoff)\nGOZ 2120 (4,80x) – Präparieren Kavität, Restauration 4-flächig (Zuzahlung)\nFiktiv 13dk – Mehrflächige Füllung, fiktiv (./. Kunststoff)",
    "tags": [
      "bema",
      "gkv",
      "kons",
      "füllung komposit"
    ],
    "date": "2025-01-01",
    "kuerzel": "Füllung Komposit"
  },
  {
    "id": "bema-1026",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Inlays einsetzen (Keramik/Gold)",
    "content": "Diagnose: Keramik- und Goldinlays ein-, zwei-, dreiflächig\n\nLeistungen:\nBEMA Ä1 – Beratung\nBEMA 8 – Sensibilitätsprüfung\nBEMA 41a – Leitungsanästhesie\nBEMA 40 – Infiltrationsanästhesie\nBEMA 12 – Besondere Maßnahmen\nGOZ 2197 (0,00x) – Adhäsive Befestigung\nGOZ 2150k / 2150g (2,30x) – Einlagefüllung einflächig Keramik / Gold\nFiktiv 13ai – Füllung einflächig, fiktiv (./. Inlay)\nGOZ 2160k / 2160g (2,30x) – Einlagefüllung zweiflächig Keramik / Gold\nFiktiv 13bi – Zweiflächige Füllung, fiktiv (./. Inlay)\nGOZ 2170k / 2170g (2,30x) – Einlagefüllung mehr als zweiflächig\nFiktiv 13ci – Dreiflächige Füllung, fiktiv (./. Inlay)",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "inlays"
    ],
    "date": "2025-01-01",
    "kuerzel": "Inlays"
  },
  {
    "id": "bema-1027",
    "categoryId": "bema-prophylaxe",
    "title": "[BEMA GKV] Individualprophylaxe",
    "content": "Diagnose: Untersuchung, Mundhygienestatus, Überprüfung des Übungserfolges, Fluoridierung\n\nLeistungen:\nBEMA 01 – Eingehende Untersuchung\nBEMA 12 – Besondere Maßnahmen\nBEMA IP1 – Mundhygienestatus\nBEMA IP2 – Mundgesundheitsaufklärung\nBEMA IP4 – Lokale Fluoridierung der Zähne\nBEMA IP5 – Versiegelung kariesfreier Fissuren\nBEMA IP5e – Erweiterte Fissurenversiegelung\nBEMA 105 – Lokale medikamentöse Behandlung Schleimhauterkrankungen\nBEMA 106 – Beseitigen scharfer Zahnkanten\nBEMA 107 – Entfernen harter Zahnbeläge",
    "tags": [
      "bema",
      "gkv",
      "prophylaxe",
      "ip"
    ],
    "date": "2025-01-01",
    "kuerzel": "IP"
  },
  {
    "id": "bema-1028",
    "categoryId": "bema-untersuchungen",
    "title": "[BEMA GKV] Konsil und Beratungen",
    "content": "Diagnose: Konsiliarische Erörterung\n\nLeistungen:\nBEMA Ä1 – Beratung\nBEMA 181 – Konsiliarische Erörterung mit Ärzten und Zahnärzten\nBEMA 7600 – Konsiliarische Erörterung zwischen zwei oder mehr liquidationsberechtigten Ärzten\nBEMA 7700 – Kurze Bescheinigung, AU\nBEMA 7750 – Ausführlicher Befundbericht",
    "tags": [
      "bema",
      "gkv",
      "untersuchungen",
      "konsilium"
    ],
    "date": "2025-01-01",
    "kuerzel": "Konsilium"
  },
  {
    "id": "bema-1029",
    "categoryId": "bema-schienen",
    "title": "[BEMA GKV] Kontrollbehandlung Schienentherapie",
    "content": "Diagnose: Kontrollbehandlung nach dem Einsetzen einer Schiene\n\nLeistungen:\nBEMA 2 – Schriftliche Niederlegung eines HKP Kieferbruch\nBEMA K6 – Wiederherstellung und/oder Unterfütterung Aufbissbehelf\nBEMA K7 – Kontrollbehandlung, ggf. mit einfachen Korrekturen\nBEMA K8 – Kontrollbehandlung mit Einschleifen des Aufbissbehelfs\nBEMA K9 – Kontrollbehandlung mit Aufbau einer neuen adjustierten Oberfläche\nBEMA K3 – Umarbeiten Prothese zum Aufbissbehelf mit adjustierter Oberfläche",
    "tags": [
      "bema",
      "gkv",
      "schienen",
      "ktr schiene"
    ],
    "date": "2025-01-01",
    "kuerzel": "Ktr Schiene"
  },
  {
    "id": "bema-1030",
    "categoryId": "bema-chirurgie",
    "title": "[BEMA GKV] Nachbehandlung / Nachblutung",
    "content": "Diagnose: Nachbehandlung nach chirurgischem Eingriff, Tamponieren, chir. Wundrevision\n\nLeistungen:\nBEMA 38 – Nachbehandlung nach chirurgischem Eingriff oder Tamponieren\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 46 – Chirurgische Wundrevision\nBEMA 36 – Stillung einer übermäßigen Blutung\nBEMA 37 – Stillung übermäßige Blutung durch Abbinden\nBEMA 106 – Beseitigen scharfer Zahnkanten\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA 7700 – Kurze Bescheinigung, AU",
    "tags": [
      "bema",
      "gkv",
      "chirurgie",
      "n"
    ],
    "date": "2025-01-01",
    "kuerzel": "N"
  },
  {
    "id": "bema-1031",
    "categoryId": "bema-notdienst",
    "title": "[BEMA GKV] Notdienst",
    "content": "Leistungen:\nBEMA Ä1 – Beratung\nBEMA 03 – Zuschlag für Leistungen außerhalb der Sprechstunde\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA 8 – Sensibilitätsprüfung\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 31 – Trepanation eines pulpatoten Zahnes\nBEMA 32 – Aufbereiten des Wurzelkanalsystems, je Kanal\nBEMA 34 – Medikamentöse Einlage\nBEMA 28 – Exstirpation der vitalen Pulpa\nBEMA 36 – Stillung einer übermäßigen Blutung\nBEMA 38 – Nachbehandlung nach chirurgischem Eingriff\nBEMA 46 – Chirurgische Wundrevision\nBEMA 25 – Indirekte Überkappung\nBEMA 11 – Exkavieren und provisorischer Verschluss\nBEMA 105 – Lokale medikamentöse Behandlung Schleimhaut\nBEMA 43 – Extraktion einwurzeligen Zahnes\nBEMA 44 – Extraktion mehrwurzeligen Zahnes\nBEMA Ä161 – Eröffnung eines oberflächlichen Abszesses\nBEMA 24a – Wiedereinsetzen einer Krone",
    "tags": [
      "bema",
      "gkv",
      "notdienst",
      "notdienst"
    ],
    "date": "2025-01-01",
    "kuerzel": "Notdienst"
  },
  {
    "id": "bema-1032",
    "categoryId": "bema-chirurgie",
    "title": "[BEMA GKV] Osteotomie (BEMA)",
    "content": "Diagnose: Entfernung eines Zahnes durch Osteotomie inkl. Wundversorgung\n\nLeistungen:\nBEMA Ä1 – Beratung\nBEMA Ä935d – Orthopantomogramm\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 47a – Entfernen eines Zahnes durch Osteotomie\nBEMA 63 – Freilegen eines retinierten/verlagerten Zahnes\nBEMA 48 – Osteotomie eines verlagerten/retinierten Zahnes\nBEMA 56c – Zystektomie in Verbindung mit Wurzelspitzenresektion\nBEMA 51b – Plastischer Verschluss Kieferhöhle\nBEMA Ä2700 – Anlegen von Stütz-, Halte- oder Hilfsvorrichtungen",
    "tags": [
      "bema",
      "gkv",
      "chirurgie",
      "ost bema"
    ],
    "date": "2025-01-01",
    "kuerzel": "Ost BEMA"
  },
  {
    "id": "bema-1033",
    "categoryId": "bema-pa",
    "title": "[BEMA GKV] PA-Behandlung (komplett, BEMA)",
    "content": "Diagnose: Kürettage der Parodontien unter Lokalanästhesie, Nachbehandlung\n\nLeistungen:\nBEMA 4 – PA-Befund und Erstellen eines HKP PA\nBEMA 108 – Einschleifen des natürlichen Gebisses zum Kauebenenausgleich\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA P200 – PA, geschlossenes Vorgehen, einwurzliger Zahn\nBEMA P201 – PA, geschlossenes Vorgehen, mehrwurzliger Zahn\nBEMA P202 – PA, offenes Vorgehen, einwurzliger Zahn\nBEMA P203 – PA, offenes Vorgehen, mehrwurzliger Zahn\nBEMA 111 – Nachbehandlung im Rahmen der systematischen Behandlung",
    "tags": [
      "bema",
      "gkv",
      "pa",
      "pa komplett"
    ],
    "date": "2025-01-01",
    "kuerzel": "PA komplett"
  },
  {
    "id": "bema-1034",
    "categoryId": "bema-ze",
    "title": "[BEMA GKV] Präparation – Begleitleistungen (BEMA)",
    "content": "Diagnose: Präparation komplett mit allen Begleitleistungen\n\nLeistungen:\nBEMA 8 – Sensibilitätsprüfung\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 23 – Entfernen einer Krone o.ä., je Trennstelle\nBEMA 12 – Besondere Maßnahmen beim Präparieren oder Füllen\nBEMA 49 – Excision von Mundschleimhaut oder Granulationsgewebe\nBEMA 105 – Lokale medikamentöse Behandlung Schleimhauterkrankungen\nBEMA 106 – Beseitigen scharfer Zahnkanten",
    "tags": [
      "bema",
      "gkv",
      "ze",
      "präp bema"
    ],
    "date": "2025-01-01",
    "kuerzel": "Präp BEMA"
  },
  {
    "id": "bema-1035",
    "categoryId": "bema-notdienst",
    "title": "[BEMA GKV] Schmerzbehandlung",
    "content": "Diagnose: Allgemeine Schmerzbeseitigung\n\nLeistungen:\nBEMA Ä1 – Beratung\nBEMA 03 – Zuschlag außerhalb der Sprechstunde\nBEMA 8 – Sensibilitätsprüfung\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA 10 – Behandlung überempfindlicher Zahnflächen\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 25 – Indirekte Überkappung\nBEMA 11 – Exkavieren und provisorischer Verschluss\nBEMA 105 – Lokale medikamentöse Behandlung\nBEMA 31 – Trepanation pulpatoten Zahnes\nBEMA 28 – Exstirpation der vitalen Pulpa\nBEMA 32 – Aufbereiten des Wurzelkanalsystems\nBEMA 34 – Medikamentöse Einlage\nBEMA Ä161 – Eröffnung eines oberflächlichen Abszesses",
    "tags": [
      "bema",
      "gkv",
      "notdienst",
      "schmerzen"
    ],
    "date": "2025-01-01",
    "kuerzel": "Schmerzen"
  },
  {
    "id": "bema-1036",
    "categoryId": "bema-schienen",
    "title": "[BEMA GKV] Semipermanente Schiene (BEMA)",
    "content": "Diagnose: Semipermanente Schienung\n\nLeistungen:\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 12coff – Anlegen von Spanngummi\nBEMA 12exc – Beseitigen störenden Zahnfleisches\nBEMA 12pap – Stillung einer übermäßigen Papillenblutung\nBEMA 12sep – Separieren\nBEMA K4 – Semipermanente Schienung unter Anwendung der Ätztechnik",
    "tags": [
      "bema",
      "gkv",
      "schienen",
      "semi"
    ],
    "date": "2025-01-01",
    "kuerzel": "Semi"
  },
  {
    "id": "bema-1037",
    "categoryId": "bema-chirurgie",
    "title": "[BEMA GKV] Wurzelspitzenresektion (BEMA)",
    "content": "Diagnose: Resektion einer Wurzelspitze – Frontzahn / Seitenzahn\n\nLeistungen:\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA Ä935d – Orthopantomogramm\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 32 – Aufbereiten des Wurzelkanalsystems\nBEMA 35 – Wurzelkanalfüllung\nBEMA 54a – Wurzelspitzenresektion an einem Frontzahn\nBEMA 54b – Wurzelspitzenresektion an einem Seitenzahn\nBEMA 54c – Wurzelspitzenresektion am selben Seitenzahn (weitere Wurzel)\nBEMA 56c – Zystektomie in Verbindung mit Wurzelspitzenresektion\nBEMA 36 – Stillung einer übermäßigen Blutung\nBEMA 51b – Plastischer Verschluss Kieferhöhle",
    "tags": [
      "bema",
      "gkv",
      "chirurgie",
      "wsr bema"
    ],
    "date": "2025-01-01",
    "kuerzel": "WSR BEMA"
  },
  {
    "id": "bema-1038",
    "categoryId": "bema-endo",
    "title": "[BEMA GKV] Wurzelbehandlung komplett (BEMA)",
    "content": "Diagnose: Eröffnen, Aufbereiten, ggf. Med, bzw. Abfüllen der Wurzelkanäle\n\nLeistungen:\nBEMA Ä925a – Röntgendiagnostik bis 2 Aufnahmen\nBEMA 40 – Infiltrationsanästhesie\nBEMA 41a – Leitungsanästhesie, intraoral\nBEMA 12 – Besondere Maßnahmen beim Präparieren oder Füllen\nBEMA 28 – Exstirpation der vitalen Pulpa, je Kanal\nBEMA 29 – Devitalisieren einer Pulpa\nBEMA 31 – Trepanation eines pulpatoten Zahnes\nBEMA 32 – Aufbereiten des Wurzelkanalsystems, je Kanal\nGOZ 2400 (2,30x) – Elektrometrische Längenbestimmung (Zuzahlung)\nGOZ 2420 (2,30x) – Elektrophysikalische Anwendung (Zuzahlung)\nGOZ 2430 (2,30x) – Medikamentöse Einlage (Zuzahlung)\nGOZ 2020 (2,30x) – Temporärer speicheldichter Verschluss (Zuzahlung)\nBEMA 34 – Medikamentöse Einlage\nBEMA 35 – Wurzelkanalfüllung",
    "tags": [
      "bema",
      "gkv",
      "endo",
      "wurzelkanal"
    ],
    "date": "2025-01-01",
    "kuerzel": "Wurzelkanal"
  }
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

// ── RESET: Wissensdatenbank + Kategorien auf GOZ/BEMA-Standard zurücksetzen ──
app.post('/api/admin/reset-knowledge', requireAdmin, (req, res) => {
  try {
    initDefaultsForced();
    res.json({ ok: true, message: 'Wissensdatenbank und Kategorien erfolgreich zurückgesetzt!' });
  } catch(e) {
    res.status(500).json({ error: 'Reset fehlgeschlagen: ' + e.message });
  }
});

app.post('/api/chat', requireAuth, async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht gesetzt.' });
  }

  const { messages } = req.body;
  const knowledge = readData('knowledge.json', []);
  const categories = readData('categories.json', []);

  // Smart Search: nur relevante Einträge laden (max 8) statt alle 87
  // Suche basierend auf dem letzten Benutzer-Text
  const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const searchTerms = lastUserMsg.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = knowledge.map(k => {
    const haystack = (k.title + ' ' + k.content + ' ' + (k.tags||[]).join(' ')).toLowerCase();
    let score = 0;
    searchTerms.forEach(term => {
      if (haystack.includes(term)) score += haystack.split(term).length - 1;
    });
    return { ...k, score };
  }).filter(k => k.score > 0).sort((a,b) => b.score - a.score).slice(0, 8);

  // Fallback: wenn keine Treffer, nehme erste 5 allgemeine Einträge (keine GOZ/BEMA Komplexe)
  const relevant = scored.length > 0
    ? scored
    : knowledge.filter(k => !k.id.startsWith('goz-') && !k.id.startsWith('bema-')).slice(0, 5);

  const dbKnowledge = relevant.length > 0
    ? relevant.map(k => {
        const cat = categories.find(c => c.id === k.categoryId);
        return `[${cat?.label || k.categoryId}] ${k.title}:\n${k.content}`;
      }).join('\n\n')
    : '(keine passenden Einträge gefunden)';

  const systemPrompt = `Du bist Lisa – eine erfahrene Abrechnungsexpertin für Zahnarztpraxen in Deutschland mit 15 Jahren Praxiserfahrung. Du bist wie eine kluge, herzliche Kollegin die man anruft wenn man nicht weiterkommt – du gibst nicht einfach eine Antwort, du löst das Problem gemeinsam.

DEIN GESPRÄCHSSTIL – SO FUNKTIONIERST DU:

SCHRITT 1 – SITUATION ERFASSEN:
Wenn eine Frage nicht 100% eindeutig ist, fasse kurz zusammen was du verstanden hast, und stelle dann NUR die Fragen die du wirklich brauchst – maximal 2-3 auf einmal.
Beispiel: "Verstehe ich das richtig – du hast eine Patientin mit gebrochener Prothese? Dann kurz: GKV oder Privat? Und ist die Prothese jünger oder älter als 5 Jahre?"

SCHRITT 2 – KONKRET ANTWORTEN:
Wenn du alle Infos hast, antworte strukturiert:
✓ Die konkrete Lösung mit Nummern (BEMA/GOZ/Festzuschuss)
✓ Kurze Begründung (1-2 Sätze warum)
✓ Wichtige Fallstricke / was man NICHT vergessen darf
✓ Am Ende: "Noch Fragen dazu, oder passt das so?" oder einen weiterführenden Hinweis

SCHRITT 3 – EINEN SCHRITT WEITERDENKEN:
Denke immer proaktiv:
→ Was könnte die Kollegin noch vergessen haben?
→ Gibt es Abrechnungsausschlüsse die wichtig sind?
→ Gibt es etwas was man zusätzlich noch abrechnen könnte?
→ Gibt es einen Bonus der berücksichtigt werden sollte?

WELCHE GEGENFRAGEN – NACH SITUATION:
Immer zuerst klären (wenn nicht bekannt): "GKV oder Privatpatient?"
Bei Prothetik/ZE: Bonusheft? Teil- oder Vollprothese? OK/UK/beide? Wie viele Zähne fehlen? HKP schon genehmigt?
Bei Reparaturen: Jünger oder älter als 5 Jahre? (Gewährleistungsfrist!) Mit oder ohne Abformung? Mit Laborleistungen?
Bei Füllungen: Wie viele Flächen? MKV vorhanden?
Bei Laborrechnung: "Welche Positionen stehen drauf, oder beschreib kurz was gemacht wurde?"

SO KLINGT EINE GUTE ANTWORT:
❌ NICHT: "Gemäß BEMA-Leistungsverzeichnis ist die Leistung nach Nr. 100f abzurechnen, sofern die Voraussetzungen erfüllt sind..."
✅ SONDERN: "Dann ist das eindeutig! BEMA 100f – Vollunterfütterung UK mit Randgestaltung (81 Punkte). Dazu Festzuschuss 6.7. ⚠️ Wichtig: Die Prothese muss älter als 5 Jahre sein, sonst greift die Gewährleistung. Hat die Patientin einen Bonus? Bei 5 Jahren wären es 70% statt 60% – das lohnt sich! Noch Fragen?"

BEI LABORRECHNUNG:
1. Kurze Einschätzung was die Behandlung war
2. GKV oder Privat klären
3. Dann: Was kann abgerechnet werden (BEMA/GOZ + Festzuschuss), was NICHT, was könnte noch möglich sein

WICHTIG:
- Antworte IMMER auf Deutsch
- Nenne immer konkrete Nummern: BEMA, GOZ, Festzuschuss-Befundklasse
- Abrechnungsausschlüsse aktiv ansprechen wenn relevant
- Bei echter Unsicherheit: "Das würde ich sicherheitshalber mit der KZV klären – die sind für sowas da!"
- Du bist Lisa – kompetent, herzlich, lösungsorientiert, kein Roboter!


=== RELEVANTE EINTRÄGE AUS DER WISSENSDATENBANK ===
${dbKnowledge}

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
        model: 'claude-sonnet-4-6',
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

app.post('/api/kv', requireAuth, async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY nicht gesetzt.' });
  }

  const { messages } = req.body;

  const kvSystemPrompt = `Du bist Lisa – eine erfahrene Abrechnungsexpertin für Zahnarztpraxen in Deutschland mit 15 Jahren Praxiserfahrung. Du erstellst professionelle Kostenvoranschläge (KV) nach dem Standard der deutschen Zahnarztpraxis.

════════════════════════════════════════════════
DEINE ARBEITSWEISE – IMMER IN DIESER REIHENFOLGE:
════════════════════════════════════════════════

SCHRITT 1 – GEZIELTE RÜCKFRAGEN:
Stelle nur die Fragen die du wirklich brauchst – maximal 3-4 auf einmal.

Immer fragen: GKV oder Privatpatient? | Welcher Zahn/Region? | Material? | Bonus?
Bei Prothese zusätzlich: Teil- oder Totalprothese? OK/UK/beide? Wie viele Zähne fehlen?
Bei Krone/Brücke: Vitalität? Stiftaufbau nötig? Fremdlabor vorhanden?
Bei Implantat: Knochen ausreichend? Augmentation nötig?
Bei Aligner: Mit Diagnostik (OPG/Scan)? Mit Attachments?
Bei Unterfütterung: Prothese älter als 5 Jahre? Mit oder ohne Randgestaltung?

SCHRITT 2 – PROFESSIONELLEN KV ERSTELLEN:
Wenn du alle Infos hast, lieferst du einen vollständigen KV exakt nach den Lernbeispielen unten.
Am Ende IMMER den JSON-Block ausgeben damit der Word/PDF-Export funktioniert.

════════════════════════════════════════════════
KORREKTE GOZ-NUMMERN – REFERENZ:
════════════════════════════════════════════════

KRONEN: 2200=Vollkrone Tangential (NEM) | 2210=Vollkrone Hohlkehl/Stufe (KERAMIK/ZIRKON – Regelfall!) | 2220=Teilkrone/Veneer | 2250=NUR Kinderkrone konfektioniert (NIE für Erwachsene!) | 2260=Provisorium direkt | 2270=Provisorium mit Abformung 3,5-fach=53,15€
BRÜCKEN: 5000=Anker Tangential | 5010=Anker Hohlkehl | 5070=Brückenglied je Spanne
PROTHESEN: 5200=Teilprothese | 5210=Modellguss | 5220=Total OK | 5230=Total UK | 5280=Vollunterfütterung | 5290=Vollunterfütterung OK+Rand | 5300=Vollunterfütterung UK+Rand
IMPLANTATE: 9010=Insertion 2,3-fach=199,86€ | 9040=Freilegen | 9100=Augmentation
BEGLEITLEISTUNGEN: 0030=HKP 2,3-fach=25,87€ | 2030=Bes.Maßnahmen 2,3-fach=8,41€ (mehrfach!) | 2197=Adhäsiv 3,5-fach=25,59€ | 4055=Zahnstein mehrwurzelig=1,68€ | 4075=Scaling=16,82€ | 4080=Gingivektomie=5,82€ | 5170=Abformung ind.Löffel 3,5-fach=49,21€ | 6190=Beratung=18,11€
MATERIAL §4 Abs.3: Alginat 3,00€ | Impregum 13,80€ | Futar D fast 5,80€ | Optosil 4,30€

Antworte IMMER auf Deutsch. Keine GOZ-Nummern erfinden – nur die oben gelisteten verwenden!`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: kvSystemPrompt,
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

// ── KV EXPORT: Word (.docx) ──────────────────────────────────────────────────
app.post('/api/kv-export/docx', requireAuth, async (req, res) => {
  const { kvText, filename } = req.body;
  if (!kvText) return res.status(400).json({ error: 'Kein KV-Text übergeben' });
  try {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
    const lines = kvText.split('\n');
    const children = [];
    for (const line of lines) {
      const t = line.trim();
      if (t === 'KOSTENVORANSCHLAG') {
        children.push(new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
      } else if (t.match(/^━+$/) || t.match(/^─+$/)) {
        children.push(new Paragraph({ text: '─'.repeat(80), spacing: { after: 40 } }));
      } else if (t.match(/^\d+\.\s+[A-ZÄÖÜ]/) || t.match(/^PHASE \d/) || t.match(/^PATIENTENDATEN|^GESAMTÜBERSICHT|^HINWEISE|^PRIVATE VEREINBARUNG/)) {
        children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22, color: '0D9488' })], spacing: { before: 200, after: 80 } }));
      } else if (t.match(/(EIGENANTEIL|Festzuschuss gesamt|Labor gesamt|gesamt ca\.).*€/)) {
        children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 22 })], spacing: { after: 80 } }));
      } else if (t.startsWith('•') || t.startsWith('*')) {
        children.push(new Paragraph({ children: [new TextRun({ text: t, size: 18, color: '475569' })], spacing: { after: 60 }, indent: { left: 360 } }));
      } else if (t.startsWith('☐')) {
        children.push(new Paragraph({ children: [new TextRun({ text: t, size: 20 })], spacing: { after: 80 } }));
      } else if (t.includes('Unterschrift')) {
        children.push(new Paragraph({ children: [new TextRun({ text: t, size: 20 })], spacing: { before: 400, after: 80 } }));
      } else if (t) {
        children.push(new Paragraph({ children: [new TextRun({ text: t, size: 20, font: t.match(/^\d{4}|^[0-9]/) ? 'Courier New' : 'Calibri' })], spacing: { after: 60 } }));
      } else {
        children.push(new Paragraph({ text: '', spacing: { after: 60 } }));
      }
    }
    const doc = new Document({
      styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
      sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children }]
    });
    const buffer = await Packer.toBuffer(doc);
    const fname = (filename || 'Kostenvoranschlag').replace(/[^a-zA-Z0-9_\-äöüÄÖÜ]/g, '_') + '.docx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(buffer);
  } catch (e) {
    console.error('DOCX Export Fehler:', e.message);
    res.status(500).json({ error: 'Word-Export fehlgeschlagen: ' + e.message });
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

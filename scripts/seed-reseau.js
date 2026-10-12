#!/usr/bin/env node
/**
 * Données de démonstration du réseau : clubs partenaires, coachs, matériel,
 * mouvements, photos, inventaires, apprenants et alternances.
 *
 *   npm run seed:reseau            → (ré)installe la démo
 *   npm run seed:reseau -- --clean → retire uniquement les données de démo
 *
 * Toutes les fiches de démo ont un identifiant « demo-… » : les données réelles
 * ne sont jamais modifiées. Mot de passe de tous les coachs de démo : Coach2026!
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");

const DATA = path.join(__dirname, "..", "data");
const PHOTOS = path.join(DATA, "uploads", "photos");
const DEMO_PASSWORD = "Coach2026!";
const clean = process.argv.includes("--clean");

const read = (f) => (fs.existsSync(path.join(DATA, f)) ? JSON.parse(fs.readFileSync(path.join(DATA, f), "utf-8")) : []);
const write = (f, v) => fs.writeFileSync(path.join(DATA, f), JSON.stringify(v, null, 2));
const isDemo = (x) => typeof x.id === "string" && x.id.startsWith("demo-");

/* ---------- Nettoyage des données de démo existantes ---------- */
const FILES = ["clubs.json", "coaches.json", "equipment.json", "equipment-movements.json", "equipment-photos.json", "inventories.json", "placements.json", "alternance-logs.json", "learners.json"];
for (const f of FILES) {
  const list = read(f);
  if (f === "equipment-photos.json") for (const p of list.filter(isDemo)) fs.rmSync(path.join(PHOTOS, p.fileName), { force: true });
  write(f, list.filter((x) => !isDemo(x)));
}
if (clean) {
  console.log("Données de démonstration du réseau supprimées.");
  process.exit(0);
}

/* ---------- Utilitaires ---------- */
const DAY = 86_400_000;
const at = (daysAgo, h = 10) => {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};
const day = (daysAgo) => at(daysAgo).slice(0, 10);
let seq = 0;
const id = (p) => `demo-${p}-${(++seq).toString(36).padStart(3, "0")}`;
const hash = (pw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return { passwordHash: crypto.scryptSync(pw, salt, 64).toString("hex"), passwordSalt: salt };
};
const ADMIN = { role: "admin", id: "demo-admin", name: "Équipe MADES" };
const actor = (c) => ({ role: "coach", id: c.id, name: c.name });

/** Petite image PNG (dégradé + bandes) pour illustrer les photos de preuve. */
function png(w, h, [r1, g1, b1], [r2, g2, b2], stripes) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const t = (x + y) / (w + h);
      const band = stripes && Math.floor((x + y * 0.6) / 18) % 2 === 0 ? 0.82 : 1;
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = Math.round((r1 + (r2 - r1) * t) * band);
      raw[o + 1] = Math.round((g1 + (g2 - g1) * t) * band);
      raw[o + 2] = Math.round((b1 + (b2 - b1) * t) * band);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- Clubs ---------- */
const clubs = [
  { name: "Tennis Club de Cotonou", city: "Cotonou", address: "Haie Vive, rue 12.104", phone: "+229 01 97 00 11 22", email: "contact@tcc-demo.bj", contactName: "Armand Kpadé", disciplines: ["tennis", "padel", "mini-tennis"], alternanceCapacity: 4, status: "actif", conventionStart: day(300), conventionEnd: day(-430), notes: "Club pilote du réseau. Local matériel fermé à clé." },
  { name: "Beach Tennis Fidjrossè", city: "Cotonou", address: "Plage de Fidjrossè", phone: "+229 01 96 33 44 55", email: "btf@demo.bj", contactName: "Sandrine Ahouandjinou", disciplines: ["beach-tennis", "pickleball"], alternanceCapacity: 3, status: "actif", conventionStart: day(200), conventionEnd: day(-530) },
  { name: "ASPT Raquettes", city: "Porto-Novo", address: "Stade Charles de Gaulle", phone: "+229 01 95 66 77 88", email: "aspt@demo.bj", contactName: "Gérard Hounkpè", disciplines: ["tennis", "mini-tennis", "pickleball"], alternanceCapacity: 3, status: "actif", conventionStart: day(380), conventionEnd: day(-350) },
  { name: "Parakou Tennis Académie", city: "Parakou", address: "Quartier Albarika", phone: "+229 01 94 12 34 56", email: "pta@demo.bj", contactName: "Moussa Bio Gounou", disciplines: ["tennis", "mini-tennis"], alternanceCapacity: 2, status: "en_convention", notes: "Convention en signature. Dotation prévue au prochain trimestre." },
].map((c, i) => ({ id: id("club"), ...c, createdAt: at(400 - i * 20) }));
const [TCC, BTF, ASPT, PTA] = clubs;

/* ---------- Coachs ---------- */
const mkCoach = (club, name, email, phone, isEquipmentManager, isTutor, lastLogin) => ({
  id: id("coach"),
  name,
  email,
  phone,
  clubId: club.id,
  isTutor,
  isEquipmentManager,
  active: true,
  ...hash(DEMO_PASSWORD),
  mustChangePassword: false,
  lastLoginAt: lastLogin === null ? undefined : at(lastLogin, 18),
  createdAt: at(280),
});
const coaches = [
  mkCoach(TCC, "Rodrigue Agossou", "rodrigue@demo.mades.bj", "+229 01 97 10 20 30", true, true, 1),
  mkCoach(TCC, "Mireille Houngbo", "mireille@demo.mades.bj", "+229 01 96 40 50 60", false, true, 4),
  mkCoach(BTF, "Fabrice Dossou", "fabrice@demo.mades.bj", "+229 01 95 70 80 90", true, true, 2),
  mkCoach(ASPT, "Carine Zinsou", "carine@demo.mades.bj", "+229 01 94 11 22 33", true, true, 9),
  mkCoach(ASPT, "Hervé Adjovi", "herve@demo.mades.bj", "+229 01 93 44 55 66", false, false, null),
  mkCoach(PTA, "Ismaël Bio Sika", "ismael@demo.mades.bj", "+229 01 92 77 88 99", true, true, null),
];
const [RODRIGUE, MIREILLE, FABRICE, CARINE, HERVE] = coaches;

/* ---------- Matériel ---------- */
const PREFIX = { [TCC.id]: "COT", [BTF.id]: "COT", [ASPT.id]: "POR", [PTA.id]: "PAR" };
const codeCount = {};
const equipment = [];
const movements = [];
const photos = [];
fs.mkdirSync(PHOTOS, { recursive: true });

function addItem(club, resp, data, acquiredDaysAgo, lastInv) {
  const p = PREFIX[club.id];
  codeCount[p] = (codeCount[p] || 0) + 1;
  const item = {
    id: id("eq"),
    code: `MFC-${p}-${String(codeCount[p]).padStart(4, "0")}`,
    clubId: club.id,
    responsibleCoachId: resp ? resp.id : null,
    status: "en_service",
    origin: "dotation_mades",
    acquiredAt: day(acquiredDaysAgo),
    lastInventoryAt: lastInv === undefined ? undefined : day(lastInv),
    createdAt: at(acquiredDaysAgo),
    updatedAt: at(Math.min(acquiredDaysAgo, lastInv ?? acquiredDaysAgo)),
    ...data,
  };
  equipment.push(item);
  movements.push({
    id: id("mv"),
    itemId: item.id,
    itemName: item.name,
    clubId: club.id,
    type: item.origin === "club" ? "declaration" : "dotation",
    qtyAfter: data.initialQty ?? item.quantity,
    note: item.origin === "club" ? "Matériel du club déclaré par le coach" : "Dotation MADES — convention de partenariat",
    by: item.origin === "club" && resp ? actor(resp) : ADMIN,
    createdAt: at(acquiredDaysAgo, 9),
  });
  delete item.initialQty;
  return item;
}
function addPhoto(item, kind, by, daysAgo, colors, caption) {
  const fileName = `demo-${item.code.toLowerCase()}-${photos.length}.png`;
  const buf = png(480, 360, colors[0], colors[1], true);
  fs.writeFileSync(path.join(PHOTOS, fileName), buf);
  const ph = { id: id("ph"), clubId: item.clubId, itemId: item.id, kind, caption: caption || item.name, fileName, mimeType: "image/png", size: buf.length, by, createdAt: at(daysAgo, 15) };
  photos.push(ph);
  return ph;
}
const ORANGE = [[232, 93, 4], [255, 170, 90]];
const INK = [[20, 20, 22], [90, 90, 96]];
const SAND = [[214, 190, 150], [245, 230, 200]];
const GREEN = [[30, 110, 70], [120, 190, 140]];

// Tennis Club de Cotonou — inventorié il y a 20 jours
const t1 = addItem(TCC, RODRIGUE, { category: "raquettes", name: "Raquettes adulte Head Ti", discipline: "tennis", brand: "Head", quantity: 12, unit: "pièce", condition: "bon", unitValueFCFA: 35000, storageLocation: "Local matériel, armoire 1" }, 240, 20);
const t2 = addItem(TCC, MIREILLE, { category: "mini_tennis", name: "Kit mini-tennis (filets 3 m + raquettes 19-21\")", discipline: "mini-tennis", quantity: 2, unit: "kit", condition: "neuf", unitValueFCFA: 180000, storageLocation: "Local matériel" }, 120, 20);
const t3 = addItem(TCC, RODRIGUE, { category: "balles", name: "Balles orange stage 2", discipline: "mini-tennis", brand: "Tecnifibre", quantity: 6, initialQty: 8, unit: "carton", condition: "use", unitValueFCFA: 22000, storageLocation: "Chariot" }, 240, 20);
const t4 = addItem(TCC, RODRIGUE, { category: "lance_balles", name: "Lance-balles sur batterie", discipline: "tennis", brand: "Lobster", serialNumber: "LB-77821", quantity: 1, unit: "pièce", condition: "a_reparer", status: "en_reparation", unitValueFCFA: 650000, storageLocation: "Atelier" }, 240, 20);
const t5 = addItem(TCC, MIREILLE, { category: "marquage", name: "Plots et coupelles de couleur", quantity: 3, unit: "lot", condition: "bon", unitValueFCFA: 15000, storageLocation: "Chariot" }, 240, 20);
const t6 = addItem(TCC, null, { category: "raquettes", name: "Raquettes padel", discipline: "padel", brand: "Bullpadel", quantity: 8, unit: "pièce", condition: "neuf", unitValueFCFA: 45000, storageLocation: "Local matériel, armoire 2" }, 15);
const t7 = addItem(TCC, RODRIGUE, { category: "numerique", name: "Tablette d'analyse vidéo", brand: "Samsung", serialNumber: "R58N-11X", quantity: 1, unit: "pièce", condition: "bon", unitValueFCFA: 210000, storageLocation: "Bureau du club (coffre)" }, 200, 20);
const t8 = addItem(TCC, MIREILLE, { category: "securite", name: "Trousse de premiers secours", quantity: 1, unit: "trousse", condition: "bon", unitValueFCFA: 25000, storageLocation: "Accueil" }, 240, 20);

// Beach Tennis Fidjrossè — inventaire soumis avec écart il y a 3 jours
const b1 = addItem(BTF, FABRICE, { category: "raquettes", name: "Raquettes de beach tennis", discipline: "beach-tennis", brand: "Sexy Brand", quantity: 10, unit: "pièce", condition: "bon", unitValueFCFA: 55000, storageLocation: "Container plage" }, 180, 3);
const b2 = addItem(BTF, FABRICE, { category: "balles", name: "Balles beach tennis (dépressurisées)", discipline: "beach-tennis", quantity: 8, initialQty: 10, unit: "carton", condition: "use", unitValueFCFA: 18000, storageLocation: "Container plage" }, 180, 3);
const b3 = addItem(BTF, FABRICE, { category: "filets_poteaux", name: "Filet et poteaux beach (8 m)", discipline: "beach-tennis", quantity: 2, unit: "lot", condition: "a_reparer", unitValueFCFA: 120000, storageLocation: "Container plage" }, 180, 3);
const b4 = addItem(BTF, FABRICE, { category: "raquettes", name: "Paddles pickleball", discipline: "pickleball", brand: "Franklin", quantity: 8, unit: "pièce", condition: "neuf", unitValueFCFA: 30000, storageLocation: "Container plage", origin: "don_partenaire" }, 60, 3);
const b5 = addItem(BTF, FABRICE, { category: "marquage", name: "Lignes de terrain sable (sangles)", quantity: 2, unit: "lot", condition: "bon", unitValueFCFA: 40000, origin: "club", storageLocation: "Container plage" }, 90, 3);

// ASPT Porto-Novo — inventaire en retard (120 jours)
const a1 = addItem(ASPT, CARINE, { category: "raquettes", name: "Raquettes junior 23\"", discipline: "tennis", quantity: 15, unit: "pièce", condition: "use", unitValueFCFA: 20000, storageLocation: "Vestiaire" }, 360, 120);
const a2 = addItem(ASPT, CARINE, { category: "coordination", name: "Échelles de rythme et cerceaux", quantity: 2, unit: "lot", condition: "bon", unitValueFCFA: 30000, storageLocation: "Vestiaire" }, 360, 120);
const a3 = addItem(ASPT, HERVE, { category: "rangement", name: "Chariot à balles", quantity: 2, unit: "pièce", condition: "hors_service", unitValueFCFA: 60000, storageLocation: "Court 1" }, 360, 120);
const a4 = addItem(ASPT, CARINE, { category: "balles", name: "Balles intermédiaires (vertes)", discipline: "tennis", quantity: 3, initialQty: 5, unit: "carton", condition: "use", unitValueFCFA: 22000, storageLocation: "Vestiaire" }, 360, 120);
const a5 = addItem(ASPT, HERVE, { category: "raquettes", name: "Paddles pickleball", discipline: "pickleball", quantity: 4, initialQty: 6, unit: "pièce", condition: "bon", status: "en_service", unitValueFCFA: 30000, storageLocation: "Vestiaire" }, 300, 120);

// Réformé (historique)
const a6 = addItem(ASPT, null, { category: "filets_poteaux", name: "Ancien filet de tennis", discipline: "tennis", quantity: 1, unit: "pièce", condition: "hors_service", status: "reforme", unitValueFCFA: 0, storageLocation: "—" }, 360, 120);

/* ---------- Photos de preuve ---------- */
const RA = actor(RODRIGUE), FA = actor(FABRICE), CA = actor(CARINE);
addPhoto(t1, "dotation", ADMIN, 240, INK, "Réception des raquettes — dotation");
addPhoto(t2, "dotation", ADMIN, 120, ORANGE, "Kits mini-tennis neufs");
addPhoto(t2, "etat", actor(MIREILLE), 30, ORANGE, "Kit après séance école de tennis");
const phLb = addPhoto(t4, "incident", RA, 26, INK, "Moteur du lance-balles bloqué");
addPhoto(t7, "etat", RA, 20, INK, "Tablette dans son coffre");
addPhoto(b1, "etat", FA, 40, SAND, "Raquettes de beach rangées");
const phNet = addPhoto(b3, "incident", FA, 12, SAND, "Filet déchiré après le coup de vent");
const phBalls = addPhoto(b2, "inventaire", FA, 3, SAND, "Inventaire — cartons de balles");
addPhoto(b4, "dotation", ADMIN, 60, GREEN, "Don de paddles pickleball");
const phCart = addPhoto(a3, "incident", CA, 130, GREEN, "Roues du chariot cassées");
addPhoto(a1, "etat", CA, 125, GREEN, "Raquettes junior — usure des grips");

/* ---------- Mouvements complémentaires ---------- */
const mv = (item, type, by, daysAgo, extra) => movements.push({ id: id("mv"), itemId: item.id, itemName: item.name, clubId: item.clubId, type, by, createdAt: at(daysAgo, 16), ...extra });
mv(t3, "inventaire", RA, 20, { qtyBefore: 8, qtyAfter: 6, conditionBefore: "bon", conditionAfter: "use", note: "Deux cartons utilisés pour le stage de juillet" });
mv(t4, "incident", RA, 26, { conditionBefore: "bon", conditionAfter: "a_reparer", note: "Casse / dégradation — moteur bloqué en cours de séance", photoIds: [phLb.id] });
mv(t4, "etat", ADMIN, 22, { note: "Envoyé chez le réparateur agréé (devis 45 000 FCFA)" });
mv(t6, "responsable", ADMIN, 14, { fromCoachId: MIREILLE.id, toCoachId: null, note: "En attente d'un responsable padel" });
mv(b3, "incident", FA, 12, { conditionBefore: "bon", conditionAfter: "a_reparer", note: "Casse / dégradation — filet déchiré après un coup de vent", photoIds: [phNet.id] });
mv(b2, "inventaire", FA, 3, { qtyBefore: 10, qtyAfter: 8, note: "2 cartons manquants : prêtés au tournoi de Ouidah, retour prévu", photoIds: [phBalls.id] });
mv(a3, "incident", CA, 130, { conditionBefore: "use", conditionAfter: "hors_service", note: "Casse / dégradation — roues cassées", photoIds: [phCart.id] });
mv(a4, "inventaire", CA, 120, { qtyBefore: 5, qtyAfter: 3, note: "Balles usées jetées" });
mv(a5, "transfert", ADMIN, 150, { fromClubId: BTF.id, toClubId: ASPT.id, fromCoachId: FABRICE.id, toCoachId: HERVE.id, note: "Rééquilibrage pickleball vers Porto-Novo" });
mv(a5, "incident", actor(HERVE), 140, { qtyBefore: 6, qtyAfter: 4, note: "Perte — 2 paddles non rendus après une animation scolaire" });
mv(a6, "reforme", ADMIN, 118, { conditionBefore: "use", conditionAfter: "hors_service", note: "Filet irréparable, remplacé" });

/* ---------- Inventaires ---------- */
const line = (it, expected, counted, before, cond, note, photoIds) => ({ itemId: it.id, code: it.code, name: it.name, expectedQty: expected, countedQty: counted, conditionBefore: before, condition: cond, note, photoIds });
const inventories = [
  {
    id: id("inv"),
    clubId: TCC.id,
    by: RA,
    date: day(20),
    lines: [line(t1, 12, 12, "bon", "bon"), line(t2, 2, 2, "neuf", "neuf"), line(t3, 8, 6, "bon", "use", "Deux cartons utilisés pour le stage de juillet"), line(t4, 1, 1, "a_reparer", "a_reparer"), line(t5, 3, 3, "bon", "bon"), line(t7, 1, 1, "bon", "bon"), line(t8, 1, 1, "bon", "bon")],
    discrepancies: 1,
    comment: "Inventaire trimestriel complet.",
    status: "valide",
    reviewedBy: ADMIN,
    reviewedAt: at(18),
    reviewComment: "Consommation de balles cohérente avec le stage.",
    createdAt: at(20, 17),
  },
  {
    id: id("inv"),
    clubId: BTF.id,
    by: FA,
    date: day(3),
    lines: [line(b1, 10, 10, "bon", "bon"), line(b2, 10, 8, "use", "use", "2 cartons prêtés au tournoi de Ouidah, retour prévu", [phBalls.id]), line(b3, 2, 2, "a_reparer", "a_reparer"), line(b4, 8, 8, "neuf", "neuf"), line(b5, 2, 2, "bon", "bon")],
    discrepancies: 1,
    comment: "Container nettoyé, un cadenas à remplacer.",
    status: "soumis",
    createdAt: at(3, 17),
  },
  {
    id: id("inv"),
    clubId: ASPT.id,
    by: CA,
    date: day(120),
    lines: [line(a1, 15, 15, "bon", "use"), line(a2, 2, 2, "bon", "bon"), line(a3, 2, 2, "hors_service", "hors_service"), line(a4, 5, 3, "use", "use", "Balles usées jetées"), line(a5, 4, 4, "bon", "bon")],
    discrepancies: 1,
    status: "valide",
    reviewedBy: ADMIN,
    reviewedAt: at(117),
    createdAt: at(120, 17),
  },
];

/* ---------- Apprenants et alternances ---------- */
const learners = [
  { name: "Aïcha Tossou", email: "aicha.tossou@demo.mades.bj", phone: "+229 01 61 00 00 01" },
  { name: "Koffi Mensah", email: "koffi.mensah@demo.mades.bj", phone: "+229 01 61 00 00 02" },
  { name: "Grâce Ahounou", email: "grace.ahounou@demo.mades.bj", phone: "+229 01 61 00 00 03" },
  { name: "Brice Gbaguidi", email: "brice.gbaguidi@demo.mades.bj", phone: "+229 01 61 00 00 04" },
  { name: "Nadia Lawani", email: "nadia.lawani@demo.mades.bj", phone: "+229 01 61 00 00 05" },
].map((l, i) => ({ id: id("lrn"), ...l, createdAt: at(200 - i * 10) }));
const [AICHA, KOFFI, GRACE, BRICE, NADIA] = learners;

const placement = (l, club, tutor, start, end, schedule, hours, objectives, extra = {}) => ({
  id: id("pl"),
  learnerId: l.id,
  learnerName: l.name,
  level: "jes1",
  formationTitle: "JES Niveau 1 — Jeune Éducateur de Sport",
  clubId: club.id,
  tutorCoachId: tutor ? tutor.id : null,
  startDate: day(start),
  endDate: day(end),
  schedule,
  hoursPlanned: hours,
  objectives,
  status: "planifie",
  createdAt: at(start + 10),
  ...extra,
});
const placements = [
  placement(AICHA, TCC, RODRIGUE, 45, -45, "Mercredi après-midi et samedi matin", 60, "Préparer et animer une séance mini-tennis 6-8 ans.\nGérer un groupe de 12 enfants en sécurité.\nUtiliser le matériel pédagogique adapté (balles orange, filets 3 m)."),
  placement(KOFFI, BTF, FABRICE, 30, -60, "Samedi et dimanche matin (plage)", 50, "Encadrer une initiation beach tennis pour adultes débutants.\nMettre en place un terrain sur sable."),
  placement(GRACE, TCC, MIREILLE, 25, -35, "Mardi et jeudi 16 h – 19 h", 40, "Animer l'école de tennis (niveau vert).\nObserver et corriger le geste du coup droit."),
  placement(BRICE, ASPT, CARINE, 160, 70, "Mercredi après-midi", 40, "Découverte du pickleball en milieu scolaire.", {
    evaluation: { result: "acquis", comment: "Très bonne posture d'éducateur, ponctuel, à l'aise avec les groupes scolaires. Peut encadrer seul une initiation.", by: actor(CARINE), at: at(68) },
  }),
  placement(NADIA, PTA, null, -20, -110, "À définir avec le club", 40, "Initiation et école de tennis à Parakou."),
];
const [PA, PK, PG, PB] = placements;

const log = (p, daysAgo, hours, activity, status, by, extra = {}) => ({ id: id("log"), placementId: p.id, date: day(daysAgo), hours, activity, status, by, createdAt: at(daysAgo, 20), ...extra });
const tutorOf = (p) => actor(coaches.find((c) => c.id === p.tutorCoachId));
const learnerActor = (l) => ({ role: "learner", id: l.id, name: l.name });
const logs = [
  log(PA, 42, 3, "Observation de l'école de tennis, aide à la mise en place du matériel", "valide", learnerActor(AICHA), { validatedBy: tutorOf(PA), validatedAt: at(41) }),
  log(PA, 38, 4, "Co-animation séance mini-tennis 6-8 ans (12 enfants)", "valide", learnerActor(AICHA), { validatedBy: tutorOf(PA), validatedAt: at(37), tutorComment: "Bonne gestion du groupe." }),
  log(PA, 31, 3, "Animation d'un atelier coordination avec échelles et plots", "valide", tutorOf(PA), { validatedBy: tutorOf(PA), validatedAt: at(31) }),
  log(PA, 24, 4, "Séance mini-tennis en autonomie, sous supervision", "valide", learnerActor(AICHA), { validatedBy: tutorOf(PA), validatedAt: at(23) }),
  log(PA, 17, 3, "Préparation et animation d'un plateau mini-tennis interclubs", "valide", learnerActor(AICHA), { validatedBy: tutorOf(PA), validatedAt: at(16) }),
  log(PA, 3, 3, "Séance école de tennis : coup droit, jeux de cible", "a_valider", learnerActor(AICHA)),
  log(PK, 27, 4, "Montage du terrain sur sable et initiation adultes", "valide", learnerActor(KOFFI), { validatedBy: tutorOf(PK), validatedAt: at(26) }),
  log(PK, 20, 4, "Animation d'un tournoi d'initiation en double", "valide", tutorOf(PK), { validatedBy: tutorOf(PK), validatedAt: at(20) }),
  log(PK, 6, 4, "Initiation beach tennis groupe entreprise (10 personnes)", "a_valider", learnerActor(KOFFI)),
  log(PK, 13, 2, "Rangement et contrôle du matériel", "refuse", learnerActor(KOFFI), { validatedBy: tutorOf(PK), validatedAt: at(12), tutorComment: "Hors activité pédagogique : non comptabilisé." }),
  log(PG, 20, 3, "Observation de l'école de tennis niveau vert", "valide", learnerActor(GRACE), { validatedBy: tutorOf(PG), validatedAt: at(19) }),
  log(PG, 13, 3, "Atelier coup droit : correction de la préparation", "valide", learnerActor(GRACE), { validatedBy: tutorOf(PG), validatedAt: at(12) }),
  ...[150, 140, 130, 120, 110, 100, 90, 80].map((d, i) => log(PB, d, 5, ["Initiation pickleball école primaire", "Cycle pickleball CM2", "Animation du mercredi au club", "Séance pickleball parents-enfants"][i % 4], "valide", tutorOf(PB), { validatedBy: tutorOf(PB), validatedAt: at(d) })),
];

/* ---------- Écriture ---------- */
const merge = (f, items) => write(f, [...read(f), ...items]);
merge("clubs.json", clubs);
merge("coaches.json", coaches);
merge("equipment.json", equipment);
merge("equipment-movements.json", movements);
merge("equipment-photos.json", photos);
merge("inventories.json", inventories);
merge("learners.json", learners);
merge("placements.json", placements);
merge("alternance-logs.json", logs);

console.log(`Démo réseau installée : ${clubs.length} clubs, ${coaches.length} coachs, ${equipment.length} articles, ${photos.length} photos, ${inventories.length} inventaires, ${placements.length} alternances.`);
console.log(`\nConnexion coach (onglet « Coach ») — mot de passe : ${DEMO_PASSWORD}`);
for (const c of coaches) console.log(`  ${c.email.padEnd(28)} ${c.name} — ${clubs.find((x) => x.id === c.clubId).name}${c.isEquipmentManager ? " · resp. matériel" : ""}`);
console.log(`\nConnexion apprenant (onglet « Apprenant ») : ${AICHA.name} / ${AICHA.email} / ${AICHA.phone}`);

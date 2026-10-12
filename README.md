# MADES Formation Continue

Plateforme de formation continue MADES en **4 niveaux** — JES Niveau 1,
JES Niveau 2, Entraîneur sports de raquette, Diplôme d'État (avec nos
partenaires) — avec, à chaque niveau, **5 modules sportifs** : tennis, beach
tennis, padel, mini-tennis et pickleball. Inscription en ligne par niveau
(multi-devises), certificats PDF, export calendrier, et back-office
administrateur complet.

Construit avec **Next.js 14 (App Router)**, **TypeScript** et **Tailwind
CSS**, dans la même configuration que le projet Beach Tennis Bénin : aucune
base de données externe à configurer, tout fonctionne avec `npm install &&
npm run dev`.

## Démarrer le projet

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

Pour un build de production :

```bash
npm run build
npm run start
```

## Connexion et rôles

Trois espaces, accessibles depuis `/login` :

- **Apprenant** — nom, email et téléphone ; le compte se crée automatiquement
  à la première connexion. Donne accès à `/dashboard` : inscriptions,
  heures de formation continue cumulées, certificats à télécharger.
- **Coach** (club partenaire) — email et mot de passe créés par l'administration,
  donne accès à `/coach` : matériel, inventaires, photos de preuve, alternants.
- **Administrateur** — identifiant et mot de passe, donne accès à `/admin`.

Compte administrateur par défaut :

```
Identifiant : admin
Mot de passe : MadesFormation2026
```

**Changez ce mot de passe avant toute mise en ligne réelle** :

```bash
npm run create-admin -- <identifiant> <nouveau-mot-de-passe> "Nom affiché"
```

Les sessions sont des cookies signés (HMAC, Web Crypto) et les mots de passe
sont hachés avec sel (scrypt). Définissez la variable d'environnement
`AUTH_SECRET` avant un déploiement réel.

## Réseau des clubs partenaires, matériel et alternance

### Les acteurs

| Rôle | Ce qu'il fait |
|---|---|
| **Administration** (`/admin`) | Crée les clubs et les coachs, dote les clubs en matériel, transfère, réforme, valide les inventaires, place les apprenants en alternance, a la vue globale. |
| **Coach responsable matériel** | Gère *tout* le parc de son club : déclare, met à jour l'état, réattribue entre coachs du club, fait l'inventaire complet. |
| **Coach** | Gère le matériel *dont il est responsable* et le voit en lecture seule pour le reste du club. |
| **Coach tuteur** | Suit ses alternants : valide ou refuse les séances déclarées, en ajoute, rédige l'évaluation de fin d'alternance. |
| **Apprenant** | Voit son club, son tuteur (téléphone, email), ses heures ; déclare ses séances dans son carnet de bord. |

### Matériel

- Chaque article a un **code unique** (`MFC-COT-0001`), une catégorie, une quantité, un état
  (neuf → hors service), un statut (en service, en réparation, perdu, réformé), une origine
  (dotation MADES, matériel du club, don), une valeur et un lieu de stockage.
- **Traçabilité complète** : chaque dotation, déclaration, changement d'état, transfert,
  changement de responsable, incident, réparation, inventaire et réforme est enregistré
  automatiquement dans un journal (qui, quand, avant / après).
- **Incidents** (casse, perte, vol) déclarés avec photos ; une perte diminue la quantité.
- Un coach ne peut pas modifier une quantité à la main : elle change seulement par
  **inventaire** ou **incident**. La réforme, la suppression et les transferts entre clubs
  sont réservés à l'administration.
- **Export CSV** (Excel) de tout le parc filtré, avec club, responsable et valeur.

### Photos de preuve

Coachs et administration peuvent photographier le matériel (bouton « Photo » : ouvre
l'appareil photo du téléphone). Les photos sont compressées dans le navigateur
(~1600 px), vérifiées côté serveur (vraie image JPG / PNG / WebP / HEIC, 12 Mo max),
rangées dans `data/uploads/photos/` et servies uniquement aux personnes autorisées
(administration et coachs du même club). Elles sont rattachées à l'article, à l'incident
ou à la ligne d'inventaire.

### Inventaires

Le coach compte chaque article, note l'état, explique les écarts et prend des photos.
Les quantités du parc sont mises à jour aussitôt. **Sans écart, l'inventaire est validé
d'office ; avec écart, il part en validation** (« Valider » ou « À revoir » côté admin).
Un club non inventorié depuis 90 jours est signalé en retard.

### Alternance

Une alternance = un apprenant, un club, un tuteur, des dates, un rythme, un volume
d'heures et des objectifs. Le carnet de bord cumule les heures **validées** ; le tuteur
termine par une évaluation (acquis / en cours d'acquisition / non acquis).

### Démonstration

```bash
npm run seed:reseau            # installe 4 clubs, 6 coachs, 19 articles, photos, inventaires, alternances
npm run seed:reseau -- --clean # retire uniquement les données de démo (identifiants « demo-… »)
```

Coachs de démo (onglet **Coach**, mot de passe `Coach2026!`) : `rodrigue@demo.mades.bj`
(Tennis Club de Cotonou, responsable matériel et tuteur), `mireille@demo.mades.bj`,
`fabrice@demo.mades.bj`, `carine@demo.mades.bj`. Apprenante de démo : Aïcha Tossou,
`aicha.tossou@demo.mades.bj`.

En production, l'administration crée chaque coach dans **Back-office › Coachs** : un mot
de passe provisoire est affiché une seule fois (avec un message prêt à envoyer) et le
coach doit le changer à sa première connexion.

> Hébergement : les données et les photos sont des fichiers dans `data/`. Il faut donc
> un serveur avec disque persistant (VPS, Railway, Render…). Sur un hébergement sans
> disque (Vercel), branchez une base de données et un stockage d'objets.

## Le parcours de certification

Le parcours MADES suit quatre niveaux progressifs :

1. **JES Niveau 1** (Jeune Éducateur de Sport) — encadrer en sécurité une première séance
2. **JES Niveau 2** (Jeune Éducateur de Sport) — conduire des cycles complets, tous publics
3. **Entraîneur sports de raquette** — préparer des joueurs à la compétition
4. **Diplôme d'État** — diriger une structure, former des formateurs, avec nos partenaires

Chaque niveau est **une formation** : un coach s'inscrit au niveau complet
(un prix, une session, un certificat). Chaque niveau contient les **5 modules
sportifs** (tennis, beach tennis, padel, mini-tennis, pickleball) — avec
leurs heures et leurs contenus — plus un **tronc commun** transversal
(pédagogie, sécurité, gestion…). Le champ « Mention de partenariat » d'une
formation (rempli pour le DE) s'affiche sur sa fiche et sur le certificat.

La page `/parcours` affiche les 4 niveaux et, pour un apprenant connecté,
met en évidence les niveaux déjà validés et le prochain à viser.

## Fonctionnalités

| Page | Rôle |
|---|---|
| `/` | Page d'accueil, présentation des 4 niveaux et des 5 modules |
| `/formations` | Catalogue filtrable par niveau et par module sportif |
| `/formations/[id]` | Fiche formation : programme, sessions, inscription, avis |
| `/parcours` | Visualisation du parcours de certification sur les 4 niveaux |
| `/sessions` | Calendrier public de toutes les sessions programmées |
| `/login` | Connexion (apprenant ou administration) |
| `/dashboard` | Espace apprenant : inscriptions, heures cumulées, certificats |
| `/admin` | Tableau de bord administrateur complet |

## Tableau de bord admin (`/admin`)

Le back-office utilise une **barre latérale verticale** (repliable sur
desktop, tiroir sur mobile) : chaque module a sa propre icône, la page
active est surlignée en orange, et le bouton « Nouvelle formation » reste
toujours visible en haut. Chaque module est une page à part entière.

| Module | Icône | Actions possibles |
|---|---|---|
| Vue d'ensemble | tableau de bord | Indicateurs animés, chiffre d'affaires sur 6 mois, inscriptions par niveau, prochaines sessions, dernières inscriptions, actions rapides |
| Formations | livre | Créer / modifier / dupliquer / supprimer un niveau, publier ou masquer, choisir les 5 modules sportifs (heures + contenus), tronc commun, mention de partenariat |
| Sessions | calendrier | Programmer des dates, lieu, formateur, capacité ; suivre le remplissage |
| Inscriptions | presse-papiers | Confirmer un paiement, terminer une formation (délivre le certificat), annuler, inscrire un apprenant, export CSV |
| Apprenants | groupe | Liste des coachs, historique, export CSV |
| Certificats | médaille | Valider les formations suivies, télécharger les PDF |
| Avis | étoile | Modérer les avis publiés |
| Taux de change | pièces | Mettre à jour FCFA ⇄ EUR / USD |
| Mon compte | utilisateur | Changer son mot de passe, gérer les administrateurs |

Toutes les actions passent par des routes API protégées côté serveur
(`requireAdmin()`) — un appel direct sans session admin valide est rejeté
(401), pas seulement caché dans l'interface.

## Deux fonctionnalités innovantes, réellement fonctionnelles

- **Certificats PDF générés à la volée** (`lib` : `pdfkit`) : dès qu'une
  inscription passe au statut "terminée", un certificat officiel est
  généré et téléchargeable en un clic depuis `/dashboard` — nom de
  l'apprenant, niveau, modules suivis, volume horaire, numéro de certificat.
- **Export calendrier (.ics)** : chaque inscription peut être ajoutée en un
  clic à n'importe quel calendrier (Google Calendar, Outlook, Apple
  Calendar...), avec les bonnes dates, le lieu et le formateur.

D'autres pistes notées pour la suite : quiz de validation en ligne par
module, annuaire public des coachs certifiés (en lien avec le
positionnement réseau mondial de MADES), rappels de renouvellement de
certification, visioconférence intégrée pour les sessions à distance.

## Devises (FCFA, EUR, USD)

Le FCFA est la devise de référence (`lib/currency.ts`). L'euro est arrimé au
FCFA par traité (1 EUR = 655,957 FCFA, taux fixe) ; le dollar flotte et doit
être mis à jour régulièrement par un administrateur depuis l'onglet **Taux
de change**. Le prix affiché et réglé peut être choisi dans les trois
devises ; le montant est toujours stocké en FCFA en base (canonique).

## Paiement — ce qui est réellement fonctionnel

Le parcours est complet de bout en bout : choix du mode de paiement (Mobile
Money, carte, virement), création d'un enregistrement réel, passage en
attente, puis confirmation par un administrateur. Ce qui n'est **pas**
branché : un vrai prestataire de paiement qui débiterait réellement une
carte ou un compte Mobile Money — à intégrer dans
`app/api/enrollments/route.ts` au moment de la création de l'inscription.

## Fiches techniques téléchargeables

Chaque formation peut recevoir des **fiches techniques** (PDF, Word, Excel,
PowerPoint, images — 25 Mo max par fichier) :

- **Admin** : `/admin/formations` → bouton « Fiches techniques » (icône
  document orange, avec le nombre de fiches) sur la ligne de la formation.
  Glisser-déposer plusieurs fichiers à la fois, renommer une fiche en cliquant
  sur son titre, la rattacher à un module (tennis, padel…) ou à tout le
  niveau, prévisualiser, supprimer.
- **Candidats** : section « Fiches techniques » sur la page de la formation
  (raccourci dans l'en-tête), téléchargement en un clic sous un nom de fichier
  lisible, aperçu direct des PDF et images.

Les fichiers sont stockés dans `data/uploads/docs/` et décrits dans
`data/documents.json` ; supprimer une formation supprime aussi ses fiches.
Pensez à sauvegarder le dossier `data/` avec le reste des données : il faut
un hébergement avec disque persistant (VPS, serveur Node), pas Vercel.

## Identité visuelle et animations

L'interface reprend l'identité de [mades-site.vercel.app](https://mades-site.vercel.app/fr) :

- **Couleurs** : orange `#FF4D00`, encre `#0A0A08`, fond papier `#F8F8F6`
  (jetons dans `tailwind.config.ts`).
- **Typographies** auto-hébergées (paquets `@fontsource`, aucune requête
  externe) : *Barlow Condensed* 900 italique pour les titres, *Hanken
  Grotesk* pour le texte, *DM Mono* pour les étiquettes et les chiffres.
- **Boutons à flèche** (`components/ui/ArrowButton.tsx`) : remplissage
  circulaire depuis le curseur, roulement vertical des lettres, flèche qui
  traverse le bouton au survol.
- **Animations** : titres qui montent mot par mot (`SplitTitle`),
  apparitions au défilement (`Reveal`), compteurs animés, bandeaux
  défilants, tuiles coupées en biais, barre de progression de lecture,
  menu mobile plein écran, transitions entre pages, bouton « retour en haut ».
- **Icônes** : un pictogramme dessiné par module sportif, pickleball compris
  (`components/icons/DisciplineIcon.tsx`), une icône par niveau, et une
  icône choisie automatiquement pour chaque contenu du tronc commun d'après
  son intitulé (`moduleIcon`).

Toutes les animations sont coupées si l'utilisateur a activé « réduire les
animations » dans son système.

## Structure du projet

```
app/
  (site)/                 pages publiques (barre de navigation + pied de page)
    page.tsx               accueil
    formations/            catalogue + fiche détaillée (/formations, /formations/[id])
    parcours/              visualisation du parcours de certification
    sessions/              calendrier public
    dashboard/             espace apprenant
    login/                 connexion
  admin/                  back-office (barre latérale verticale, une page par module)
    _components/           Sidebar, kit d'interface (tiroirs, filtres, confirmations…)
    _lib/                  contexte partagé (données, notifications)
  api/                    toutes les routes API
components/               composants partagés (ArrowButton, Reveal, SplitTitle, Navbar…)
lib/
  types.ts                  modèle de données partagé
  db.ts                      accès aux données (fichiers JSON sous /data)
  auth.ts                     sessions (cookies signés, Web Crypto)
  password.ts                  hachage des mots de passe (scrypt)
  currency.ts                   conversions FCFA ⇄ EUR ⇄ USD
data/                            fichiers JSON (base de données locale)
scripts/create-admin.js           création/mise à jour d'un compte admin
```

## Aller plus loin

- **Vrai prestataire de paiement** : brancher Kkiapay/FedaPay/CinetPay ou
  Stripe au moment de la création de l'inscription.
- **Base de données réelle** : remplacer les fonctions de `lib/db.ts` par
  des requêtes vers PostgreSQL/Supabase, en conservant les mêmes signatures.
- **Notifications** : email/SMS/WhatsApp à l'inscription, à la confirmation
  de paiement, et à l'émission du certificat.
- **Quiz de validation** : ajouter un module d'évaluation en ligne avant de
  pouvoir marquer une inscription "terminée".

# MADES Formation Continue

Plateforme de formation continue MADES pour les coachs de **beach tennis,
padel, tennis et mini-tennis** — catalogue de formations, parcours de
certification progressif (Initiateur → Animateur → Entraîneur → Diplôme
d'État), inscription en ligne multi-devises, certificats PDF, export
calendrier, et back-office administrateur complet.

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

Deux espaces, accessibles depuis `/login` :

- **Apprenant** — nom, email et téléphone ; le compte se crée automatiquement
  à la première connexion. Donne accès à `/dashboard` : inscriptions,
  heures de formation continue cumulées, certificats à télécharger.
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

## Le parcours de certification

Inspiré du système des diplômes d'État français, le parcours MADES suit
quatre niveaux progressifs, déclinés sur chaque discipline :

1. **Initiateur** — encadrer une première séance de découverte
2. **Animateur** — conduire un cycle complet de progression
3. **Entraîneur** — préparer à la compétition
4. **Diplôme d'État (DE)** — diriger une structure, former des formateurs

La page `/parcours` affiche cette progression pour chacune des 4 disciplines
(beach tennis, padel, tennis, mini-tennis) et, pour un apprenant connecté,
met en évidence les niveaux déjà validés (formations terminées).

## Fonctionnalités

| Page | Rôle |
|---|---|
| `/` | Page d'accueil, présentation du parcours et des disciplines |
| `/formations` | Catalogue filtrable par discipline et par niveau |
| `/formations/[id]` | Fiche formation : programme, sessions, inscription, avis |
| `/parcours` | Visualisation du parcours de certification par discipline |
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
| Vue d'ensemble | tableau de bord | Indicateurs animés, chiffre d'affaires sur 6 mois, inscriptions par discipline, prochaines sessions, dernières inscriptions, actions rapides |
| Formations | livre | Créer / modifier / dupliquer / supprimer, publier ou masquer, programme (modules) |
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
  l'apprenant, discipline, niveau, volume horaire, numéro de certificat.
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
- **Icônes** : un pictogramme dessiné par discipline
  (`components/icons/DisciplineIcon.tsx`), une icône par niveau, et une
  icône choisie automatiquement pour chaque module du programme d'après son
  intitulé (`moduleIcon`).

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
#   f o r m a t i o n c o n t i n u e  
 
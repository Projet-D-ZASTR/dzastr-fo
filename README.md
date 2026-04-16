# D-ZASTR Frontend

Application frontend de gestion clients, services et factures, construite avec Vue 3 + Vite + DaisyUI.

![Logo D-ZASTR SVG](public/img/D-Zastre.svg)

## Assets

- Logo SVG: `public/img/D-Zastre.svg`
- Logo PNG: `public/img/D-Zastre.png`
- Favicon: `public/img/favicon.ico`

![Favicon D-ZASTR](public/img/favicon.ico)

## Vue d'ensemble

Le projet est une SPA avec:

- une route d'authentification (`/auth`)
- un dashboard principal (`/`)
- une gestion locale en memoire des donnees (clients, services, factures)
- une generation PDF cote front via `jsPDF`

## Fonctionnalites principales

- Authentification UI (login/register) avec navigation vers dashboard
- Tableau clients:
  - ajout
  - edition
  - suppression avec confirmation
  - creation de facture
  - acces aux factures existantes via icones
- Creation de services:
  - nom du service
  - prix horaire decimal (virgule ou point)
- Gestion facture:
  - plusieurs factures par client
  - creation en brouillon
  - edition des lignes en mode brouillon
  - verrouillage en lecture sur statuts non-brouillon
  - changement d'etat (brouillon, envoyee, payee, annulee)
  - calcul HT / TVA / TTC
  - mode auto-entrepreneur (TVA 0%)
- Export PDF:
  - document A4 propre (infos client, lignes, totaux)
  - export direct depuis le JSON de la facture selectionnee

## Stack technique

- Vue 3
- Vite
- Vue Router
- Tailwind CSS v4
- DaisyUI v5
- Vitest
- ESLint
- Prettier
- jsPDF

## Monitoring & observabilite

Pour couvrir le point **"Logs structures & monitoring"** du cahier des charges, le frontend s'integre dans une stack d'observabilite simple basee sur des outils libres.

### Objectif

Le dashboard doit permettre de visualiser :

- l'etat des services (`fo`, `auth`, `mo`, `db`)
- les erreurs applicatives
- quelques metriques simples (trafic, erreurs HTTP, latence)

### Architecture retenue

- **Grafana** : dashboard central accessible pour la demo et la supervision
- **Prometheus** : collecte des metriques exposees par les backends
- **Loki + Promtail** : collecte et consultation des logs Docker structures
- **Sentry (optionnel cote frontend)** : remontes d'erreurs runtime navigateur

Le frontend ne porte pas seul tout le monitoring : il s'insere dans la stack du monorepo definie au niveau racine.

### Integration recommandee

1. Ajouter au `docker-compose.yml` racine :
   - `prometheus`
   - `grafana`
   - `loki`
   - `promtail`
2. Exposer sur les backends :
   - `GET /health`
   - `GET /metrics`
3. Faire sortir les logs `auth` et `mo` en JSON sur `stdout`
4. Laisser le frontend accessible via `dzaster-fo` et brancher, si besoin, Sentry Browser pour les erreurs JS cote client
5. Centraliser l'affichage dans Grafana avec un dashboard unique

### Role du frontend dans cette integration

Le frontend contribue au monitoring de trois manieres :

- il consomme les endpoints backend monitorables (`/health`, `/metrics`)
- il reste le point d'entree visible de la plateforme via Nginx
- il peut remonter les erreurs navigateur (rendering, appels API, erreurs JS) vers Sentry ou un outil equivalent

Le monitoring principal reste cependant cote infrastructure et backends, car ce sont eux qui exposent les metriques techniques exploitables par Prometheus.

### Dashboard minimal attendu

Un dashboard Grafana libre peut afficher au minimum :

- disponibilite des services
- nombre de requetes HTTP
- nombre d'erreurs `4xx` / `5xx`
- temps de reponse moyen ou `p95`
- logs d'erreur recents (`auth` / `mo`)

### Pourquoi cette solution est adaptee au projet

- elle est compatible avec votre stack Docker actuelle
- elle est simple a montrer en soutenance
- elle couvre clairement le besoin "dashboard accessible"
- elle s'appuie sur des outils standards et libres

## Routes

- `/` -> `MainView`
- `/auth` -> `AuthView`
- fallback `/:pathMatch(.*)*` -> redirection `/auth`

## Lancer le projet

```bash
npm install
npm run dev
```

Important: `npm run dev` lance automatiquement les tests avant de demarrer le serveur (script `predev`).

## Scripts disponibles

```bash
npm run dev         # lance les tests puis demarre Vite
npm run build       # build production
npm run preview     # preview du build
npm run test        # tests unitaires (vitest run)
npm run test:watch  # tests en mode watch
npm run lint        # lint ESLint
npm run format      # formatage Prettier
```

## Tests

Tests existants:

- `src/utils/invoice.test.js`
  - calcul TVA standard
  - calcul auto-entrepreneur
  - metadata facture client
  - fallback label statut

## Structure du projet

```text
src/
  App.vue
  main.js
  style.css
  components/
    auth/
      LoginForm.vue
      RegisterForm.vue
    client/
      ClientTable.vue
      ClientModal.vue
    footer/
      AppFooter.vue
    facture/
      FactureModal.vue
      FacturePanel.vue
    navbar/
      AppNavbar.vue
    prestation/
      PrestationModal.vue
    ui/
      BaseModal.vue
  router/
    index.js
  utils/
    invoice.js
    invoice.test.js
  views/
    AuthView.vue
    MainView.vue
```

## Composants et logique cle

- `src/views/MainView.vue`
  - orchestration des donnees et de l'UI principale
  - creation/edition des factures, changement de statut
  - export PDF via `downloadInvoicePdf`
- `src/components/client/ClientTable.vue`
  - affichage clients + actions
  - une icone par facture avec statut au survol
- `src/components/facture/FacturePanel.vue`
  - mode creation/edition pour brouillon
  - mode lecture pour facture non-brouillon
- `src/components/ui/BaseModal.vue`
  - base commune des popups

## Theme UI

Le projet utilise DaisyUI avec le theme personnalise **D-ZASTR** (palette claire, contrastes doux, composants arrondis).

## Build & deploy

- Build production: `npm run build`
- Preview locale du build: `npm run preview`
- Docker present:
  - `Dockerfile`
  - `nginx.conf`
- Stack de monitoring a brancher au niveau du repo racine :
  - `Prometheus`
  - `Grafana`
  - `Loki`
  - `Promtail`

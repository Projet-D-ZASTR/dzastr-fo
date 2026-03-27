# D-ZASTR Frontend

Application frontend de gestion clients, services et factures, construite avec Vue 3 + Vite + DaisyUI.

![Logo D-ZASTR SVG](public/img/D-Zastre.svg)
![Logo D-ZASTR PNG](public/img/D-Zastre.png)

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

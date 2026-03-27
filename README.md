# dzastr-fo
 
Frontend application for the D-ZASTR project, built with Vue 3, Vite, and DaisyUI.

## Project Overview

This repository contains the frontend of the application.

The frontend is designed as a single-page application with a simple workflow:

- authentication screen
- main dashboard after login
- client management
- service creation
- invoice creation
- PDF generation through the backend

The goal is to keep the interface clean, fast, and easy to use.

## Frontend Stack

- Vue 3
- Vite
- Vue Router
- Tailwind CSS
- DaisyUI
- ESLint
- Prettier
- Vitest

## Functional Scope

### Authentication

The application starts with an authentication interface.

Planned features:

- login form
- register form
- access to the main dashboard after successful authentication

### Main Dashboard

After authentication, the user accesses a mono-page dashboard with:

- a navigation bar
- a button to create a service
- a client management area
- invoice creation actions

### Client Management

The dashboard includes a client table with the ability to:

- add a client
- edit a client
- delete a client
- create an invoice for a client

### Service Management

A button in the navbar opens a modal to create a new service.

A service contains at least:

- title
- hourly rate

### Invoice Management

From the client table, the user can open a dedicated invoice component to:

- select one or more services
- generate invoice lines
- calculate totals
- prepare PDF export

### PDF Generation

The frontend will interact with the backend to:

- generate a PDF invoice
- allow document download

## Planned UI Structure

### Authentication View

A dedicated authentication page with:

- LoginForm
- RegisterForm

### Dashboard View

A single main page containing:

- AppNavbar
- ClientTable
- ClientModal
- PrestationModal
- FactureModal or InvoiceBuilder

## Planned Project Structure

src/
  assets/
  components/
    auth/
      LoginForm.vue
      RegisterForm.vue
    navbar/
      AppNavbar.vue
    client/
      ClientTable.vue
      ClientModal.vue
    prestation/
      PrestationModal.vue
    facture/
      FactureModal.vue
    ui/
      BaseModal.vue
  router/
    index.js
  views/
    MainView.vue
  App.vue
  main.js
  style.css

## UI Theme Setup

This project uses DaisyUI with a custom theme named D-ZASTR.

## UI Stack

- Tailwind CSS
- DaisyUI
- Custom theme: D-ZASTR

## Theme Used

The D-ZASTR theme is declared through the DaisyUI plugin with a custom configuration based on OKLCH colors.

### Features

- light mode
- custom palette
- soft rounded corners
- clean and modern look
- centralized color variables

## Theme Configuration

@plugin "daisyui/theme" {
  name: "D-ZASTR";
  default: false;
  prefersdark: false;
  color-scheme: "light";
  --color-base-100: oklch(100% 0 0);
  --color-base-200: oklch(97% 0 0);
  --color-base-300: oklch(92% 0 0);
  --color-base-content: oklch(20% 0 0);
  --color-primary: oklch(85% 0.199 91.936);
  --color-primary-content: oklch(42% 0.095 57.708);
  --color-secondary: oklch(75% 0.183 55.934);
  --color-secondary-content: oklch(40% 0.123 38.172);
  --color-accent: oklch(0% 0 0);
  --color-accent-content: oklch(100% 0 0);
  --color-neutral: oklch(37% 0.01 67.558);
  --color-neutral-content: oklch(92% 0.003 48.717);
  --color-info: oklch(74% 0.16 232.661);
  --color-info-content: oklch(39% 0.09 240.876);
  --color-success: oklch(76% 0.177 163.223);
  --color-success-content: oklch(37% 0.077 168.94);
  --color-warning: oklch(82% 0.189 84.429);
  --color-warning-content: oklch(41% 0.112 45.904);
  --color-error: oklch(70% 0.191 22.216);
  --color-error-content: oklch(39% 0.141 25.723);
  --radius-selector: 1rem;
  --radius-field: 0.5rem;
  --radius-box: 1rem;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 1;
  --noise: 0;
}

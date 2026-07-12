# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Local Test Data

Deterministic Firestore fixtures live in `../test data/seed_data/`. To make the app test-ready locally:

1. Copy `.env.example` to `.env.local`.
2. Use `VITE_USE_FIREBASE_EMULATOR=true` only for local emulator development.
3. Start the Firebase emulators for Auth and Firestore.
4. Run `npm run seed:test` to import the collections and create matching Auth users.

The seed script uses a shared emulator password so the test accounts can sign in after import.

## Firebase Hosting

For global hosting, set your real Firebase project values in `.env.local`, then build with `npm run build`.
The app is set up as a Vite single-page app, so Firebase Hosting should rewrite all routes to `index.html`.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

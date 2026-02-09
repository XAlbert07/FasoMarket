# Deploiement Vercel + PWA (FasoMarket)

## Prerequis
- Un compte Vercel
- Un projet Supabase actif
- Ces variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 1) Pousser le code
```bash
git add -A
git commit -m "Preparation deploiement PWA"
git push
```

## 2) Creer le projet sur Vercel
1. Aller sur Vercel -> `New Project`
2. Importer le repo `FasoMarket`
3. Framework detecte: `Vite`
4. Build command: `npm run build`
5. Output directory: `dist`

## 3) Configurer les variables d'environnement
Dans Vercel -> Project -> `Settings` -> `Environment Variables`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Ensuite redeployer.

## 4) Verifier la PWA en production
Verifier ces URLs:
- `/manifest.webmanifest`
- `/sw.js`
- `/offline.html`
- `/.well-known/assetlinks.json`

Dans Chrome mobile:
1. Ouvrir le site
2. Verifier qu'il est installable (Ajouter a l'ecran d'accueil)
3. Installer la web app
4. Couper internet et tester une route pour voir le fallback hors-ligne

## 5) Verification fonctionnelle minimale
- Connexion / inscription
- Recherche annonces
- Detail annonce
- Favoris
- Publication annonce

## 6) Passage Play Store (TWA)
Utiliser:
- `docs/pwa-twa-playstore-checklist.md`
- `twa-manifest.template.json`
- Script `npm run assetlinks:generate`

Avant TWA, remplacer le placeholder dans:
- `public/.well-known/assetlinks.json`

avec le vrai `package_name` Android et la vraie empreinte `SHA-256`.

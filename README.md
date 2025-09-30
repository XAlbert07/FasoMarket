# FasoMarket

**Une marketplace locale moderne pour connecter vendeurs et acheteurs au Burkina Faso**

FasoMarket est une plateforme de petites annonces spécialement conçue pour le marché burkinabé, permettant aux utilisateurs de publier, rechercher et échanger des biens et services dans un environnement sécurisé et intuitif.

##  Vision du projet

FasoMarket répond au besoin croissant d'une plateforme de commerce local moderne au Burkina Faso, offrant une alternative numérique aux méthodes traditionnelles de vente et d'achat. L'objectif est de créer un écosystème où chaque burkinabé peut facilement vendre ce qu'il possède ou trouver ce qu'il recherche.

##  Fonctionnalités principales

### Pour les vendeurs
- **Publication d'annonces simplifiée** avec téléchargement multiple d'images
- **Gestion complète des annonces** : modification, pause, suppression via un dashboard dédié
- **Contact direct** : les acheteurs peuvent appeler directement ou utiliser la messagerie intégrée
- **Système de statistiques** : suivi des vues, des contacts et de la performance des annonces

### Pour les acheteurs  
- **Recherche intelligente** par mots-clés, catégories et localisation (villes)
- **Système de favoris** pour sauvegarder les annonces intéressantes
- **Messagerie intégrée** pour négocier directement avec les vendeurs
- **Filtrages avancés** par prix, état du produit, et proximité géographique

### Système d'avis intelligent
- **Validation des avis** : seuls les utilisateurs ayant échangé des messages avec le vendeur peuvent laisser un avis
- **Crédibilité renforcée** : garantit que les évaluations proviennent d'interactions réelles
- **Protection contre le spam** : empêche les faux avis non fondés

### Administration et sécurité
- **Tableau de bord administrateur** pour la modération de contenu
- **Système de signalement** pour maintenir la qualité de la plateforme
- **Gestion des utilisateurs** avec sanctions graduelles si nécessaire

## 🛠️ Technologies utilisées

### Frontend
- **React 18** - Interface utilisateur moderne et réactive
- **TypeScript** - Développement robuste avec typage statique
- **Tailwind CSS** - Design system responsive et moderne
- **Shadcn/UI** - Composants d'interface élégants et accessibles
- **React Router Dom** - Navigation fluide entre les pages
- **React Hook Form** - Gestion optimisée des formulaires

### Backend et Base de données
- **Supabase** - Backend-as-a-Service avec base de données PostgreSQL
- **Authentification Supabase** - Système de connexion sécurisé
- **Storage Supabase** - Hébergement optimisé des images

### Outils de développement
- **Vite** - Bundler rapide pour le développement
- **TanStack Query** - Gestion intelligente des données et du cache
- **Zod** - Validation des schémas de données
- **Date-fns** - Manipulation des dates
- **Lucide React** - Iconographie moderne

## 🚀 Installation et développement

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Compte Supabase pour la base de données

### Installation
```bash
# Cloner le repository
git clone [URL_DU_REPOSITORY]
cd fasomarket

# Installer les dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Remplir les variables d'environnement Supabase dans .env
```

### Variables d'environnement requises
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_publique_supabase
```

### Lancement en mode développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`

### Construction pour la production
```bash
npm run build
```

## 📱 Adaptation au marché burkinabé

### Fonctionnalités locales
- **Recherche par ville** : Ouagadougou, Bobo-Dioulasso, Koudougou, et autres villes du pays
- **Devise locale** : Prix affichés en Francs CFA (XOF)
- **Contact téléphonique direct** : Intégration WhatsApp pour faciliter les échanges
- **Interface multilingue** : Français avec possibilité d'extension en langues locales

### Considérations culturelles
- **Négociation encouragée** : Interface conçue pour faciliter les discussions de prix
- **Relations humaines** : Mise en avant du contact direct entre vendeur et acheteur
- **Confiance communautaire** : Système d'avis basé sur les interactions réelles

## 🏗️ Architecture du projet

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants de base (boutons, inputs, etc.)
│   └── ...             # Composants métier (Header, Footer, etc.)
├── contexts/           # Contextes React (Authentification, etc.)
├── hooks/              # Hooks personnalisés pour la logique métier
├── lib/                # Configuration et utilitaires
├── pages/              # Pages principales de l'application
│   └── admin/          # Interface d'administration
├── types/              # Définitions TypeScript
└── assets/             # Images et ressources statiques
```

## 👥 Rôles et permissions

### Utilisateur standard (Merchant)
- Publication et gestion d'annonces
- Messagerie avec autres utilisateurs
- Consultation des statistiques personnelles

### Administrateur
- Modération de contenu
- Gestion des signalements
- Tableau de bord des statistiques globales
- Administration des utilisateurs

## 🔧 Scripts disponibles

- `npm run dev` - Démarrage du serveur de développement
- `npm run build` - Construction de l'application pour la production
- `npm run build:dev` - Construction en mode développement
- `npm run lint` - Vérification du code avec ESLint
- `npm run preview` - Aperçu de la version de production

## 🚀 Déploiement

Le projet est configuré pour être déployé facilement sur Vercel, Netlify, ou tout autre service d'hébergement statique moderne.

### Déploiement sur Vercel (recommandé)
```bash
# Installation de Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod
```

##  Contribution

Ce projet suit les bonnes pratiques de développement modernes :
- Code TypeScript strict
- Tests de composants
- Linting ESLint
- Architecture modulaire et maintenable

Pour contribuer au projet, veuillez suivre les conventions de code existantes et soumettre vos pull requests avec une description détaillée.

## 📞 Support et contact

Pour toute question technique ou suggestion d'amélioration, n'hésitez pas à ouvrir une issue sur ce repository.

## 📄 Licence

Ce projet est développé pour servir la communauté burkinabé et faciliter les échanges commerciaux locaux.

---

**FasoMarket** - Connecter le Burkina Faso, une annonce à la fois.
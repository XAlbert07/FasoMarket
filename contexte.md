# Contexte de passation - FasoMarket (Refonte UI/UX)

## 1) Objectif global
Le projet est en **refonte UI/UX majeure** pour sortir d'un rendu jugé trop générique et atteindre un niveau plus premium/professionnel (références mentionnées: Leboncoin, Vercel, Stripe).

Demandes utilisateur explicites:
- Moins de couleurs agressives et moins de gradients.
- Hero sans image de fond générique.
- Typographie plus crédible/premium.
- Structure des annonces plus lisible et cohérente.
- Cohérence visuelle globale sur les pages principales.

## 2) Direction retenue (déjà validée par l'utilisateur)
- Style: sobre, institutionnel, clair, orienté conversion.
- Palette: neutres dominants + accents maîtrisés.
- Gradients: fortement réduits, usage discret.
- Typographie: `Plus Jakarta Sans` (titres) + `IBM Plex Sans` (texte).
- Cartes annonces: structure unifiée (image, titre, prix, lieu/date, vendeur, catégorie, vues, CTA, favori selon contexte).

## 3) État actuel du code (ce qui est déjà fait)

### 3.1 Fondations design system
- Fonts Google remplacées dans `index.html`.
- Familles Tailwind mises à jour.
- Tokens couleurs/ombres/gradients adoucis.
- Variantes boutons `hero/cta` rendues moins “gadget”.

Fichiers:
- `index.html`
- `tailwind.config.ts`
- `src/index.css`
- `src/components/ui/button.tsx`

### 3.2 Home refondue
- `Index` pointe vers une nouvelle home premium.
- Hero textuel sans image de fond, preuve de confiance, recherche centrale, catégories prioritaires, vitrine annonces, CTA vendeur.

Fichiers:
- `src/pages/Index.tsx`
- `src/components/home/PremiumHome.tsx`

### 3.3 Header + Footer refondus
- Header visuellement modernisé, logique auth/recherche/menu conservée.
- Footer simplifié, plus institutionnel et lisible.

Fichiers:
- `src/components/Header.tsx`
- `src/components/Footer.tsx`

### 3.4 Standardisation des cartes annonces (important)
Création d'une carte réutilisable + migration des pages principales:
- Nouveau composant standard: `src/components/listings/ListingCard.tsx`
- Nouveau composant propriétaire (gestion annonces perso): `src/components/listings/OwnerListingCard.tsx`
- Nouveau composant admin (modération annonces): `src/components/listings/AdminListingCard.tsx`

Pages migrées vers la grammaire unifiée:
- `src/pages/Listings.tsx`
- `src/pages/Favorites.tsx`
- `src/pages/CategoryListings.tsx`
- `src/components/home/PremiumHome.tsx` (section vitrine)
- `src/components/RecentListings.tsx`
- `src/pages/SellerProfile.tsx` (onglet annonces)
- `src/pages/MyListings.tsx` (avec `OwnerListingCard`)
- `src/pages/MerchantDashboard.tsx` (overview + onglet annonces harmonisés)
- `src/pages/admin/components/ListingsTab.tsx` (vue cartes mobile harmonisée via `AdminListingCard`)
- `src/pages/admin/components/StatsCards.tsx` (blocs KPI adoucis et plus sobres)
- `src/pages/admin/components/ OverviewTab.tsx` (état de santé/actions/métriques harmonisés, gradients réduits)
- `src/pages/admin/components/ReportsTab.tsx` (surfaces/badges/actions harmonisés, lisibilité renforcée)
- `src/pages/admin/components/UsersTab.tsx` (KPI, cartes et tableau harmonisés, palette neutralisée, suppression des notions `score confiance`/`risque`)
- `src/pages/admin/components/AnalyticsTab.tsx` (Insights aligné sur données observables, suppression des valeurs aléatoires et libellés de risque simulés)
- `src/pages/admin/components/OverviewTab.tsx` (suppression des affichages “score santé”, remplacement par état opérationnel basé sur backlog/urgences)
- `src/pages/admin/components/HealthIndicators.tsx` (refonte complète sans score composite, uniquement KPI factuels)
- `src/pages/admin/components/StatsCards.tsx` (suppression des priorités visuelles et badges d'état, passage à des indicateurs factuels)
- `src/pages/admin/components/AlertsSection.tsx` (suppression des niveaux critique/alerte visuels, centre d'alertes simplifié et sobre)
- Harmonisation éditoriale des pages `/admin/*` (terminologie unifiée en français: navigation, titres, sous-titres, libellés d'actions)
- Simplification forte de `Gestion des annonces` (suppression des fonctions jugées non essentielles: score/risque/vedette/report-action secondaire)

### 3.5 Nouvelle structure Admin v2 (routing + shell)
Nouvelle architecture admin en place:
- `/admin/moderation`
- `/admin/users`
- `/admin/listings`
- `/admin/compliance`
- `/admin/insights`

Implémentation:
- Nouveau layout: `src/pages/admin/AdminLayoutV2.tsx`
- Nouvelles pages:
  - `src/pages/admin/ModerationPage.tsx`
  - `src/pages/admin/UsersPage.tsx`
  - `src/pages/admin/ListingsPage.tsx`
  - `src/pages/admin/CompliancePage.tsx`
  - `src/pages/admin/InsightsPage.tsx`

Rétrocompatibilité:
- `/admin-dashboard` redirige maintenant vers `/admin/moderation`.

### 3.6 Moderation v2 (premier MVP fonctionnel)
`/admin/moderation` n'est plus un simple wrapper de `ReportsTab`.
La page contient désormais:
- Une queue unifiée (signalements + annonces + utilisateurs) avec priorisation.
- Une queue unifiée (signalements + annonces + utilisateurs).
- Filtres `type/statut` + recherche globale.
- Panneau détail latéral avec actions rapides métier:
  - report: `approve`, `dismiss`
  - listing: `suspend_listing`, `approve`
  - user: `suspend`, `verify`
- Liens directs vers les fiches (`listing` et `seller-profile` selon type).
- Sélection multiple + actions de masse:
  - `Bulk Valider`
  - `Bulk Suspendre`
- Historique des décisions affiché dans le panneau détail + persistance locale (`localStorage`).
- Persistance désormais en mode **DB-first**:
  - tentative de lecture/écriture via table `admin_moderation_events`
  - fallback automatique sur `localStorage` si la table n'existe pas / erreur DB
  - indicateur UI affiché quand fallback local actif
- Nettoyage UX demandé:
  - suppression des éléments simulés `SLA` (badges + KPI)
  - suppression des badges de priorité (`Haute/Moyenne/Faible`)
  - labels de queue en français métier (`Utilisateur/Annonce/Signalement`)
  - raison utilisateur rendue explicite (ex: nombre de signalements, score confiance bas, suspension datée)
- action utilisateur contextualisée:
    - suppression de l'action `Approuver le profil` (hors scope produit actuel)
    - `Réactiver le compte` uniquement pour `suspended`
    - suppression du libellé ambigu `Valider le compte`
  - action annonce contextualisée:
    - `Suspendre` pour annonce active
    - `Réactiver l'annonce` pour annonce suspendue
  - bulk aligné modération d'état:
    - `Bulk Réactiver`
    - `Bulk Suspendre`
- assignation simplifiée:
    - suppression complète de l'assignation dans la queue moderation (pas de valeur produit actuelle)
  - `pending` conservé uniquement comme statut de signalement (workflow reports)
  - suppression des notions `Score confiance` et `Risque` dans la section utilisateurs admin (KPI/cartes/tableau)
  - section Insights: suppression des valeurs générées aléatoirement (`sessions/messages/temps de modération`) et des badges de “risque” non métier
  - section Overview: retrait des blocs “score santé” et simplification sur métriques actionnables (`urgences`, `signalements en attente`, `charge modération`)
  - composant HealthIndicators: suppression des recommandations automatiques et niveaux de santé composés
  - StatsCards/AlertsSection: retrait des codes visuels “critical/warning/urgent” (animations, gradients, badges de sévérité), conservation de compteurs + CTA
  - Harmonisation des textes admin: "Modération", "Conformité", "Analyses", libellés d'actions en masse, titres/sous-titres cohérents
  - Listings admin: retrait des filtres/colonnes `Risque` et `Qualité`, retrait des actions `vedette`, retrait du modal d'action basé signalement, focus sur actions de modération utiles

## 4) Validation technique actuelle
- Les builds ont été lancés plusieurs fois pendant la refonte.
- **Statut: `npm run build` passe** sur l'état courant.

Important:
- Le projet a une dette lint ancienne et large (pas introduite par cette refonte uniquement).
- L'objectif ici a été la refonte UI/UX et la cohérence visuelle, pas l'assainissement complet ESLint.

## 5) Fichiers modifiés (zone de travail principale)
- `index.html`
- `tailwind.config.ts`
- `src/index.css`
- `src/components/ui/button.tsx`
- `src/pages/Index.tsx`
- `src/components/home/PremiumHome.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/listings/ListingCard.tsx`
- `src/components/listings/OwnerListingCard.tsx`
- `src/components/listings/AdminListingCard.tsx`
- `src/pages/admin/components/ OverviewTab.tsx`
- `src/pages/admin/components/ReportsTab.tsx`
- `src/pages/admin/components/UsersTab.tsx`
- `src/pages/admin/AdminLayoutV2.tsx`
- `src/pages/admin/ModerationPage.tsx`
- `src/pages/admin/UsersPage.tsx`
- `src/pages/admin/ListingsPage.tsx`
- `src/pages/admin/CompliancePage.tsx`
- `src/pages/admin/InsightsPage.tsx`
- `src/App.tsx` (routing admin v2)
- `src/pages/admin/ModerationPage.tsx` (MVP queue unifiée)
- `src/pages/admin/ModerationPage.tsx` (queue unifiée + bulk + SLA + historique local)
- `src/pages/admin/ModerationPage.tsx` (queue unifiée + bulk + SLA + historique/assignee persistés localement)
- `src/pages/admin/ModerationPage.tsx` (queue unifiée + bulk + SLA + historique/assignee DB-first avec fallback local)
- `src/pages/admin/components/UsersTab.tsx` (suppression trust/risk dans UI)
- `src/pages/admin/components/AnalyticsTab.tsx` (suppression indicateurs simulés dans Insights)
- `src/pages/admin/components/OverviewTab.tsx` (suppression score santé composite dans l'UI)
- `src/pages/admin/components/HealthIndicators.tsx` (version factuelle, sans scoring)
- `src/pages/admin/components/StatsCards.tsx` (version factuelle, sans priorités décoratives)
- `src/pages/admin/components/AlertsSection.tsx` (centre d'alertes simplifié et neutre)
- `src/pages/admin/AdminLayoutV2.tsx` (navigation et en-tête harmonisés)
- `src/pages/admin/UsersPage.tsx` (titre et description harmonisés)
- `src/pages/admin/ListingsPage.tsx` (titre et description harmonisés)
- `src/pages/admin/CompliancePage.tsx` (titre, sous-titres et CTA harmonisés)
- `src/pages/admin/InsightsPage.tsx` (titre et description harmonisés)
- `src/pages/admin/components/AnalyticsTab.tsx` (intitulés de sections harmonisés)
- `src/pages/admin/ModerationPage.tsx` (libellés file/actions de masse harmonisés)
- `src/pages/admin/components/ListingsTab.tsx` (version épurée et orientée modération utile)
- `src/components/listings/AdminListingCard.tsx` (suppression badges/actions qualité-risque-vedette)
- `src/pages/admin/ListingsPage.tsx` (suppression props/listings metrics non essentielles)
- `Action avancée` retirée de la section annonces (carte + tableau) ; actions directes conservées: voir, suspendre, réactiver
- Refonte structurelle de `ListingsTab`:
  - suppression des cartes KPI volumineuses et des blocs redondants
  - passage a une liste compacte (Annonce, Statut, Date, Actions)
  - panneau de details lateral (infos complementaires uniquement)
  - filtres reduits a recherche + statut + periode
  - actions modération centrées: suspendre, reactiver, supprimer
  - ajout de la sélection multiple + actions en masse (suspendre, réactiver, supprimer) branchées sur `handleListingAction`
- `src/pages/Listings.tsx`
- `src/pages/Favorites.tsx`
- `src/pages/CategoryListings.tsx`
- `src/components/RecentListings.tsx`
- `src/pages/SellerProfile.tsx`
- `src/pages/MyListings.tsx`
- `src/pages/MerchantDashboard.tsx`

Dernière validation:
- Build production relancé avec succès (`npm run -s build`).

## 10) Correctif critique appliqué (cohérence suspension)
- Problème observé: une annonce suspendue depuis l’admin pouvait encore rester accessible via URL directe sur la page détail.
- Correctif implémenté:
  - `src/components/SmartListingDetail.tsx`: garde d’accès public.
  - Règle: non-propriétaire => accès autorisé uniquement si `listing.status === 'active'`.
  - Résultat: une annonce suspendue/indisponible affiche désormais un état "Annonce indisponible" au lieu du détail public.
- Robustesse UI admin renforcée:
  - `src/pages/admin/components/ListingsTab.tsx`: le bouton `Confirmer` du modal n’auto-ferme plus en cas d’échec (prévention fermeture native de `AlertDialogAction`).
  - Ajout de toasts explicites quand `0` action DB réussie (single/bulk), pour éviter tout faux positif visuel.
- Robustesse backend action admin renforcée:
  - `src/hooks/useAdminDashboard.ts` (`handleListingAction`): la mise à jour d’annonce vérifie maintenant qu’au moins une ligne est réellement modifiée (`.update(...).select('id')` + contrôle `updatedRows.length`).
  - Si `0` ligne mise à jour (cas fréquent en RLS sans policy update), l’action retourne en erreur au lieu d’être comptée comme succès.
  - Contrôle additionnel: vérification du `status` renvoyé après update (`active`/`suspended` attendu selon l’action), sinon erreur explicite.
- Alignement modération/listings:
  - `src/pages/admin/components/ListingsTab.tsx`: la suspension depuis la section annonces est alignée sur la logique de Modération (pas de durée imposée côté UI), pour supprimer la divergence de comportement observée entre les deux écrans.
  - `src/pages/admin/ModerationPage.tsx`: actions listing harmonisées avec la section annonces (mêmes libellés/icônes et mêmes raisons envoyées pour `suspend_listing` / `unsuspend`).
  - `src/hooks/useAdminDashboard.ts` (`handleListingAction`): correction d'une régression de validation post-update.
  - La validation ne dépend plus de `update(...).select(...)` (peut être incohérent selon policies RLS) et se fait après `refreshListings` sur l'état central rechargé.

## 11) Refonte Conformité (phase structurelle)
- `Conformité` devient la page opérationnelle unique pour les sanctions:
  - suppression du pattern "page relais" avec bouton vers `/sanctions`
  - intégration d'une vue complète directement dans `src/pages/admin/CompliancePage.tsx` (KPI + filtres + table + panneau détail/actions + modal d'action)
- Synchronisation admin unifiée:
  - ajout d'un provider partagé `src/pages/admin/AdminDashboardContext.tsx`
  - `src/pages/admin/AdminLayoutV2.tsx` encapsule désormais toutes les sous-pages avec `AdminDashboardProvider`
  - pages `Moderation`, `Users`, `Listings`, `Compliance`, `Insights` consomment la même instance via `useSharedAdminDashboard`
- Rétrocompatibilité route:
  - `/sanctions` redirige maintenant vers `/admin/compliance` dans `src/App.tsx`
- Nettoyage:
  - suppression du fichier legacy `src/pages/admin/components/SanctionsManagementPage.tsx` (remplacé définitivement par `src/pages/admin/CompliancePage.tsx`)
- Build validé après refonte (`npm run -s build`).

## 12) Refonte Insights (orientation décision)
- `src/pages/admin/components/AnalyticsTab.tsx` refondu:
  - suppression des éléments composites/décoratifs (score santé, funnel estimé, sections peu actionnables)
  - nouveau focus opérationnel: KPI utiles, tendance hebdo réelle, catégories à risque (taux signalements), top vendeurs signalés
  - remplacement de la métrique `Temps moyen de réponse` par `Visiteurs annonces (7j)` calculé sur la table `listing_views` (comptage des `visitor_id` uniques sur 7 jours)
- `src/pages/admin/InsightsPage.tsx` simplifié pour ne passer que les props réellement exploitées (`dashboardStats`, `weeklyData`, `users`, `listings`, `reports`)
- Build validé après refonte (`npm run -s build`).

## 6) Ce qu'il reste à faire (priorité haute)

### 6.1 Continuer la cohérence cartes annonces
Cible restante principale: finaliser l'harmonisation des écrans admin restants (`src/pages/admin/...`), surtout:
- `src/pages/admin/components/HealthIndicators.tsx`
- `src/pages/admin/components/AlertsSection.tsx`
- `src/pages/admin/components/DashboardHeader.tsx`
- Affiner le flux de décision de `ModerationPage` (bulk actions, historique, statuts).
- Remplacer la persistance locale (`localStorage`) par persistance DB (table audit).
- Créer officiellement la table `admin_moderation_events` côté base et les policies RLS adaptées pour supprimer le fallback local.

Approche recommandée:
- Réutiliser `ListingCard` partout où possible.
- Si workflow propriétaire/admin différent: créer variantes dédiées (comme `OwnerListingCard` et `AdminListingCard`) mais garder la même hiérarchie visuelle.

### 6.2 Polish visuel final
- Vérifier densité/espacements/alignements sur mobile et desktop.
- Uniformiser badges, ombres, bordures sur tous les écrans critiques.
- Vérifier que les CTA ne redeviennent pas trop “marketing”.

### 6.3 QA fonctionnelle rapide après migration
- Vérifier favoris (ajout/retrait) sur chaque page migrée.
- Vérifier liens vers détail annonce.
- Vérifier menus actions propriétaire (pause/reprise/edit/delete) dans `MyListings`.
- Vérifier filtres/search dans `Listings` et `CategoryListings`.
- Vérifier actions admin dans `ListingsTab` (suspendre/reactiver/vedette + modales).
- Vérifier flux de modération dans `ReportsTab` (approve/dismiss/sanction + modales).
- Vérifier actions suspension/réactivation et chat admin dans `UsersTab`.
- Vérifier la navigation complète `/admin/*` et ajuster les libellés/accroches pour la version finale.

## 7) Contraintes/intentions à respecter
- Garder le style sobre/premium validé, ne pas revenir à des gradients intenses.
- Garder l'approche “lisibilité d'abord” pour les cartes.
- Ne pas casser les logiques métier auth/favoris/seller/admin.
- Préférer composants réutilisables à la duplication.

## 8) Commandes utiles
```bash
npm run build
npm run dev
npm run lint
```

## 9) Note importante pour la prochaine IA
La conversation a explicitement demandé une refonte premium et cohérente. Le point central n'est pas juste “joli”, mais:
1. crédibilité produit,
2. cohérence inter-pages,
3. lisibilité et conversion.

La base est posée. Le travail restant est surtout:
- généraliser la même qualité aux derniers écrans non harmonisés,
- faire le polish final sans casser les comportements métier.

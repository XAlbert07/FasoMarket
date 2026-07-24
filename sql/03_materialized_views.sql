-- ============================================================
-- SCRIPT 3 : VUES MATÉRIALISÉES — Stats admin
-- Exécuter en troisième dans Supabase SQL Editor
-- Vérifié contre le schéma réel le 2026-07-24
--
-- Tables référencées et colonnes vérifiées :
--   profiles : id, full_name, email, phone, avatar_url, created_at, updated_at, location, bio
--   listings : id, title, price, currency, status, category_id, user_id, created_at, updated_at, views_count
--   reviews  : id, rating, comment, reviewer_id, seller_id, listing_id, created_at
--   reports  : id, reporter_id, user_id, listing_id, created_at
--   favorites: id, user_id, listing_id
--
-- Colonnes INEXISTANTES retirées :
--   profiles.last_activity (n'existe PAS — le code utilise updated_at || created_at)
--   listings.is_suspended (n'existe PAS — le statut est dans status = 'suspended')
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS mv_user_stats;
DROP MATERIALIZED VIEW IF EXISTS mv_listing_stats;

-- Vue matérialisée : stats agrégées des utilisateurs
CREATE MATERIALIZED VIEW mv_user_stats AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.email,
  p.phone,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.location,
  p.bio,
  p.role,
  -- Stats annonces
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') AS active_listings_count,
  COUNT(DISTINCT l.id) AS total_listings_count,
  COALESCE(SUM(l.views_count) FILTER (WHERE l.status = 'active'), 0) AS total_views_received,
  -- Stats signalements
  COUNT(DISTINCT rmade.id) AS reports_made,
  COUNT(DISTINCT rrecv.id) AS reports_received,
  -- Stats avis (via seller_id direct sur reviews, SANS passer par listings)
  COUNT(DISTINCT rv.id) AS reviews_received_count,
  COALESCE(AVG(rv.rating), 0) AS avg_rating
FROM profiles p
LEFT JOIN listings l ON l.user_id = p.id
LEFT JOIN reports rmade ON rmade.reporter_id = p.id
LEFT JOIN reports rrecv ON rrecv.user_id = p.id
LEFT JOIN reviews rv ON rv.seller_id = p.id
GROUP BY p.id;

CREATE UNIQUE INDEX idx_mv_user_stats_user_id ON mv_user_stats(user_id);

-- Vue matérialisée : stats agrégées des annonces
CREATE MATERIALIZED VIEW mv_listing_stats AS
SELECT
  l.id AS listing_id,
  l.title,
  l.price,
  l.currency,
  l.status,
  l.category_id,
  l.user_id,
  l.created_at,
  l.updated_at,
  l.views_count,
  -- Stats favoris
  COUNT(DISTINCT f.id) AS favorites_count,
  -- Stats avis
  COUNT(DISTINCT rv.id) AS reviews_count,
  COALESCE(AVG(rv.rating), 0) AS avg_rating
FROM listings l
LEFT JOIN favorites f ON f.listing_id = l.id
LEFT JOIN reviews rv ON rv.listing_id = l.id
GROUP BY l.id;

CREATE UNIQUE INDEX idx_mv_listing_stats_listing_id ON mv_listing_stats(listing_id);

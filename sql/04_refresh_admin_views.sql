-- ============================================================
-- SCRIPT 4 : FONCTION DE RAFRAÎCHISSEMENT DES VUES
-- Exécuter en quatrième dans Supabase SQL Editor
-- Vérifié le 2026-07-24
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_admin_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_listing_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- OPTIONNEL : Planification automatique via pg_cron
-- Activer l'extension pg_cron dans Dashboard → Database → Extensions
-- puis décommenter ci-dessous :
-- ============================================================
-- SELECT cron.schedule(
--   'refresh-admin-views',
--   '*/5 * * * *',
--   $$SELECT refresh_admin_views()$$
-- );

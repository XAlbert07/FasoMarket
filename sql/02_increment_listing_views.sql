-- ============================================================
-- SCRIPT 2 : FONCTION RPC — Incrément atomique de vues
-- Exécuter en deuxième dans Supabase SQL Editor
-- Vérifié : le code appelle déjà .rpc('increment_listing_views', { listing_id: listingId })
--           (useListingViews.ts ligne 204) avec fallback sur update simple si la RPC échoue
-- Paramètre : listing_id (UUID) — PAS p_listing_id
-- ============================================================

CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

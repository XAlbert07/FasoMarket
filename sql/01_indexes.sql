-- ============================================================
-- SCRIPT 1 : INDEX D'OPTIMISATION
-- Exécuter en premier dans Supabase SQL Editor
-- Vérifié contre le schéma réel le 2026-07-24
-- ============================================================

-- messages : accélère les requêtes conversations (OR sender/receiver + filtre type + tri date)
CREATE INDEX IF NOT EXISTS idx_messages_conversations
ON messages (message_type, created_at DESC)
WHERE message_type = 'user';

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver
ON messages (sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender
ON messages (receiver_id, sender_id, created_at DESC);

-- favorites : accélère le batch enrichissement (IN user_id + IN listing_id)
CREATE INDEX IF NOT EXISTS idx_favorites_user_listing
ON favorites (user_id, listing_id);

-- listing_views : colonne = viewed_at (PAS created_at)
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_viewed
ON listing_views (listing_id, viewed_at DESC);

-- user_presence : lookup fréquent par user_id
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id
ON user_presence (user_id);

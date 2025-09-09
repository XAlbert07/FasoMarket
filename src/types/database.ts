// ========================================
// FASOMARKET - BASE DE DONNÉES TYPE-SAFE
// ========================================

// ========================================
// TABLES ACTUELLES
// ========================================

export interface Profile {
  id: string; // auth.users.id
  email: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null; // Nouveau champ ajouté
  location: string | null; // Nouveau champ ajouté
  avatar_url: string | null; // Nouveau champ ajouté
  role: 'merchant' | 'admin'; // Seuls ces deux rôles
  created_at: string;
  updated_at: string | null;
}

export interface Category {
  id: string; // UUID
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: string; // UUID
  user_id: string; // UUID
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  status: 'active' | 'sold' | 'expired' | 'suspended';
  images: string[];
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  expires_at: string | null;

  profiles?: {
    full_name: string | null;
    phone: string | null;
    email: string;
  };
  categories?: {
    name: string;
    icon: string | null;
    slug: string;
  };
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;

  sender?: { full_name: string | null; email: string };
  receiver?: { full_name: string | null; email: string };
  listing?: { title: string; price: number; currency: string; images: string[] };
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
}

export interface Report {
  id: string;
  listing_id: string | null;
  user_id: string | null;
  reporter_id: string | null; // Maintenant optionnel
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  
  // Nouveaux champs pour les signalements invités
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  report_type: 'listing' | 'profile';

  
  listing?: { title: string; user_id: string; status: string };
  reported_user?: { full_name: string | null; email: string };
  reporter?: { full_name: string | null; email: string };
}

// ========================================
// TABLES FUTURES (V2)
// ========================================

export interface Review {
  id: string;
  merchant_id: string;
  reviewer_id: string;
  listing_id: string | null;
  rating: number;
  comment: string | null;
  transaction_confirmed: boolean;
  status: 'active' | 'hidden' | 'reported';
  created_at: string;
  updated_at: string;

  merchant?: { full_name: string | null; email: string };
  reviewer?: { full_name: string | null };
  listing?: { title: string; price: number };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'listing_expired' | 'account_warning' | 'system' | 'review_received';
  title: string;
  content: string;
  read: boolean;
  action_url: string | null;
  related_id: string | null;
  created_at: string;
  expires_at: string | null;

  user?: { full_name: string | null; email: string };
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string | null;
  seller_id: string;
  amount: number;
  currency: string;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'other';
  status: 'pending' | 'completed' | 'cancelled' | 'disputed';
  transaction_date: string;
  created_at: string;
  updated_at: string;

  listing?: { title: string; price: number };
  buyer?: { full_name: string | null; email: string };
  seller?: { full_name: string | null; email: string };
}

// ========================================
// CONSTANTES
// ========================================

export const USER_ROLES = { MERCHANT: 'merchant', ADMIN: 'admin' } as const;
export const LISTING_STATUS = { ACTIVE: 'active', SOLD: 'sold', EXPIRED: 'expired', SUSPENDED: 'suspended' } as const;
export const LISTING_CONFIG = { MAX_IMAGES: 8, MAX_TITLE_LENGTH: 100, MAX_DESCRIPTION_LENGTH: 2000, DEFAULT_CURRENCY: 'CFA', EXPIRY_DAYS: 30 } as const;

export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: 'new' | 'used' | 'refurbished';
  sortBy?: 'date' | 'price_asc' | 'price_desc' | 'views';
}

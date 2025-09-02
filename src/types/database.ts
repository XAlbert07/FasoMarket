export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  condition: 'new' | 'used';
  phone: string;
  images: string[];
  status: 'active' | 'pending' | 'sold' | 'inactive';
  views: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  featured_until?: string;
  latitude?: number;
  longitude?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string;
  created_at: string;
}

export interface ListingView {
  id: string;
  listing_id: string;
  user_id?: string;
  ip_address: string;
  viewed_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: 'new' | 'used';
  sortBy?: 'date' | 'price_asc' | 'price_desc' | 'views';
  radius?: number;
  latitude?: number;
  longitude?: number;
}
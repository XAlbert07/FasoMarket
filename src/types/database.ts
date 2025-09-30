// types/database.ts

// ========================================
// TYPES DE BASE 
// ========================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  role: 'merchant' | 'admin';
  created_at: string;
  updated_at: string | null;
}


export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category_id: string;
  user_id: string;
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
  
  // ========================================
  // PROPRIÉTÉS POUR LA GESTION DES SUSPENSIONS
  // ========================================
  suspension_type: 'admin' | 'user' | 'system' | null;
  suspended_until: string | null;
  suspension_reason: string | null;
  suspended_by: string | null;
  
  // ========================================
  // PROPRIÉTÉS RELATIONNELLES (JOINTURES) 
  // ========================================
  
  /**
   * Informations du profil utilisateur (propriétaire de l'annonce)
   * Cette propriété est ajoutée par enrichissement dans les hooks
   */
  profiles?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
  } | null;
  
  /**
   * Informations de la catégorie (chargée via jointure ou enrichissement)
   */
  categories?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    description: string | null;
  } | null;
  
  /**
   * Nom de la catégorie pour la compatibilité avec l'ancien code
   * Ajouté par enrichissement ou par défaut
   */
  category?: string;
  
  // ========================================
  // MÉTADONNÉES OPTIONNELLES
  // ========================================
  favorites_count?: number;
  messages_count?: number;
  is_favorited?: boolean;
  popularity_score?: number;
}


export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}





export interface Report {
  id: string;
  listing_id: string | null;
  user_id: string | null;
  reporter_id: string | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  
  // Support des signalements invités
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  report_type: 'listing' | 'profile';
}



  // Interface pour les données brutes de recherche stockées en base
  //Chaque recherche effectuée par un utilisateur est enregistrée ici
 
export interface SearchAnalytics {
  id: string;
  // Données de la recherche
  search_query: string; // Terme exact saisi par l'utilisateur
  normalized_query: string; // Version normalisée pour l'analyse
  location_query: string | null; // Lieu recherché (optionnel)
  
  // Métadonnées utilisateur
  user_id: string | null; // Null pour les recherches anonymes
  session_id: string | null; // ID de session pour tracer les recherches anonymes
  user_agent: string | null; // Informations navigateur
  ip_address: string | null; // Adresse IP pour les stats géographiques
  
  // Contexte de la recherche
  source_page: string; // 'hero', 'header', 'listings', etc.
  category_filter: string | null; // Catégorie sélectionnée
  has_results: boolean; // Est-ce que la recherche a retourné des résultats
  results_count: number; // Nombre de résultats trouvés
  
  // Comportement utilisateur
  clicked_result: boolean; // L'utilisateur a-t-il cliqué sur un résultat
  clicked_listing_id: string | null; // Quelle annonce a été cliquée
  time_on_results: number | null; // Temps passé sur les résultats (secondes)
  
  // Horodatage
  created_at: string;
}

/**
 * Interface pour les données de recherches populaires
 * Vue calculée basée sur les analytics de recherche
 */
export interface PopularSearch {
  normalized_query: string; // Clé unique pour la recherche
  display_query: string; // Version d'affichage (avec majuscules, etc.)
  total_searches: number; // Nombre total de fois recherché
  unique_users: number; // Nombre d'utilisateurs uniques
  unique_sessions: number; // Nombre de sessions uniques
  avg_results: number; // Nombre moyen de résultats
  clicks: number; // Nombre de clics sur les résultats
  popularity_score: number; // Score calculé de popularité
  last_searched_at: string; // Dernière fois recherché
  first_searched_at: string; // Première fois recherché
}

/**
 * Interface pour les données à envoyer lors d'une nouvelle recherche
 * Version simplifiée pour l'insertion
 */
export interface SearchTrackingData {
  search_query: string;
  location_query?: string;
  user_id?: string;
  session_id?: string;
  source_page?: 'hero' | 'header' | 'listings' | 'category' | 'other';
  category_filter?: string;
  user_agent?: string;
  // Les autres champs seront calculés automatiquement
}

/**
 * Interface pour les résultats de recherche enrichis
 * Utilisée quand on veut tracker les interactions avec les résultats
 */
export interface SearchResultsData {
  analytics_id: string; 
  has_results: boolean;
  results_count: number;
  clicked_result?: boolean;
  clicked_listing_id?: string;
  time_on_results?: number;
}

// ========================================
// TYPES POUR LES HOOKS ET COMPOSANTS
// ========================================

/**
 * Type de retour du hook usePopularSearches
 */
export interface UsePopularSearchesReturn {
  // Données principales
  popularSearches: PopularSearch[];
  loading: boolean;
  error: string | null;
  
  // Métadonnées
  lastUpdated: string | null;
  totalSearches: number;
  
  // Actions
  refreshPopularSearches: () => Promise<void>;
  trackSearch: (data: SearchTrackingData) => Promise<void>;
  updateSearchResults: (data: SearchResultsData) => Promise<void>;

  // ← AJOUTER CES LIGNES
  refreshMaterializedView: () => Promise<boolean>;
  getSearchSuggestions: (partialQuery: string, limit?: number) => PopularSearch[];
  normalizeQuery: (query: string) => string;
  generateSessionId: () => string;
}

/**
 * Configuration pour l'affichage des recherches populaires
 */
export interface PopularSearchesConfig {
  maxItems?: number; // Nombre max d'éléments à afficher (défaut: 5)
  minSearches?: number; // Seuil minimum de recherches (défaut: 2)
  excludeQueries?: string[]; // Termes à exclure de l'affichage
  timeRange?: 'week' | 'month' | 'all'; // Période d'analyse
  source?: 'hero' | 'all'; // Source des recherches à considérer
  enableDebugLogs?: boolean; 
}

/**
 * Statistiques de recherche pour l'admin dashboard
 */
export interface SearchStats {
  totalSearches: number;
  uniqueUsers: number;
  topSearches: Array<{
    query: string;
    count: number;
    trend: 'up' | 'down' | 'stable'; 
  }>;
  searchesWithResults: number;
  searchesWithClicks: number;
  avgResultsPerSearch: number;
  conversionRate: number; // Pourcentage de recherches qui mènent à un clic
  noResultsQueries: Array<{
    query: string;
    count: number;
  }>; // Recherches qui ne donnent aucun résultat
}

// ========================================
// TYPES EXISTANTS ÉTENDUS
// ========================================

// Extension de l'interface Database pour inclure les nouvelles tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      listings: {
        Row: Listing;
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Listing, 'id'>>;
      };
      search_analytics: {
        Row: SearchAnalytics;
        Insert: Omit<SearchAnalytics, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SearchAnalytics, 'id' | 'created_at'>>;
      };
      
    };
    Views: {
      popular_searches: {
        Row: PopularSearch;
      };
    };
  };
}

// ========================================
// TYPES POUR LES FONCTIONS UTILITAIRES
// ========================================

/**
 * Fonction pour normaliser une requête de recherche
 * Supprime les accents, met en minuscules, etc.
 */
export type NormalizeSearchQuery = (query: string) => string;

/**
 * Fonction pour générer un ID de session
 * Utilisé pour tracer les recherches d'utilisateurs anonymes
 */
export type GenerateSessionId = () => string;

/**
 * Options pour la fonction de tracking des recherches
 */
export interface TrackSearchOptions {
  immediate?: boolean; // Envoyer immédiatement ou différer
  includeMetadata?: boolean; // Inclure user-agent, IP, etc.
  timeout?: number; // Timeout en ms pour l'envoi
}

// ========================================
// CONSTANTES ET ÉNUMÉRATIONS
// ========================================

export const SEARCH_SOURCES = {
  HERO: 'hero',
  HEADER: 'header',
  LISTINGS: 'listings',
  CATEGORY: 'category',
  OTHER: 'other'
} as const;

export const SEARCH_TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  ALL: 'all'
} as const;

// Types dérivés des constantes
export type SearchSource = typeof SEARCH_SOURCES[keyof typeof SEARCH_SOURCES];
export type SearchTimeRange = typeof SEARCH_TIME_RANGES[keyof typeof SEARCH_TIME_RANGES];

// ========================================
// TYPES POUR L'INTERFACE UTILISATEUR
// ========================================

/**
 * Props pour le composant PopularSearches
 */
export interface PopularSearchesProps {
  config?: PopularSearchesConfig;
  onSearchClick?: (query: string) => void; // Callback quand on clique sur une recherche
  className?: string;
  variant?: 'hero' | 'sidebar' | 'modal'; // Différents styles d'affichage
}

/**
 * Props pour le composant SearchTracker
 * Composant invisible qui track les recherches
 */
export interface SearchTrackerProps {
  enabled?: boolean; // Activer/désactiver le tracking
  config?: TrackSearchOptions;
}


// ========================================
// NOUVEAUX TYPES POUR LES ACTIONS ADMINISTRATIVES
// ========================================


// ========================================
// NOUVEAUX TYPES POUR SUSPENSIONS GRANULAIRES
// ========================================

export const SUSPENSION_ACTION_TYPES = {
  WARNING: 'warning',
  TEMPORARY_SUSPENSION: 'temporary_suspension', 
  PERMANENT_DELETION: 'permanent_deletion'
} as const;

export type SuspensionActionType = typeof SUSPENSION_ACTION_TYPES[keyof typeof SUSPENSION_ACTION_TYPES];

export interface SuspensionReasonTemplate {
  id: string;
  label: string;
  description: string;
  action_type: SuspensionActionType;
  default_duration?: number;
  requires_custom_note: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface SuspensionAction {
  action_type: SuspensionActionType;
  reason_template_id: string;
  custom_reason?: string;
  admin_notes?: string;
  duration_days?: number;
  effective_date?: string;
}




export interface UserSanction {
  id: string;
  user_id: string;
  admin_id: string;
  sanction_type: 'warning' | 'suspension' | 'permanent_ban';
  reason: string;
  description: string | null;
  duration_days: number | null;
  effective_from: string;
  effective_until: string | null;
  status: 'active' | 'expired' | 'revoked';
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
  related_report_id: string | null;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: 'user' | 'listing' | 'report';
  target_id: string;
  reason: string;
  notes: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

// ========================================
// TYPES ÉTENDUS POUR L'INTERFACE ADMIN
// ========================================

export interface AdminReport extends Report {
  // Données enrichies pour l'affichage
  listing_title?: string;
  listing_price?: number;
  listing_status?: string;
  reported_user_name?: string;
  reported_user_email?: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_type: 'registered' | 'guest';
  
  // Métadonnées calculées
  priority: 'low' | 'medium' | 'high';
  response_time_hours?: number;
  escalation_level: number;
  related_reports_count?: number;
}

export interface ReportAction {
  type: 'approve' | 'dismiss' | 'escalate' | 'ban_user' | 'suspend_user' | 'warn_user' | 'remove_listing' | 'suspend_listing';
  reason: string;
  notes?: string;
  duration?: number; // En jours pour les sanctions temporaires
  allowPermanent?: boolean; // Permet de savoir si la sanction peut être permanente
  supportsDuration?: boolean; // Indique si la durée est applicable
}

export interface AdminActionResult {
  success: boolean;
  message: string;
  actionId?: string;
  details?: Record<string, any>;
}

// ========================================
// TYPES POUR L'INTERFACE DE SIGNALEMENT
// ========================================

export interface GuestReportInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface ReportSubmissionData {
  listingId?: string;
  listingTitle?: string;
  profileId?: string;
  profileName?: string;
  reason: string;
  description: string;
  guestInfo?: GuestReportInfo;
}

// ========================================
// TYPES POUR LES FILTRES ET RECHERCHES
// ========================================

export interface ReportFilters {
  status?: 'all' | 'pending' | 'in_review' | 'resolved' | 'dismissed';
  reportType?: 'all' | 'listing' | 'profile';
  priority?: 'all' | 'low' | 'medium' | 'high';
  dateRange?: 'all' | '24h' | '7d' | '30d';
  assignedTo?: 'all' | 'unassigned' | string;
}

export interface AdminFilters {
  status?: string;
  role?: 'all' | 'merchant' | 'admin';
  sanctioned?: 'all' | 'active' | 'none';
  dateRange?: 'all' | '24h' | '7d' | '30d';
}

// ========================================
// TYPES POUR LES STATISTIQUES ADMIN
// ========================================

export interface ReportStats {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
  dismissed: number;
  averageResponseTime: number;
  resolutionRate: number;
  topReasons: Array<{ reason: string; count: number }>;
}

export interface DashboardStats {
  totalUsers: number;
  totalListings: number;
  totalReports: number;
  pendingReports: number;
  activeSanctions: number;
  weeklyGrowth: {
    users: number;
    listings: number;
    reports: number;
  };
  systemHealth: {
    responseTime: number;
    resolutionRate: number;
    uptime: number;
  };
}



export interface AdminDashboardStats {
  totalUsers: number;
  totalListings: number;
  totalReports: number;
  pendingReports: number;
  activeSanctions: number;
  weeklyGrowth: {
    users: number;
    listings: number;
    reports: number;
  };
  systemHealth: {
    responseTime: number;
    resolutionRate: number;
    uptime: number;
  };
}

// ========================================
// TYPES POUR LES HOOKS ADMIN
// ========================================

export interface UseAdminReportsReturn {
  // Données
  reports: AdminReport[];
  loading: boolean;
  error: string | null;
  
  // Actions
  handleReportAction: (reportId: string, action: ReportAction) => Promise<boolean>;
  refreshReports: () => Promise<void>;
  
  // Utilitaires
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  formatResponseTime: (hours: number) => string;
  
  // Compteurs
  pendingCount: number;
  highPriorityCount: number;
  overdueCount: number;
}

export interface UseAdminUsersReturn {
  users: Profile[];
  loading: boolean;
  error: string | null;
  activeUsersCount: number;
  suspendedUsersCount: number;
  refreshUsers: () => Promise<void>;
  banUser: (userId: string, reason: string, duration?: number) => Promise<boolean>;
  unbanUser: (userId: string, reason: string) => Promise<boolean>;
}

// ========================================
// TYPES POUR LES COMPOSANTS UI
// ========================================

export interface ActionModalProps {
  report: AdminReport | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (reportId: string, action: ReportAction) => Promise<boolean>;
}

export interface AdminTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
  }>;
  loading?: boolean;
  onRowClick?: (item: any) => void;
  emptyMessage?: string;
}

// ========================================
// ÉNUMÉRATIONS ET CONSTANTES
// ========================================

export const REPORT_STATUSES = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
} as const;

export const SANCTION_TYPES = {
  WARNING: 'warning',
  SUSPENSION: 'suspension',
  PERMANENT_BAN: 'permanent_ban'
} as const;


//  Interface SanctionsStats 
// Cette interface unifie les propriétés utilisées dans le hook useAdminSanctions

export interface SanctionsStats {
  // Compteurs principaux des sanctions actives
  totalActive: number;           // Nombre total de sanctions actives
  userSanctions: number;         // Sanctions d'utilisateurs actives
  listingSanctions: number;      // Sanctions d'annonces actives
  
  // Classification par durée
  temporaryCount: number;        // Sanctions temporaires
  permanentCount: number;        // Sanctions permanentes
  
  // Alertes et notifications
  expiringSoon: number;          // Sanctions expirant dans 24h
  expiredToday: number;          // Sanctions ayant expiré aujourd'hui
  createdToday: number;          // Nouvelles sanctions créées aujourd'hui
  
  // Propriétés de compatibilité avec l'ancienne interface
  // Ces propriétés maintiennent la compatibilité avec les composants existants
  totalSanctions?: number;       // Alias pour totalActive
  activeSanctions?: number;      // Alias pour totalActive
  resolvedSanctions?: number;    // Sanctions résolues (révoquées + expirées)
}

// Interface étendue pour les statistiques détaillées (optionnelle)
export interface DetailedSanctionsStats extends SanctionsStats {
  // Statistiques par type de sanction
  warningsCount: number;
  suspensionsCount: number;
  permanentBansCount: number;
  
  // Statistiques temporelles
  thisWeekCount: number;
  thisMonthCount: number;
  averageDuration: number;       // En jours
  
  // Statistiques de résolution
  revokedCount: number;
  autoExpiredCount: number;
  totalResolvedCount: number;
  
  // Ratios et métriques
  resolutionRate: number;        // Pourcentage de sanctions résolues
  escalationRate: number;        // Pourcentage devenant permanentes
}

// Fonction utilitaire pour créer des stats par défaut
export const createDefaultSanctionsStats = (): SanctionsStats => ({
  totalActive: 0,
  userSanctions: 0,
  listingSanctions: 0,
  temporaryCount: 0,
  permanentCount: 0,
  expiringSoon: 0,
  expiredToday: 0,
  createdToday: 0,
  // Propriétés de compatibilité
  totalSanctions: 0,
  activeSanctions: 0,
  resolvedSanctions: 0
});

// Type guard pour vérifier la validité des stats
export const isValidSanctionsStats = (stats: any): stats is SanctionsStats => {
  return (
    typeof stats === 'object' &&
    typeof stats.totalActive === 'number' &&
    typeof stats.userSanctions === 'number' &&
    typeof stats.listingSanctions === 'number' &&
    typeof stats.temporaryCount === 'number' &&
    typeof stats.permanentCount === 'number' &&
    typeof stats.expiringSoon === 'number' &&
    typeof stats.expiredToday === 'number' &&
    typeof stats.createdToday === 'number'
  );
};

export type HealthIndicatorsProps = {
  dashboardStats: DashboardStats;
  isDataFresh: boolean;
  totalElements: number;
  isLoading: boolean;
  sanctionsHealth: {
    totalActive: number;
    expiringSoon: number;
    isHealthy: boolean;
  };
};


export const ACTION_TYPES = {
  APPROVE: 'approve',
  DISMISS: 'dismiss',
  ESCALATE: 'escalate',
  BAN_USER: 'ban_user',
  SUSPEND_USER: 'suspend_user',
  WARN_USER: 'warn_user',
  REMOVE_LISTING: 'remove_listing',
  SUSPEND_LISTING: 'suspend_listing'
  
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

// ========================================
// TYPES POUR LES PERMISSIONS
// ========================================

export interface AdminPermissions {
  canViewReports: boolean;
  canManageReports: boolean;
  canBanUsers: boolean;
  canDeleteListings: boolean;
  canViewAnalytics: boolean;
  canManageAdmins: boolean;
}

export interface UserContext {
  user: Profile | null;
  permissions: AdminPermissions | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// ========================================
// TYPES POUR L'AUDIT ET LA TRAÇABILITÉ
// ========================================

export interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  reason: string;
  created_at: string;
  ip_address: string | null;
}

// ========================================
// TYPES POUR LES NOTIFICATIONS SYSTÈME
// ========================================

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  persistent: boolean;
  created_at: string;
  expires_at: string | null;
  read: boolean;
}




// ========================================
// UNION TYPES ET GUARDS
// ========================================

export type ReportStatus = typeof REPORT_STATUSES[keyof typeof REPORT_STATUSES];
export type SanctionType = typeof SANCTION_TYPES[keyof typeof SANCTION_TYPES];
export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// Type guards pour la sécurité des types
export const isValidReportStatus = (status: string): status is ReportStatus => {
  return Object.values(REPORT_STATUSES).includes(status as ReportStatus);
};

export const isValidActionType = (action: string): action is ActionType => {
  return Object.values(ACTION_TYPES).includes(action as ActionType);
};



// ========================================
// TYPES GUARDS POUR LA SÉCURITÉ
// ========================================

export const isValidSearchSource = (source: string): source is SearchSource => {
  return Object.values(SEARCH_SOURCES).includes(source as SearchSource);
};

export const isValidTimeRange = (range: string): range is SearchTimeRange => {
  return Object.values(SEARCH_TIME_RANGES).includes(range as SearchTimeRange);
};

// Validation des données de tracking
export const isValidSearchTrackingData = (data: any): data is SearchTrackingData => {
  return (
    typeof data === 'object' &&
    typeof data.search_query === 'string' &&
    data.search_query.trim().length > 0 &&
    (data.location_query === undefined || typeof data.location_query === 'string') &&
    (data.user_id === undefined || typeof data.user_id === 'string') &&
    (data.source_page === undefined || isValidSearchSource(data.source_page))
  );
};



// Interface pour les filtres de recherche
export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  condition?: 'new' | 'used' | 'refurbished';
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'date' | 'price_asc' | 'price_desc' | 'views';
  userId?: string;
}




// Interface pour les favoris des utilisateurs
export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  
  // Propriété relationnelle optionnelle
  listing?: Listing | null;
}






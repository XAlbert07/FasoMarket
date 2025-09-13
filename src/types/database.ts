// types/database.ts
// Types étendus pour FasoMarket avec support des actions administratives

// ========================================
// TYPES DE BASE (EXISTANTS)
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

// ========================================
// NOUVEAUX TYPES POUR LES ACTIONS ADMINISTRATIVES
// ========================================

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
// TYPES POUR LA BASE DE DONNÉES SUPABASE
// ========================================

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
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Report, 'id'>>;
      };
      user_sanctions: {
        Row: UserSanction;
        Insert: Omit<UserSanction, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<UserSanction, 'id'>>;
      };
      admin_actions: {
        Row: AdminAction;
        Insert: Omit<AdminAction, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<AdminAction, 'id'>>;
      };
    };
  };
}
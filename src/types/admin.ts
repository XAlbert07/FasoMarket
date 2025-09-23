export interface SanctionsStats {
  // Format standard pour StatsCards
  totalSanctions: number;
  activeSanctions: number;
  resolvedSanctions: number;
  
  // Propriétés étendues pour d'autres composants
  totalActive: number;      // Alias pour activeSanctions
  expiringSoon: number;     // Sanctions expirant dans les 7 jours
  pendingSanctions?: number; // Sanctions en attente de validation
  recentSanctions?: number;  // Sanctions créées dans les dernières 24h
}
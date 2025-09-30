// App.tsx - Version optimisée pour les performances de chargement initial

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop"; 
import ProtectedRoute from "./components/ProtectedRoute";
import { SuspensionGuard } from '@/components/SuspensionGuard';

// IMPORTANT : Les pages critiques ne sont PAS en lazy loading
// Cela élimine complètement la latence de chargement initial
import Index from "./pages/Index";  // Page d'accueil chargée immédiatement
import Login from "./pages/Login";   // Login chargé immédiatement pour l'UX

// Composant de loading optimisé pour le Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      <p className="text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Lazy loading intelligent : Pages par ordre de priorité d'usage

// Pages très fréquemment utilisées (chargement prioritaire)
const Listings = lazy(() => import("./pages/Listings"));
const SmartListingDetail = lazy(() => import("./components/SmartListingDetail"));
const PublishListing = lazy(() => import("./pages/PublishListing"));

// Pages utilisateur moyennement fréquentes
const CategoryListings = lazy(() => import("./pages/CategoryListings"));
const SellerProfile = lazy(() => import("./pages/SellerProfile"));
const MyListings = lazy(() => import("./pages/MyListings"));
const Favorites = lazy(() => import("./pages/Favorites"));

// Pages utilisateur moins fréquentes
const MerchantDashboard = lazy(() => import("./pages/MerchantDashboard"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const EditListing = lazy(() => import("./pages/EditListing"));

// Pages admin (chargement très différé)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SanctionsManagementPage = lazy(() => import("@/pages/admin/components/SanctionsManagementPage"));

// Pages d'authentification secondaires
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Pages statiques (chargement très différé)
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const About = lazy(() => import("./pages/About"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const HowToPublish = lazy(() => import("./pages/HowToPublish"));
const Blog = lazy(() => import("./pages/Blog"));

// Configuration optimisée du QueryClient pour la performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache les données 10 minutes par défaut pour réduire les requêtes
      staleTime: 10 * 60 * 1000,
      // Garde les données en cache 15 minutes
      gcTime: 15 * 60 * 1000,
      // Retry strategy optimisée
      retry: (failureCount, error) => {
        // Ne pas réessayer pour les erreurs 4xx
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 2;
      },
      // Réduire le temps d'attente pour les requêtes lentes
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry strategy pour les mutations
      retry: 1,
    }
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SuspensionGuard>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            
            <Routes>
              {/* Routes critiques - PAS de Suspense pour un chargement immédiat */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Routes fréquentes - Suspense avec priorité élevée */}
              <Route path="/listings" element={
                <Suspense fallback={<PageLoader />}>
                  <Listings />
                </Suspense>
              } />
              
              <Route path="/listing/:id" element={
                <Suspense fallback={<PageLoader />}>
                  <SmartListingDetail />
                </Suspense>
              } />
              
              <Route path="/publish" element={
                <Suspense fallback={<PageLoader />}>
                  <PublishListing />
                </Suspense>
              } />

              <Route path="/category/:category" element={
                <Suspense fallback={<PageLoader />}>
                  <CategoryListings />
                </Suspense>
              } />
              
              {/* Routes utilisateur - Lazy loading standard */}
              <Route path="/seller-profile/:sellerId" element={
                <Suspense fallback={<PageLoader />}>
                  <SellerProfile />
                </Suspense>
              } />
              
              <Route 
                path="/edit-listing/:id" 
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute>
                      <EditListing />
                    </ProtectedRoute>
                  </Suspense>
                } 
              />
              
              {/* Pages utilisateur protégées */}
              <Route path="/my-listings" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <MyListings />
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/favorites" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/messages" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/my-profile" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <MyProfile />
                  </ProtectedRoute>
                </Suspense>
              } />
              
              {/* Routes par rôle */}
              <Route 
                path="/merchant-dashboard" 
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="merchant">
                      <MerchantDashboard />
                    </ProtectedRoute>
                  </Suspense>
                } 
              />
              
              <Route 
                path="/admin-dashboard" 
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Suspense>
                } 
              />
              
              <Route path="/sanctions" element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <SanctionsManagementPage />
                  </ProtectedRoute>
                </Suspense>
              } />
              
              {/* Pages d'authentification secondaires */}
              <Route path="/forgot-password" element={
                <Suspense fallback={<PageLoader />}>
                  <ForgotPassword />
                </Suspense>
              } />
              
              <Route path="/reset-password" element={
                <Suspense fallback={<PageLoader />}>
                  <ResetPassword />
                </Suspense>
              } />
              
              {/* Pages statiques - Chargement très différé */}
              <Route path="/privacy-policy" element={
                <Suspense fallback={<PageLoader />}>
                  <PrivacyPolicy />
                </Suspense>
              } />
              
              <Route path="/legal-notice" element={
                <Suspense fallback={<PageLoader />}>
                  <LegalNotice />
                </Suspense>
              } />
              
              <Route path="/terms-of-service" element={
                <Suspense fallback={<PageLoader />}>
                  <TermsOfService />
                </Suspense>
              } />
              
              <Route path="/about" element={
                <Suspense fallback={<PageLoader />}>
                  <About />
                </Suspense>
              } />
              
              <Route path="/help-support" element={
                <Suspense fallback={<PageLoader />}>
                  <HelpSupport />
                </Suspense>
              } />
              
              <Route path="/how-to-publish" element={
                <Suspense fallback={<PageLoader />}>
                  <HowToPublish />
                </Suspense>
              } />
              
              <Route path="/blog" element={
                <Suspense fallback={<PageLoader />}>
                  <Blog />
                </Suspense>
              } />
              
              {/* Page 404 */}
              <Route path="*" element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SuspensionGuard>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
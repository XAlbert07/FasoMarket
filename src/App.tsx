import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Listings from "./pages/Listings";
// Import du nouveau composant intelligent au lieu de ListingDetail
import SmartListingDetail from "./components/SmartListingDetail";
import PublishListing from "./pages/PublishListing";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import CategoryListings from "./pages/CategoryListings";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalNotice from "./pages/LegalNotice";
import TermsOfService from "./pages/TermsOfService";
import About from "./pages/About";
import HelpSupport from "./pages/HelpSupport";
import MyProfile from "./pages/MyProfile";
import HowToPublish from "./pages/HowToPublish";
import MyListings from "./pages/MyListings";
import SellerProfile from "./pages/SellerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<Listings />} />
            
            {/* 
              ROUTE INTELLIGENTE : Une seule URL qui s'adapte selon l'utilisateur
              - Si l'utilisateur connecté est le propriétaire de l'annonce : vue de gestion complète
              - Sinon : vue publique standard
              Cette approche offre une expérience utilisateur cohérente avec des URLs prévisibles
            */}
            <Route path="/listing/:id" element={<SmartListingDetail />} />
            
            <Route path="/publish" element={<PublishListing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/legal-notice" element={<LegalNotice />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/about" element={<About />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/how-to-publish" element={<HowToPublish />} />
            <Route path="/category/:category" element={<CategoryListings />} />
            <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
            
            {/* 
              ROUTE PROFIL VENDEUR : Permet de voir le profil public d'un vendeur
              Accessible à tous, même sans connexion
            */}
            <Route path="/seller-profile/:sellerId" element={<SellerProfile />} />
            
            {/* Routes protégées par rôle */}
            <Route 
              path="/merchant-dashboard" 
              element={
                <ProtectedRoute requiredRole="merchant">
                  <MerchantDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* 
              IMPORTANT : La route catch-all (*) doit toujours être en dernier
              Elle capture toutes les URLs qui ne correspondent à aucune route définie
            */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
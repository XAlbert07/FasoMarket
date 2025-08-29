import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "merchant" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // This will be replaced with actual Supabase auth
        // For now, we'll simulate authentication
        const mockUser = { 
          id: 1, 
          email: "user@test.com", 
          role: "merchant" // or "admin" based on route
        };
        
        setUser(mockUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Shield className="mr-2 h-5 w-5" />
              Accès Refusé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Vous n'avez pas les permissions pour accéder à cette page.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Rôle requis: {requiredRole}, votre rôle: {user.role}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
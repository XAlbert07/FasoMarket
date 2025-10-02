// components/PublishButton.tsx
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

interface PublishButtonProps {
  variant?: "default" | "cta" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const PublishButton = ({ 
  variant = "default", 
  size = "default", 
  className = "",
  showIcon = true,
  children = "Publier"
}: PublishButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handlePublish = () => {
    if (!user) {
      // Passer la destination dans le state de navigation
      navigate("/login", { 
        state: { from: "/publish" }
      });
    } else {
      navigate("/publish");
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      onClick={handlePublish}
    >
      {showIcon && <Plus className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
};

export default PublishButton;
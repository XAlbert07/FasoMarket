// components/PublishButton.tsx

import { Link, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ReactNode } from "react"

interface PublishButtonProps {
  variant?: "default" | "outline" | "ghost" | "cta"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: ReactNode
  showIcon?: boolean
  loginMessage?: string
}

export const PublishButton = ({
  variant = "cta",
  size = "default",
  className = "",
  children = "Publier",
  showIcon = true,
  loginMessage = "Connectez-vous pour publier une annonce"
}: PublishButtonProps) => {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      navigate(`/login?redirect=publish&message=${encodeURIComponent(loginMessage)}`)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      asChild
    >
      <Link to="/publish" onClick={handleClick}>
        {showIcon && <Plus className="mr-1 h-4 w-4" />}
        {children}
      </Link>
    </Button>
  )
}

export default PublishButton
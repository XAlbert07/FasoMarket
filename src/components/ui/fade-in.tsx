// src/components/ui/fade-in.tsx
import React from "react";
import { motion } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // délai avant l'animation
  duration?: number; // durée de l'animation
  yOffset?: number; // décalage vertical initial pour l'effet
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  yOffset = 10,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;

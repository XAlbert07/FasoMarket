// src/components/ui/AnimatedCard.tsx
import React from "react";
import { motion } from "framer-motion";

interface AnimatedCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ title, subtitle, children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {title && <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{subtitle}</p>}
      <div>{children}</div>
    </motion.div>
  );
};

export default AnimatedCard;
import { createContext, useContext, type ReactNode } from "react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

type AdminDashboardValue = ReturnType<typeof useAdminDashboard>;

const AdminDashboardContext = createContext<AdminDashboardValue | null>(null);

export const AdminDashboardProvider = ({ children }: { children: ReactNode }) => {
  const dashboard = useAdminDashboard();
  return <AdminDashboardContext.Provider value={dashboard}>{children}</AdminDashboardContext.Provider>;
};

export const useSharedAdminDashboard = () => {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error("useSharedAdminDashboard must be used inside AdminDashboardProvider");
  }
  return context;
};

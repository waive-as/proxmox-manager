import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Server,
  HardDrive,
  Activity,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWhiteLabel } from "@/context/WhiteLabelContext";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { config } = useWhiteLabel();

  const isAdmin = user?.role === "admin";
  const isPowerUser = user?.role === "power" || isAdmin;

  const navItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard", allowedRoles: ["admin", "power", "readonly"] },
    { name: "Virtual Machines", icon: Server, path: "/virtual-machines", allowedRoles: ["admin", "power", "readonly"] },
    { name: "Storage", icon: HardDrive, path: "/storage", allowedRoles: ["admin", "power", "readonly"] },
    { name: "Monitoring", icon: Activity, path: "/monitoring", allowedRoles: ["admin", "power", "readonly"] },
    { name: "Users", icon: Users, path: "/users", allowedRoles: ["admin"] },
    { name: "Settings", icon: Settings, path: "/settings", allowedRoles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.allowedRoles.includes(user?.role || "")
  );

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <h1
          className={cn(
            "font-medium text-lg transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 hidden"
          )}
        >
          {config.companyName}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors duration-200",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 hidden")}>
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-2 border-t border-border">
        <div 
          className={cn(
            "px-3 py-2 text-xs text-muted-foreground transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 hidden"
          )}
        >
          <p>Role: {user?.role}</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

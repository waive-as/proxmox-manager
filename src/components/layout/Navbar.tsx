
import React from "react";
import { Menu, BellRing, Moon, Sun, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWhiteLabel } from "@/context/WhiteLabelContext";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { config } = useWhiteLabel();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-10 bg-opacity-80 backdrop-blur">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="mr-2"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu className="h-5 w-5" />
          </Button>
                <div className="flex items-center gap-2">
                  {config.logoUrl && (
                    <img
                      src={config.logoUrl}
                      alt={config.companyName}
                      className="h-6"
                    />
                  )}
                  <h1 className="text-xl font-medium">{config.companyName}</h1>
                </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <BellRing className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

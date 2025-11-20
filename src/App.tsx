
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Setup from "./pages/Setup";
import DashboardPage from "./pages/Dashboard";
import VirtualMachines from "./pages/VirtualMachines";
import Monitoring from "./pages/Monitoring";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Storage from "./pages/Storage";
import ActivityLogs from "./pages/ActivityLogs";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WhiteLabelProvider } from "./context/WhiteLabelContext";
import { ThemeProvider } from "./hooks/use-theme";
import { queryClient } from "./lib/queryClient";
import { setupService } from "./services/setupService";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Component to redirect to setup if needed
const SetupCheck = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { data: setupStatus, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupService.checkStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const needsSetup = setupStatus?.needsSetup ?? false;

  useEffect(() => {
    // If setup is needed and not already on setup page, redirect
    if (!isLoading && needsSetup && location.pathname !== "/setup") {
      window.location.href = "/setup";
    }
  }, [needsSetup, location, isLoading]);

  // Show loading while checking setup status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If setup is needed and we're not on the setup page, show loading
  if (needsSetup && location.pathname !== "/setup") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <SetupCheck>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      
      {/* Protected routes with Layout wrapper */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/virtual-machines"
        element={
          <ProtectedRoute>
            <Layout>
              <VirtualMachines />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <Layout>
              <Monitoring />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/storage"
        element={
          <ProtectedRoute>
            <Layout>
              <Storage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <Layout>
              <ActivityLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </SetupCheck>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <WhiteLabelProvider>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </WhiteLabelProvider>
    </ThemeProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;

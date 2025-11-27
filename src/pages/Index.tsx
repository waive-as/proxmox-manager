
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { setupService } from "@/services/setupService";

const Index: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check setup status first - backend is the authority
  const { data: setupStatus, isLoading: setupLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupService.checkStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  const isLoading = authLoading || setupLoading;
  const needsSetup = setupStatus?.needsSetup ?? false;

  useEffect(() => {
    if (!isLoading) {
      // Setup check takes priority - if no admin exists, go to setup
      if (needsSetup) {
        navigate("/setup", { replace: true });
      } else if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [isLoading, needsSetup, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse-slow">
        <p className="text-xl text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;

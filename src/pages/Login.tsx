
import LoginForm from "@/components/auth/LoginForm";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useWhiteLabel } from "@/context/WhiteLabelContext";
import { setupService } from "@/services/setupService";

const Login: React.FC = () => {
  const { config } = useWhiteLabel();
  const navigate = useNavigate();

  // Check setup status - redirect to setup if no admin exists
  const { data: setupStatus, isLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupService.checkStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (!isLoading && setupStatus?.needsSetup) {
      navigate("/setup", { replace: true });
    }
  }, [isLoading, setupStatus, navigate]);

  // Show loading while checking setup status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to secondary p-4">
      <div className="text-center mb-8 max-w-md">
        {config.logoUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={config.logoUrl}
              alt={config.companyName}
              className="h-12"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold mb-2">{config.companyName}</h1>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;

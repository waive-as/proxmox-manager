
import LoginForm from "@/components/auth/LoginForm";
import React from "react";
import { useWhiteLabel } from "@/context/WhiteLabelContext";
import waiveLogo from "@/assets/waive_logo.svg";

const Login: React.FC = () => {
  const { config } = useWhiteLabel();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to secondary p-4">
      <div className="text-center mb-8 max-w-md">
        <div className="flex justify-center mb-4">
          <img
            src={config.logoUrl || waiveLogo}
            alt={config.companyName}
            className="h-12"
          />
        </div>
        <h1 className="text-4xl font-bold mb-2">{config.companyName}</h1>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;

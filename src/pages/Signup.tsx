
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWhiteLabel } from "@/context/WhiteLabelContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Signup: React.FC = () => {
  const { addUser } = useAuth();
  const { config } = useWhiteLabel();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const success = await addUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'readonly'
      });
      
      if (success) {
        toast.success("Account created successfully! Please check your email to confirm your account.");
        navigate("/login");
      } else {
        setErrorMsg("Failed to create account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMsg(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="text-center mb-8 max-w-md">
        <h1 className="text-4xl font-bold mb-2">{config.companyName}</h1>
        <p className="text-muted-foreground">
          Create an account to manage your Proxmox virtual machines securely
        </p>
      </div>
      <Card className="glass-panel w-full max-w-md animate-fade-in shadow-glass">
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Sign Up</CardTitle>
          <CardDescription>
            Create your account to access the management portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;

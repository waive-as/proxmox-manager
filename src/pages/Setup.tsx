import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { setupService } from "@/services/setupService";
import { CheckCircle2, XCircle, Shield } from "lucide-react";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const Setup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if setup is already complete - redirect if so
  const { data: setupStatus, isLoading: setupLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupService.checkStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (!setupLoading && setupStatus && !setupStatus.needsSetup) {
      navigate("/login", { replace: true });
    }
  }, [setupLoading, setupStatus, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getPasswordRequirements = (password: string): PasswordRequirements => {
    return {
      minLength: password.length >= 12,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  };

  const requirements = getPasswordRequirements(formData.password);
  const allRequirementsMet = Object.values(requirements).every(req => req);

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )}
      <span className={met ? "text-green-600" : "text-gray-500"}>{text}</span>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (!allRequirementsMet) {
      setError("Password does not meet security requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);

      // Initialize system with admin user via backend API
      await setupService.initialize({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      // Invalidate the setup status query so SetupCheck sees the updated status
      await queryClient.invalidateQueries({ queryKey: ['setup-status'] });

      toast.success("Setup completed successfully!");

      // Redirect to login page
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error: any) {
      console.error("Setup error:", error);
      setError(error.message || "Failed to complete setup");
      toast.error("Setup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking setup status
  if (setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-slate-700">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Proxmox Manager</CardTitle>
          <CardDescription className="text-base">
            Let's set up your administrator account to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} autoComplete="off">
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
                required
              />
              <p className="text-sm text-muted-foreground">
                This will be used as your login username
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            {formData.password && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium">Password Requirements:</p>
                <div className="space-y-2">
                  <RequirementItem
                    met={requirements.minLength}
                    text="At least 12 characters"
                  />
                  <RequirementItem
                    met={requirements.hasUpperCase}
                    text="One uppercase letter (A-Z)"
                  />
                  <RequirementItem
                    met={requirements.hasLowerCase}
                    text="One lowercase letter (a-z)"
                  />
                  <RequirementItem
                    met={requirements.hasNumber}
                    text="One number (0-9)"
                  />
                  <RequirementItem
                    met={requirements.hasSpecialChar}
                    text="One special character (!@#$%^&*...)"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Security Notice:</strong> Please ensure you remember this password.
                There is no default password recovery mechanism in this version.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !allRequirementsMet}
              size="lg"
            >
              {isSubmitting ? "Setting up..." : "Complete Setup"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Setup;

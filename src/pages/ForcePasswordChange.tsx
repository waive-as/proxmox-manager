import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, XCircle, KeyRound } from "lucide-react";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const { logout, clearPasswordChangeRequired } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
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

  const requirements = getPasswordRequirements(formData.newPassword);
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

    if (!formData.currentPassword || !formData.newPassword) {
      setError("All fields are required");
      return;
    }

    if (!allRequirementsMet) {
      setError("Password does not meet security requirements");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      // Clear the flag in local state
      clearPasswordChangeRequired();

      toast.success("Password changed successfully!");

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Password change error:", error);
      setError(error.response?.data?.message || error.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-slate-700">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <KeyRound className="h-10 w-10 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Password Change Required</CardTitle>
          <CardDescription className="text-base">
            Your password has been reset by an administrator. Please create a new password to continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter the password given to you"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Create a new password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            {formData.newPassword && (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium">Password Requirements:</p>
                <div className="space-y-2">
                  <RequirementItem met={requirements.minLength} text="At least 12 characters" />
                  <RequirementItem met={requirements.hasUpperCase} text="One uppercase letter (A-Z)" />
                  <RequirementItem met={requirements.hasLowerCase} text="One lowercase letter (a-z)" />
                  <RequirementItem met={requirements.hasNumber} text="One number (0-9)" />
                  <RequirementItem met={requirements.hasSpecialChar} text="One special character (!@#$%^&*...)" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !allRequirementsMet}
            >
              {isSubmitting ? "Changing Password..." : "Change Password"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              Logout
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForcePasswordChange;

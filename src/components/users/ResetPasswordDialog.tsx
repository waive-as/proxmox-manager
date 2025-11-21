import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Key, Copy, CheckCheck } from "lucide-react";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

const generateSecurePassword = (): string => {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "Aa1!"; // Ensure requirements are met

  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const getPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 12,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };
};

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
    )}
    <span className={met ? "text-green-600 dark:text-green-400" : "text-gray-500"}>{text}</span>
  </div>
);

export const ResetPasswordDialog = ({ open, onOpenChange, user, onSuccess }: ResetPasswordDialogProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const requirements = getPasswordRequirements(newPassword);
  const allRequirementsMet = Object.values(requirements).every(req => req);

  const handleGenerate = () => {
    const password = generateSecurePassword();
    setNewPassword(password);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !allRequirementsMet) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`http://localhost:3002/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      setShowSuccess(true);
      toast.success("Password reset successfully");

      // Don't close immediately - show the success message with password
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 10000); // Give user 10 seconds to copy password

    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setShowSuccess(false);
    setCopied(false);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription className="mt-1">
                Reset password for {user.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {showSuccess ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Password reset successfully! The user will be required to change their password on next login.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  readOnly
                  className="font-mono bg-slate-50 dark:bg-slate-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? <CheckCheck className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Make sure to save this password securely. It will not be shown again.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                  >
                    Generate Secure Password
                  </Button>
                </div>
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password or generate one"
                  disabled={isSubmitting}
                />
              </div>

              {newPassword && (
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

              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Note:</strong> The user will be required to change this password on their next login.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !allRequirementsMet}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

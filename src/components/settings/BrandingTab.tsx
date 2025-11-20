import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Image,
  Upload,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useWhiteLabel } from "@/context/WhiteLabelContext";
import { toast } from "sonner";
import waiveLogo from "@/assets/waive_logo.svg";

const BrandingTab: React.FC = () => {
  const { config, updateConfig, resetConfig, uploadLogo, uploadFavicon } =
    useWhiteLabel();
  const [companyName, setCompanyName] = useState(config.companyName);
  const [isUploading, setIsUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(
    config.logoUrl
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
  };

  const handleSaveCompanyName = () => {
    if (!companyName.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }

    updateConfig({ companyName });
    toast.success("Company name updated successfully");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Validate file
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be smaller than 2MB");
        return;
      }

      // Upload and update
      await uploadLogo(file);
      setPreviewLogo(config.logoUrl);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      console.error("Failed to upload logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleFaviconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Validate file
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 512 * 1024) {
        toast.error("Favicon must be smaller than 512KB");
        return;
      }

      // Upload and update
      await uploadFavicon(file);
      toast.success("Favicon uploaded successfully");
    } catch (error: any) {
      console.error("Failed to upload favicon:", error);
      toast.error(error.message || "Failed to upload favicon");
    } finally {
      setIsUploading(false);
      // Reset input
      if (faviconInputRef.current) {
        faviconInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    updateConfig({ logoUrl: null });
    setPreviewLogo(null);
    toast.success("Logo removed - using default");
  };

  const handleResetAll = () => {
    if (
      confirm(
        "Are you sure you want to reset all branding to defaults?\n\nThis will remove your custom logo and company name."
      )
    ) {
      resetConfig();
      setCompanyName(config.companyName);
      setPreviewLogo(null);
      toast.success("Branding reset to defaults");
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Customize your portal's branding. Changes will apply immediately
          across all pages. Logo should be in PNG or JPG format with transparent
          background recommended.
        </AlertDescription>
      </Alert>

      {/* Company Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Company Name
          </CardTitle>
          <CardDescription>
            Set your company or organization name that appears in the header and
            page title
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <div className="flex gap-2">
              <Input
                id="companyName"
                value={companyName}
                onChange={handleCompanyNameChange}
                placeholder="Enter company name"
                className="flex-1"
              />
              <Button
                onClick={handleSaveCompanyName}
                disabled={companyName === config.companyName}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {config.companyName}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Company Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo (PNG, JPG, or SVG). Recommended size: 200x50
            pixels. Max size: 2MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Preview */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <Label className="text-sm font-medium mb-2 block">
              Current Logo Preview
            </Label>
            <div className="flex items-center justify-center h-20 bg-white dark:bg-gray-900 rounded border">
              {config.logoUrl || previewLogo ? (
                <img
                  src={config.logoUrl || previewLogo || ""}
                  alt="Company Logo"
                  className="max-h-16 max-w-full object-contain"
                />
              ) : (
                <img
                  src={waiveLogo}
                  alt="Default Logo"
                  className="max-h-16 max-w-full object-contain opacity-50"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {config.logoUrl
                ? "Custom logo"
                : "Default logo (upload custom logo below)"}
            </p>
          </div>

          {/* Upload Controls */}
          <div className="space-y-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Logo"}
              </Button>
              {config.logoUrl && (
                <Button
                  onClick={handleRemoveLogo}
                  disabled={isUploading}
                  variant="outline"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Upload a custom favicon (the icon shown in browser tabs). Recommended
            size: 32x32 or 64x64 pixels. Max size: 512KB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/*"
              onChange={handleFaviconUpload}
              className="hidden"
              id="favicon-upload"
            />
            <Button
              onClick={() => faviconInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Favicon"}
            </Button>
            {config.faviconUrl && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Custom favicon is active
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reset All */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <RotateCcw className="h-5 w-5" />
            Reset Branding
          </CardTitle>
          <CardDescription>
            Reset all branding customizations back to default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleResetAll} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingTab;

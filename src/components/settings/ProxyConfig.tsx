
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProxyConfig: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          API Configuration
        </CardTitle>
        <CardDescription>
          Proxmox API connections are handled by the backend server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Backend Proxy Active</strong><br />
            Using backend proxy at <code className="bg-muted px-1 rounded">http://localhost:3002</code><br />
            All Proxmox API requests are securely routed through the backend server.
          </AlertDescription>
        </Alert>

        <div className="rounded-md border p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium">Backend Integration</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Server credentials are stored securely in the backend database.
                No local proxy configuration needed.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProxyConfig;

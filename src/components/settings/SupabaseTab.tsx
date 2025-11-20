
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { testSupabaseConnection } from "@/lib/supabase";

const SupabaseTab: React.FC = () => {
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
    loading: boolean;
    version?: string;
    schema?: string;
  }>({
    loading: true,
  });

  const [supabaseUrl, setSupabaseUrl] = useState('https://sbdb.waive.cloud');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseSchema, setSupabaseSchema] = useState('lovable_proxmox_manager_portal');
  const [isEditing, setIsEditing] = useState(false);

  const checkConnection = async () => {
    setStatus({ loading: true });
    try {
      const result = await testSupabaseConnection();
      setStatus({
        ...result,
        loading: false,
      });
    } catch (error) {
      setStatus({
        success: false,
        message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`,
        loading: false,
      });
    }
  };

  React.useEffect(() => {
    checkConnection();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically update your Supabase configuration
    setIsEditing(false);
    checkConnection();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Supabase Configuration</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Status</CardTitle>
          <CardDescription>Current status of your Supabase connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {status.loading ? (
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            ) : status.success ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {status.loading ? 'Checking...' : status.success ? 'Connected' : 'Not Connected'}
              </p>
              <p className="text-sm text-muted-foreground">
                {status.message}
                {status.version && ` (v${status.version})`}
              </p>
              {status.schema && (
                <p className="text-sm text-muted-foreground">
                  Schema: {status.schema}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Settings</CardTitle>
          <CardDescription>Configure your Supabase connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Supabase URL</Label>
                <Input
                  id="supabaseUrl"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabaseKey">Anon Key</Label>
                <Input
                  id="supabaseKey"
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="Enter your anon key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabaseSchema">Schema</Label>
                <Input
                  id="supabaseSchema"
                  value={supabaseSchema}
                  onChange={(e) => setSupabaseSchema(e.target.value)}
                  placeholder="Enter your schema name"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supabase URL</Label>
                <p className="text-sm text-muted-foreground">{supabaseUrl}</p>
              </div>
              <div className="space-y-2">
                <Label>Anon Key</Label>
                <p className="text-sm text-muted-foreground">************************</p>
              </div>
              <div className="space-y-2">
                <Label>Schema</Label>
                <p className="text-sm text-muted-foreground">{supabaseSchema}</p>
              </div>
              <Button onClick={handleEdit}>Edit Settings</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseTab;

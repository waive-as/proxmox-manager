
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testSupabaseConnection } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SupabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
    loading: boolean;
    version?: string;
  }>({
    loading: true
  });

  const checkConnection = async () => {
    setStatus({ loading: true });
    try {
      const result = await testSupabaseConnection();
      setStatus({
        ...result,
        loading: false
      });
    } catch (error) {
      setStatus({
        success: false,
        message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="glass-panel hover-scale">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Supabase Connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          {status.loading ? (
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          ) : status.success ? (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500" />
          )}
          <span className="text-lg font-semibold">
            {status.loading ? 'Checking...' : status.success ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {!status.loading && (
          <>
            <p className="text-xs text-muted-foreground">
              {status.message}
              {status.version && ` (v${status.version})`}
            </p>
            
            {!status.success && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={checkConnection}
              >
                Retry
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseStatus;

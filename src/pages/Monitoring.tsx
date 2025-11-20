import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";

const Monitoring: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Monitoring</h1>
          <p className="text-muted-foreground">Monitor your infrastructure performance and health</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring Dashboard</CardTitle>
          <CardDescription>Coming Soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Monitoring Features</h3>
            <p className="text-muted-foreground max-w-md">
              Real-time monitoring, alerts, and performance metrics will be available here.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              <Card>
                <CardHeader>
                  <Activity className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle className="text-sm">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Monitor overall system status</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Track CPU, memory, and storage</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                  <CardTitle className="text-sm">Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Configure alerts and notifications</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Monitoring;

/**
 * STUDENT ANALYST - Monitoring Dashboard
 * Dashboard per visualizzare lo stato del sistema, performance e errori
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMonitoring } from '@/utils/monitoring';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Wifi, 
  WifiOff,
  RefreshCw
} from 'lucide-react';

export default function MonitoringDashboard() {
  const { getHealthStatus, getPerformanceStats } = useMonitoring();
  const [healthData, setHealthData] = useState(new Map());
  const [performanceData, setPerformanceData] = useState({
    averagePageLoad: 0,
    totalErrors: 0,
    healthyServices: 0,
    totalServices: 0
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const updateData = () => {
    setHealthData(getHealthStatus());
    setPerformanceData(getPerformanceStats());
    setLastUpdate(new Date());
  };

  useEffect(() => {
    updateData();
    
    // Aggiorna ogni 30 secondi
    const interval = setInterval(updateData, 30000);
    
    return () => clearInterval(interval);
  }, [getHealthStatus, getPerformanceStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'degraded': return 'text-yellow-600 bg-yellow-50';
      case 'down': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'down': return <WifiOff className="h-4 w-4" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  const formatResponseTime = (time: number) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const overallHealth = performanceData.totalServices > 0
    ? (performanceData.healthyServices / performanceData.totalServices) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time health and performance monitoring for Student Analyst
          </p>
        </div>
        <Button onClick={updateData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallHealth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {performanceData.healthyServices}/{performanceData.totalServices} services healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Load</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatResponseTime(performanceData.averagePageLoad)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average load time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData.totalErrors}
            </div>
            <p className="text-xs text-muted-foreground">
              In current session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastUpdate.toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">
              System status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
          <CardDescription>
            Status of external dependencies and internal services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(healthData.entries()).map(([serviceName, health]) => (
              <div key={serviceName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(health.status)}
                  <div>
                    <div className="font-medium capitalize">
                      {serviceName.replace('-', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Response: {formatResponseTime(health.responseTime)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(health.status)}>
                    {health.status}
                  </Badge>
                  {health.error && (
                    <div className="text-xs text-red-600 max-w-xs truncate">
                      {health.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {healthData.size === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No health data available. Services are being checked...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Real-time performance monitoring and optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.averagePageLoad > 3000 && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-800">Slow Page Load Detected</div>
                  <div className="text-sm text-yellow-700">
                    Average load time is {formatResponseTime(performanceData.averagePageLoad)}. Consider optimizing assets.
                  </div>
                </div>
              </div>
            )}

            {performanceData.totalErrors > 5 && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">High Error Rate</div>
                  <div className="text-sm text-red-700">
                    {performanceData.totalErrors} errors detected in this session. Check console for details.
                  </div>
                </div>
              </div>
            )}

            {overallHealth === 100 && performanceData.averagePageLoad < 2000 && performanceData.totalErrors === 0 && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">System Running Optimally</div>
                  <div className="text-sm text-green-700">
                    All services are healthy and performance is excellent.
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
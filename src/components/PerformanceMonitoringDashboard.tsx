import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Monitor, Cpu, HardDrive, Wifi, Globe, Database, 
  Activity, AlertTriangle, CheckCircle, Clock, 
  TrendingUp, TrendingDown, RefreshCw, Settings,
  Zap, Users, MessageSquare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceMetrics {
  timestamp: number;
  responseTime: number;
  memory: number;
  cpu: number;
  errors: number;
  activeUsers: number;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime: number;
  uptime: number;
  lastCheck: string;
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Initialize with mock data (replace with real monitoring service)
  useEffect(() => {
    initializeMonitoring();
    
    if (realTimeEnabled) {
      const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const initializeMonitoring = async () => {
    // Mock initialization - replace with real monitoring service
    const mockMetrics: PerformanceMetrics[] = Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (19 - i) * 60000,
      responseTime: 150 + Math.random() * 100,
      memory: 40 + Math.random() * 30,
      cpu: 20 + Math.random() * 40,
      errors: Math.floor(Math.random() * 5),
      activeUsers: 50 + Math.floor(Math.random() * 200)
    }));

    const mockServices: ServiceStatus[] = [
      {
        name: 'Web Application',
        status: 'operational',
        responseTime: 156,
        uptime: 99.9,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Database',
        status: 'operational',
        responseTime: 12,
        uptime: 99.8,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'API Gateway',
        status: 'operational',
        responseTime: 89,
        uptime: 99.95,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'File Storage',
        status: 'degraded',
        responseTime: 1200,
        uptime: 98.5,
        lastCheck: new Date().toISOString()
      },
      {
        name: 'Payment Service',
        status: 'operational',
        responseTime: 340,
        uptime: 99.99,
        lastCheck: new Date().toISOString()
      }
    ];

    setMetrics(mockMetrics);
    setServices(mockServices);
    setLoading(false);
  };

  const updateMetrics = () => {
    const newMetric: PerformanceMetrics = {
      timestamp: Date.now(),
      responseTime: 150 + Math.random() * 100,
      memory: 40 + Math.random() * 30,
      cpu: 20 + Math.random() * 40,
      errors: Math.floor(Math.random() * 5),
      activeUsers: 50 + Math.floor(Math.random() * 200)
    };

    setMetrics(prev => [...prev.slice(1), newMetric]);
    
    // Update service statuses
    setServices(prev => prev.map(service => ({
      ...service,
      responseTime: service.responseTime + (Math.random() - 0.5) * 20,
      lastCheck: new Date().toISOString()
    })));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'outage':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-success bg-success/10 border-success/20';
      case 'degraded':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'outage':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getPerformanceScore = () => {
    if (metrics.length === 0) return 0;
    
    const latest = metrics[metrics.length - 1];
    const responseScore = Math.max(0, 100 - (latest.responseTime - 100) / 5);
    const memoryScore = Math.max(0, 100 - latest.memory);
    const cpuScore = Math.max(0, 100 - latest.cpu);
    const errorScore = Math.max(0, 100 - latest.errors * 20);
    
    return Math.round((responseScore + memoryScore + cpuScore + errorScore) / 4);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestMetrics = metrics[metrics.length - 1];
  const performanceScore = getPerformanceScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">Real-time system performance and health</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={realTimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={initializeMonitoring}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Overall Performance Score</h3>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold text-primary">{performanceScore}</div>
                <div className="flex-1">
                  <Progress value={performanceScore} className="h-3" />
                </div>
                <Badge variant={performanceScore > 80 ? "default" : performanceScore > 60 ? "secondary" : "destructive"}>
                  {performanceScore > 80 ? 'Excellent' : performanceScore > 60 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Last updated</div>
              <div className="text-sm font-medium">{formatTime(latestMetrics?.timestamp || Date.now())}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{Math.round(latestMetrics?.responseTime || 0)}ms</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <Progress value={Math.max(0, 100 - (latestMetrics?.responseTime || 0) / 5)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Memory Usage</p>
                <p className="text-2xl font-bold">{Math.round(latestMetrics?.memory || 0)}%</p>
              </div>
              <HardDrive className="h-8 w-8 text-success" />
            </div>
            <div className="mt-2">
              <Progress value={latestMetrics?.memory || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">{Math.round(latestMetrics?.cpu || 0)}%</p>
              </div>
              <Cpu className="h-8 w-8 text-warning" />
            </div>
            <div className="mt-2">
              <Progress value={latestMetrics?.cpu || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{latestMetrics?.activeUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-accent-foreground" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {latestMetrics?.errors || 0} errors/min
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  domain={['dataMin', 'dataMax']}
                  className="text-muted-foreground"
                />
                <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} className="text-muted-foreground" />
                <Tooltip 
                  labelFormatter={(value) => formatTime(value as number)}
                  formatter={(value) => [`${Math.round(value as number)}ms`, 'Response Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                  domain={['dataMin', 'dataMax']}
                  className="text-muted-foreground"
                />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} className="text-muted-foreground" />
                <Tooltip 
                  labelFormatter={(value) => formatTime(value as number)}
                  formatter={(value, name) => [`${Math.round(value as number)}%`, name]}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Memory"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="CPU"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{Math.round(service.responseTime)}ms</div>
                    <div className="text-xs text-muted-foreground">response time</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{service.uptime.toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">uptime</div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {performanceScore < 70 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Alert:</strong> System performance is below optimal levels. 
            Consider investigating high response times or resource usage.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, User, Database, Key, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthTest() {
  const { user, session, isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-success" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Authentication Status</h1>
          <p className="text-muted-foreground">Debug page to verify authentication system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Is Loading</span>
                {getStatusIcon(!isLoading)}
                <Badge variant={isLoading ? "destructive" : "secondary"}>
                  {isLoading ? "Loading" : "Ready"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Is Authenticated</span>
                {getStatusIcon(isAuthenticated)}
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Has Session</span>
                {getStatusIcon(!!session)}
                <Badge variant={session ? "default" : "destructive"}>
                  {session ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Has User Object</span>
                {getStatusIcon(!!user)}
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Has User Metadata</span>
                {getStatusIcon(!!user?.user_metadata)}
                <Badge variant={user?.user_metadata ? "default" : "destructive"}>
                  {user?.user_metadata ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="text-xs font-mono bg-muted p-2 rounded">{user.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-foreground">{user.user_metadata?.full_name || user.email?.split('@')[0] || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <Badge className="mt-1">
                      {(user.user_metadata?.role || 'tenant').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="text-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No user information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Role Checks</label>
                    <div className="space-y-1">
                      {['admin', 'property_manager', 'vendor', 'tenant'].map(role => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="text-sm">{role}</span>
                          {getStatusIcon(hasRole(role as any))}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Permission Checks</label>
                    <div className="space-y-1">
                      {['*', 'manage_properties', 'view_reports', 'manage_profile'].map(permission => (
                        <div key={permission} className="flex items-center justify-between">
                          <span className="text-sm">{permission}</span>
                          {getStatusIcon(hasPermission(permission))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No permission data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Navigation Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/admin">Go to Admin (Admin Only)</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/vendor/dashboard">Go to Vendor Dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Go to Auth Page</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raw Data */}
        {user && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Raw User Data (Debug)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                {JSON.stringify({ user, session: session ? 'present' : null }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
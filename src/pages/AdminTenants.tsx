import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';

export default function AdminTenants() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tenant Management</h1>
                <p className="text-muted-foreground">Manage and monitor all tenants</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>

          {/* Filters */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search tenants by name, email, or property..."
                    className="border-primary/20"
                  />
                </div>
                <Button variant="outline" className="border-primary/20">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tenant List */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>Complete list of registered tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tenant management interface ready for integration</p>
                <p className="text-sm mt-2">Connect to TenantManagement component or build custom view</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </OptimizedProtectedRoute>
  );
}

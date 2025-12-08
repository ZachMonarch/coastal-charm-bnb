import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Search, FileText } from "lucide-react";

export default function VendorApplication() {
  const navigate = useNavigate();

  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <PrivatePageWrapper title="Find Projects">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Find Projects to Apply For</h1>
              <p className="text-muted-foreground">Browse available projects and submit your applications.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Wrench className="h-6 w-6 text-primary" />
                  Ready to Find Work?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6">
                    To apply for projects, you need to browse our available project listings 
                    and submit applications for specific projects that match your expertise.
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <Button 
                    onClick={() => navigate("/vendor/dashboard?tab=projects")}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Search className="h-6 w-6" />
                    <span>Browse Available Projects</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/vendor/dashboard")}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-6 w-6" />
                    <span>View My Applications</span>
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground text-center">
                  <p>New to the platform? Complete your vendor profile first to unlock more opportunities.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}
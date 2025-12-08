import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorBoundaryFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="max-w-2xl w-full neumorphic-card">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="text-base">
            We encountered an unexpected error. Don't worry, your data is safe.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isDev && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-mono text-destructive mb-2 font-semibold">
                Development Error Details:
              </p>
              <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                {error.message}
              </pre>
              {error.stack && (
                <pre className="text-xs overflow-auto max-h-60 mt-2 text-muted-foreground/70">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={resetErrorBoundary} 
              className="flex-1 btn-primary group"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col text-center text-sm text-muted-foreground pt-0">
          <p>If the problem persists, please contact support.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

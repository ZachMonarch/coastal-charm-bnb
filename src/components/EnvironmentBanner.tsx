import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Server } from 'lucide-react';

/**
 * Environment Banner Component
 * Displays critical warning for production environment
 */
export default function EnvironmentBanner() {
  const env = import.meta.env.MODE;
  const isProd = env === 'production';

  if (!isProd) return null;

  return (
    <Alert variant="destructive" className="mb-4 border-2 bg-destructive/5">
      <AlertTriangle className="h-5 w-5" />
      <AlertDescription className="flex items-center gap-2">
        <Server className="h-4 w-4" />
        <strong>🟥 PRODUCTION ENVIRONMENT</strong>
        <span className="ml-2 text-sm">All actions are permanent and logged</span>
      </AlertDescription>
    </Alert>
  );
}

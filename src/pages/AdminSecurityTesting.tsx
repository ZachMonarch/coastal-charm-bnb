import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import SecurityTestingPanel from '@/components/SecurityTestingPanel';

export default function AdminSecurityTesting() {
  return (
    <OptimizedProtectedRoute requiredRole="admin">
      <PrivatePageWrapper title="Security Testing">
        <SecurityTestingPanel />
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}

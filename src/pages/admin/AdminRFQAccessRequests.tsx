import OptimizedProtectedRoute from '@/components/OptimizedProtectedRoute';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import AdminRFQAccessRequestsPanel from '@/components/admin/AdminRFQAccessRequestsPanel';

export default function AdminRFQAccessRequests() {
  return (
    <OptimizedProtectedRoute requiredRole={['admin', 'property_manager']}>
      <PrivatePageWrapper title="Project Access Requests">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <AdminRFQAccessRequestsPanel />
        </div>
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}

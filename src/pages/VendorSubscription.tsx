import SubscriptionPlans from "@/components/SubscriptionPlans";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { useAuth } from "@/contexts/OptimizedAuthContext";

export default function VendorSubscription() {
  const { user } = useAuth();

  return (
    <OptimizedProtectedRoute requiredRole="vendor">
      <PrivatePageWrapper title="Subscription Plans">
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto px-4 py-8">
            <SubscriptionPlans />
          </div>
        </div>
      </PrivatePageWrapper>
    </OptimizedProtectedRoute>
  );
}
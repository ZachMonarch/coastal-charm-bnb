import RFQCreationForm from '@/components/rfq/RFQCreationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function RFQCreate() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate('/admin/rfq')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to RFQs
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New RFQ</CardTitle>
        </CardHeader>
        <CardContent>
          <RFQCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}

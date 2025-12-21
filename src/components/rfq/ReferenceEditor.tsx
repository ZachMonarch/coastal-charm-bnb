import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Building2, User, Phone, FileText } from 'lucide-react';

interface Reference {
  company_name: string;
  contact_name: string;
  phone: string;
  project_description: string;
}

interface ReferenceEditorProps {
  references: Reference[];
  onChange: (references: Reference[]) => void;
  maxReferences?: number;
}

export default function ReferenceEditor({
  references,
  onChange,
  maxReferences = 3
}: ReferenceEditorProps) {
  const addReference = () => {
    if (references.length >= maxReferences) return;
    
    onChange([
      ...references,
      { company_name: '', contact_name: '', phone: '', project_description: '' }
    ]);
  };

  const removeReference = (index: number) => {
    onChange(references.filter((_, i) => i !== index));
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    const updated = references.map((ref, i) =>
      i === index ? { ...ref, [field]: value } : ref
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">References</Label>
          <p className="text-xs text-muted-foreground">
            Provide up to {maxReferences} references from previous projects
          </p>
        </div>
        {references.length < maxReferences && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addReference}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Reference
          </Button>
        )}
      </div>

      {references.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No references added yet
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addReference}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add First Reference
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {references.map((ref, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-sm">Reference {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReference(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Company Name
                    </Label>
                    <Input
                      value={ref.company_name}
                      onChange={(e) => updateReference(index, 'company_name', e.target.value)}
                      placeholder="ABC Construction Inc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Contact Name
                    </Label>
                    <Input
                      value={ref.contact_name}
                      onChange={(e) => updateReference(index, 'contact_name', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      value={ref.phone}
                      onChange={(e) => updateReference(index, 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Project Description
                    </Label>
                    <Textarea
                      value={ref.project_description}
                      onChange={(e) => updateReference(index, 'project_description', e.target.value)}
                      placeholder="Brief description of the project you completed for this client..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {references.length} of {maxReferences} references added
      </p>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Building2, Search, MapPin } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/lib/rfqCategories';

export interface PropertyServiceLink {
  property_id: number;
  property_title: string;
  property_address: string;
  service_types: string[];
  notes: string;
}

interface PropertyOption {
  id: number;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

interface PropertyServiceSelectorProps {
  linkedProperties: PropertyServiceLink[];
  onChange: (links: PropertyServiceLink[]) => void;
  properties: PropertyOption[];
  isLoading?: boolean;
}

export default function PropertyServiceSelector({
  linkedProperties,
  onChange,
  properties,
  isLoading,
}: PropertyServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const filteredProperties = properties.filter((p) => {
    const alreadyLinked = linkedProperties.some((lp) => lp.property_id === p.id);
    if (alreadyLinked) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.title?.toLowerCase().includes(term)) ||
      (p.address?.toLowerCase().includes(term)) ||
      (p.city?.toLowerCase().includes(term))
    );
  });

  const handleAddProperty = () => {
    const propId = parseInt(selectedPropertyId);
    if (!propId) return;
    const prop = properties.find((p) => p.id === propId);
    if (!prop) return;

    onChange([
      ...linkedProperties,
      {
        property_id: prop.id,
        property_title: prop.title || 'Untitled Property',
        property_address: [prop.address, prop.city, prop.state].filter(Boolean).join(', '),
        service_types: [],
        notes: '',
      },
    ]);
    setSelectedPropertyId('');
    setSearchTerm('');
  };

  const handleRemoveProperty = (propertyId: number) => {
    onChange(linkedProperties.filter((lp) => lp.property_id !== propertyId));
  };

  const handleToggleService = (propertyId: number, serviceId: string) => {
    onChange(
      linkedProperties.map((lp) => {
        if (lp.property_id !== propertyId) return lp;
        const has = lp.service_types.includes(serviceId);
        return {
          ...lp,
          service_types: has
            ? lp.service_types.filter((s) => s !== serviceId)
            : [...lp.service_types, serviceId],
        };
      })
    );
  };

  const handleNotesChange = (propertyId: number, notes: string) => {
    onChange(
      linkedProperties.map((lp) =>
        lp.property_id === propertyId ? { ...lp, notes } : lp
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Add Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Link Properties & Assign Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Select Property to Add</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-72">
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose property" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {properties.length === 0 ? 'No properties found' : 'All properties linked'}
                    </div>
                  ) : (
                    filteredProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.title || 'Untitled'} — {p.city}, {p.state}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddProperty} disabled={!selectedPropertyId}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {linkedProperties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No properties linked yet</p>
              <p className="text-sm">Add properties above, then assign service types to each</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Properties with Service Assignments */}
      {linkedProperties.map((lp) => (
        <Card key={lp.property_id} className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  {lp.property_title}
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {lp.property_address}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{lp.service_types.length} services</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProperty(lp.property_id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Required Services for this Property
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {SERVICE_CATEGORIES.map((cat) => {
                  const isChecked = lp.service_types.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() =>
                          handleToggleService(lp.property_id, cat.id)
                        }
                      />
                      <span className="text-sm">{cat.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Notes for this property</Label>
              <Textarea
                value={lp.notes}
                onChange={(e) => handleNotesChange(lp.property_id, e.target.value)}
                placeholder="Special requirements, access instructions, scope details..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

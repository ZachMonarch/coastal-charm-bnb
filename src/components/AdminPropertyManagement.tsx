import { useState, useEffect } from "react";
import { Plus, Search, Upload, Edit, Trash2, Eye, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { secureErrorHandler } from "@/utils/secureErrorHandler";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logger } from "@/utils/logger";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: string;
  property_type: string;
  status: string;
  available_date: string;
  image_urls: string;
  amenities: string;
  latitude?: number;
  longitude?: number;
  owner_id: string;
}

interface NewProperty {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: string;
  property_type: string;
  status: string;
  available_date: string;
  amenities: string;
  latitude?: number;
  longitude?: number;
}

export default function AdminPropertyManagement() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newProperty, setNewProperty] = useState<NewProperty>({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: 0,
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    square_feet: '',
    property_type: 'apartment',
    status: 'available',
    available_date: '',
    amenities: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, city, state, zip_code, property_type, bedrooms, bathrooms, square_feet, price, status, image_urls, amenities, available_date, owner_id, description, latitude, longitude')
        .order('id', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      const safeError = secureErrorHandler.handleError(error, {
        endpoint: 'properties',
        userId: user?.id
      });
      toast.error(safeError.message);
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('properties')
        .insert({
          ...newProperty,
          owner_id: user.id,
          image_urls: '[]' // Start with empty images
        });

      if (error) throw error;

      toast.success('Property created successfully');
      setIsCreateOpen(false);
      resetNewProperty();
      fetchProperties();
    } catch (error) {
      logger.error('Error creating property:', error);
      toast.error('Failed to create property');
    }
  };

  const updateProperty = async () => {
    if (!editingProperty) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({
          title: editingProperty.title,
          description: editingProperty.description,
          address: editingProperty.address,
          city: editingProperty.city,
          state: editingProperty.state,
          zip_code: editingProperty.zip_code,
          price: editingProperty.price,
          bedrooms: editingProperty.bedrooms,
          bathrooms: editingProperty.bathrooms,
          square_feet: editingProperty.square_feet,
          property_type: editingProperty.property_type,
          status: editingProperty.status,
          available_date: editingProperty.available_date,
          amenities: editingProperty.amenities
        })
        .eq('id', editingProperty.id);

      if (error) throw error;

      toast.success('Property updated successfully');
      setEditingProperty(null);
      fetchProperties();
    } catch (error) {
      logger.error('Error updating property:', error);
      toast.error('Failed to update property');
    }
  };

  const deleteProperty = async (propertyId: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      setProperties(properties.filter(p => p.id !== propertyId));
      toast.success('Property deleted successfully');
    } catch (error) {
      logger.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    }
  };

  const uploadImages = async (propertyId: number, files: FileList) => {
    setUploadingImages(true);
    try {
      const imageUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          logger.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      if (imageUrls.length > 0) {
        // Get current images
        const property = properties.find(p => p.id === propertyId);
        let currentImages: string[] = [];
        
        try {
          if (property?.image_urls) {
            const parsed = JSON.parse(property.image_urls);
            currentImages = Array.isArray(parsed) ? parsed : [];
          }
        } catch (error) {
          logger.debug('Error parsing existing images:', error);
        }

        const allImages = [...currentImages, ...imageUrls];

        const { error: updateError } = await supabase
          .from('properties')
          .update({ image_urls: JSON.stringify(allImages) })
          .eq('id', propertyId);

        if (updateError) throw updateError;

        toast.success(`${imageUrls.length} images uploaded successfully`);
        fetchProperties();
      }
    } catch (error) {
      logger.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const resetNewProperty = () => {
    setNewProperty({
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zip_code: 0,
      price: 0,
      bedrooms: 1,
      bathrooms: 1,
      square_feet: '',
      property_type: 'apartment',
      status: 'available',
      available_date: '',
      amenities: ''
    });
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || property.property_type === selectedType;
    const matchesStatus = selectedStatus === "all" || property.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'rented': return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
      case 'maintenance': return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'unavailable': return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getImageCount = (imageUrls: string) => {
    try {
      const parsed = JSON.parse(imageUrls || '[]');
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Property Management</h1>
          <p className="text-muted-foreground">Manage all properties and their images</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>Create a new property listing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    value={newProperty.title}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Property name"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="Monthly rent"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProperty.description}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Property description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newProperty.city}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newProperty.state}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input
                    id="zip"
                    type="number"
                    value={newProperty.zip_code || ''}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, zip_code: Number(e.target.value) }))}
                    placeholder="Zip"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={newProperty.bedrooms}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={newProperty.bathrooms}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                    min="1"
                    step="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="square_feet">Square Feet</Label>
                  <Input
                    id="square_feet"
                    value={newProperty.square_feet}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, square_feet: e.target.value }))}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Property Type</Label>
                  <Select value={newProperty.property_type} onValueChange={(value) => setNewProperty(prev => ({ ...prev, property_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newProperty.status} onValueChange={(value) => setNewProperty(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="available_date">Available Date</Label>
                  <Input
                    id="available_date"
                    type="date"
                    value={newProperty.available_date}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, available_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="amenities">Amenities</Label>
                <Textarea
                  id="amenities"
                  value={newProperty.amenities}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, amenities: e.target.value }))}
                  placeholder="List amenities separated by commas"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createProperty}>
                  Create Property
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Building className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.filter(p => p.status === 'available').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rented</CardTitle>
            <Building className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.filter(p => p.status === 'rented').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(properties.reduce((sum, p) => sum + p.price, 0) / 1000).toFixed(0)}k
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="townhouse">Townhouse</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            {filteredProperties.length} properties found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{property.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {property.address}, {property.city}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{property.property_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(property.status)}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${property.price}/month</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getImageCount(property.image_urls)} images</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingImages}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) uploadImages(property.id, files);
                          };
                          input.click();
                        }}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProperty(property)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProperty(property.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Property Dialog */}
      {editingProperty && (
        <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>Update property information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Property Title</Label>
                  <Input
                    id="edit-title"
                    value={editingProperty.title}
                    onChange={(e) => setEditingProperty(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProperty.price}
                    onChange={(e) => setEditingProperty(prev => prev ? { ...prev, price: Number(e.target.value) } : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProperty.description}
                  onChange={(e) => setEditingProperty(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editingProperty.status} 
                    onValueChange={(value) => setEditingProperty(prev => prev ? { ...prev, status: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-type">Property Type</Label>
                  <Select 
                    value={editingProperty.property_type} 
                    onValueChange={(value) => setEditingProperty(prev => prev ? { ...prev, property_type: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingProperty(null)}>
                  Cancel
                </Button>
                <Button onClick={updateProperty}>
                  Update Property
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
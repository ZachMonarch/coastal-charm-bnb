import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Star, User, Building, Phone, Mail, MapPin, CheckCircle, XCircle, Shield, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OptimizedProtectedRoute from "@/components/OptimizedProtectedRoute";
import VerifiedBadge from "@/components/VerifiedBadge";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import ColorfulIconBox from "@/components/shared/ColorfulIconBox";

interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  specialties: string[];
  service_areas: string[];
  rating: number;
  completed_jobs: number;
  is_verified: boolean;
  insurance_verified: boolean;
  background_check_verified: boolean;
  created_at: string;
  business_license?: string;
}

interface VendorUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
}

interface VendorWithProfile extends VendorProfile {
  user: VendorUser;
}

export default function AdminVendorManagement() {
  const [vendors, setVendors] = useState<VendorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorWithProfile | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          profiles!vendor_profiles_user_id_fkey (
            id,
            email,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const vendorsWithUsers = data?.map(vendor => ({
        ...vendor,
        user: vendor.profiles
      })) || [];

      setVendors(vendorsWithUsers);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const updateVendorVerification = async (vendorId: string, field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ [field]: value })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, [field]: value } : vendor
      ));

      toast.success(`Vendor ${field.replace('_', ' ')} updated successfully`);
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor');
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || 
                           vendor.specialties?.some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const getVerificationStatus = (vendor: VendorWithProfile) => {
    const verifications = [
      vendor.is_verified,
      vendor.insurance_verified,
      vendor.background_check_verified
    ];
    const verified = verifications.filter(Boolean).length;
    const total = verifications.length;
    
    if (verified === total) return { status: 'fully-verified', color: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40' };
    if (verified > 0) return { status: 'partially-verified', color: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40' };
    return { status: 'unverified', color: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40' };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-warning fill-current' : 'text-muted-foreground'}`} 
      />
    ));
  };

  // Compute stats
  const verifiedCount = vendors.filter(v => v.is_verified).length;
  const avgRating = vendors.length > 0 
    ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1) 
    : '0.0';
  const totalJobs = vendors.reduce((sum, v) => sum + v.completed_jobs, 0);

  return (
    <PrivatePageWrapper title="Vendor Management">
      <div className="space-y-6">
        {/* PageHero with Stats */}
        <PageHero
          title="Vendor Management"
          description="Manage vendors, verifications, and service providers"
          icon={HardHat}
          variant="gradient"
          stats={[
            { label: 'Total Vendors', value: vendors.length, icon: Building, color: 'info' },
            { label: 'Verified', value: verifiedCount, icon: CheckCircle, color: 'success' },
            { label: 'Avg Rating', value: avgRating, icon: Star, color: 'warning' },
            { label: 'Total Jobs', value: totalJobs, icon: User, color: 'primary' },
          ]}
          actions={[
            { label: 'Add Vendor', href: '#', variant: 'default' },
          ]}
        />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendors Table */}
          <Card className="neumorphic-card">
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
              <CardDescription>
                {filteredVendors.length} vendors found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => {
                    const verification = getVerificationStatus(vendor);
                    // Determine row accent based on verification status
                    const rowAccent = verification.status === 'fully-verified' 
                      ? 'border-l-success' 
                      : verification.status === 'partially-verified' 
                        ? 'border-l-warning' 
                        : 'border-l-destructive';
                    
                    return (
                      <TableRow 
                        key={vendor.id} 
                        className={`table-row-glow border-l-4 ${rowAccent} cursor-pointer hover:bg-primary/5 transition-all duration-300`} 
                        onClick={() => setSelectedVendor(vendor)}
                      >
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <ColorfulIconBox 
                              icon={Building} 
                              color={vendor.is_verified ? 'success' : 'secondary'} 
                              size="sm"
                              glow={vendor.is_verified}
                            />
                            <div>
                              <div className="font-semibold text-foreground">{vendor.company_name}</div>
                              <div className="text-sm text-muted-foreground">{vendor.user?.full_name}</div>
                              <div className="text-xs text-muted-foreground">{vendor.user?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vendor.specialties?.slice(0, 2).map((specialty, index) => (
                              <Badge key={index} variant="info" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {vendor.specialties?.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{vendor.specialties.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {renderStars(vendor.rating)}
                            </div>
                            <span className="text-sm text-muted-foreground ml-1">
                              ({vendor.rating.toFixed(1)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            verification.status === 'fully-verified' ? 'success' 
                            : verification.status === 'partially-verified' ? 'warning' 
                            : 'error'
                          }>
                            {verification.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-success">{vendor.completed_jobs}</span>
                            <span className="text-xs text-muted-foreground">jobs</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedVendor(vendor)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateVendorVerification(vendor.id, 'is_verified', !vendor.is_verified)}
                              >
                                {vendor.is_verified ? 'Remove Verification' : 'Verify Vendor'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateVendorVerification(vendor.id, 'insurance_verified', !vendor.insurance_verified)}
                              >
                                {vendor.insurance_verified ? 'Remove Insurance' : 'Verify Insurance'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateVendorVerification(vendor.id, 'background_check_verified', !vendor.background_check_verified)}
                              >
                                {vendor.background_check_verified ? 'Remove Background Check' : 'Verify Background'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Vendor Details Dialog */}
          {selectedVendor && (
            <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedVendor.company_name}
                    {selectedVendor.is_verified && <VerifiedBadge isVerified={true} />}
                  </DialogTitle>
                  <DialogDescription>
                    Vendor profile and verification details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVendor.user?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVendor.user?.email}</span>
                      </div>
                      {selectedVendor.user?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedVendor.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVendor.business_license || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div>
                    <h3 className="font-semibold mb-3">Service Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Specialties</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedVendor.specialties?.map((specialty, index) => (
                            <Badge key={index} variant="outline">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Service Areas</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedVendor.service_areas?.map((area, index) => (
                            <Badge key={index} variant="secondary">
                              <MapPin className="h-3 w-3 mr-1" />
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h3 className="font-semibold mb-3">Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Rating</label>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(selectedVendor.rating)}
                          <span className="font-medium">{selectedVendor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Completed Jobs</label>
                        <div className="text-2xl font-bold mt-1">{selectedVendor.completed_jobs}</div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div>
                    <h3 className="font-semibold mb-3">Verification Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>General Verification</span>
                        <Badge className={selectedVendor.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {selectedVendor.is_verified ? 'Verified' : 'Not Verified'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Insurance Verified</span>
                        <Badge className={selectedVendor.insurance_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {selectedVendor.insurance_verified ? 'Verified' : 'Not Verified'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Background Check</span>
                        <Badge className={selectedVendor.background_check_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {selectedVendor.background_check_verified ? 'Verified' : 'Not Verified'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
    </div>
    </PrivatePageWrapper>
  );
}
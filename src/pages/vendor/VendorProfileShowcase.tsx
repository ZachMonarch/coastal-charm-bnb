import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { User, Save, Upload, Shield, Award, Star, MapPin, Clock, Briefcase, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import PageHero from "@/components/shared/PageHero";
import { ButtonSpinner } from "@/components/shared/LoadingSpinner";

interface VendorProfile {
  id: string;
  company_name: string;
  description: string;
  phone: string;
  address: string;
  specialties: string[];
  service_areas: string[];
  certifications: string[];
  years_experience: number;
  avatar_url: string;
  is_verified: boolean;
  insurance_verified: boolean;
  background_check_verified: boolean;
  rating: number;
  completed_jobs: number;
  subscription_plan: string;
}

export default function VendorProfileShowcase() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [serviceAreasInput, setServiceAreasInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          id, company_name, description, phone, address,
          specialties, service_areas, certifications, years_experience,
          avatar_url, is_verified, insurance_verified, background_check_verified,
          rating, completed_jobs, subscription_plan
        `)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setSpecialtiesInput(data.specialties?.join(', ') || '');
        setServiceAreasInput(data.service_areas?.join(', ') || '');
        setCertificationsInput(data.certifications?.join(', ') || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          company_name: profile.company_name,
          description: profile.description,
          phone: profile.phone,
          address: profile.address,
          specialties: specialtiesInput.split(',').map(s => s.trim()).filter(Boolean),
          service_areas: serviceAreasInput.split(',').map(s => s.trim()).filter(Boolean),
          certifications: certificationsInput.split(',').map(s => s.trim()).filter(Boolean),
          years_experience: profile.years_experience,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getTierBadge = () => {
    const plan = profile?.subscription_plan || 'free';
    const badges: Record<string, { label: string; className: string }> = {
      free: { label: 'Free', className: 'bg-muted text-muted-foreground' },
      basic: { label: 'Basic', className: 'bg-info/20 text-info' },
      premium: { label: 'Premium', className: 'bg-primary/20 text-primary' },
      enterprise: { label: 'Enterprise', className: 'bg-gradient-to-r from-primary to-warning text-white' },
    };
    const config = badges[plan] || badges.free;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted/50 rounded-xl" />
        <div className="h-64 bg-muted/50 rounded-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No vendor profile found</p>
          <Button onClick={() => window.location.href = '/vendor/profile'}>
            Create Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile Showcase | Monarch Vendor Portal</title>
        <meta name="description" content="Edit your public vendor showcase profile" />
      </Helmet>

      <div className="space-y-6">
        <PageHero
          title="Profile Showcase"
          description="Manage your public-facing vendor profile displayed in the marketplace"
          icon={User}
          variant="gradient"
          stats={[
            { label: 'Rating', value: profile.rating?.toFixed(1) || 'New', icon: Star, color: 'warning' },
            { label: 'Jobs Completed', value: profile.completed_jobs || 0, icon: Briefcase, color: 'success' },
            { label: 'Verified', value: profile.is_verified ? 'Yes' : 'No', icon: Shield, color: profile.is_verified ? 'success' : 'secondary' },
          ]}
        />

        {/* Subscription Notice */}
        {(profile.subscription_plan === 'free' || !profile.subscription_plan) && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-warning" />
                <div className="flex-1">
                  <h4 className="font-semibold">Upgrade to Appear in Marketplace</h4>
                  <p className="text-sm text-muted-foreground">
                    Free accounts are not visible in the vendor marketplace. Upgrade to Basic or higher to showcase your profile.
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/vendor/subscription'}>
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Preview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-xl">
                    {profile.company_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {profile.company_name}
                    {profile.is_verified && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getTierBadge()}
                    {profile.insurance_verified && (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success">Insured</Badge>
                    )}
                    {profile.background_check_verified && (
                      <Badge variant="outline" className="text-xs bg-info/10 text-info">Background Checked</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <ButtonSpinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="services">Services & Expertise</TabsTrigger>
            <TabsTrigger value="location">Location & Areas</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic details about your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={profile.company_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    placeholder="Describe your company, services, and what makes you unique..."
                    value={profile.description || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min={0}
                    value={profile.years_experience || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, years_experience: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Services & Specialties</CardTitle>
                <CardDescription>List your services separated by commas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Specialties</Label>
                  <Textarea
                    placeholder="Plumbing, Electrical, HVAC, Painting..."
                    value={specialtiesInput}
                    onChange={(e) => setSpecialtiesInput(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specialtiesInput.split(',').filter(s => s.trim()).map((s, i) => (
                      <Badge key={i} variant="secondary">{s.trim()}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Certifications & Licenses</Label>
                  <Textarea
                    placeholder="Licensed Plumber, EPA Certified, OSHA 10..."
                    value={certificationsInput}
                    onChange={(e) => setCertificationsInput(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {certificationsInput.split(',').filter(s => s.trim()).map((s, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Location</CardTitle>
                <CardDescription>Your primary business address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={profile.address || ''}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    min="0"
                    value={profile.years_experience || 0}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, years_experience: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Areas</CardTitle>
                <CardDescription>Areas where you provide services (comma separated)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    placeholder="New York, Brooklyn, Queens, Manhattan..."
                    value={serviceAreasInput}
                    onChange={(e) => setServiceAreasInput(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {serviceAreasInput.split(',').filter(s => s.trim()).map((s, i) => (
                      <Badge key={i} variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {s.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

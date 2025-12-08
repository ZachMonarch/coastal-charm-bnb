import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { CheckCircle2, Clock, Star, Award, Briefcase, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function VendorProfileOverview() {
  const { user } = useAuth();
  
  const vendor = user?.vendor;
  const isVerified = vendor?.isVerified || false;
  const subscriptionStatus = user?.subscription?.status || 'inactive';
  
  return (
    <div className="space-y-6">
      {/* Header Card with Avatar */}
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={vendor?.avatarUrl || user?.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {vendor?.companyName?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {vendor?.companyName || 'Company Name'}
                </h2>
                {isVerified && (
                  <Badge className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {subscriptionStatus !== 'inactive' && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {subscriptionStatus.toUpperCase()}
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground mb-4">
                {user?.full_name || 'No description provided yet'}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="font-medium">{vendor?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-muted-foreground">Rating</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="font-medium">{vendor?.completedJobs || 0}</span>
                  <span className="text-muted-foreground">Jobs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{vendor?.responseTime || '24h'}</span>
                  <span className="text-muted-foreground">Response</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">N/A</span>
                  <span className="text-muted-foreground">Success</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user?.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{user.email}</span>
            </div>
          )}
          {user?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{user.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specialties & Certifications */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Specialties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {vendor?.specialties && vendor.specialties.length > 0 ? (
                vendor.specialties.map((specialty: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {specialty}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No specialties added yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {vendor?.certifications && vendor.certifications.length > 0 ? (
                vendor.certifications.map((cert: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
                    <Award className="h-3 w-3 mr-1" />
                    {cert}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No certifications added yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

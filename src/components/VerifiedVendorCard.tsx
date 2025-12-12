import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ReusableAvatar from './Avatar';
import { Star, Shield, CheckCircle2, Clock, Briefcase, Award, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { VerifiedVendor } from '@/hooks/useVerifiedVendors';

interface VerifiedVendorCardProps {
  vendor: VerifiedVendor;
  featured?: boolean;
}

export default function VerifiedVendorCard({ vendor, featured = false }: VerifiedVendorCardProps) {
  const subscriptionTierColors = {
    premium: 'from-primary to-primary-light',
    enterprise: 'from-feature-violet to-feature-violet-dark',
    basic: 'from-feature-sky to-feature-sky-dark',
    free: 'from-muted to-background'
  };

  const tierGradient = subscriptionTierColors[vendor.subscription_plan as keyof typeof subscriptionTierColors] || subscriptionTierColors.free;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300",
      "hover:shadow-2xl hover:-translate-y-2",
      "bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm",
      "border-2",
      featured ? "border-primary shadow-xl scale-105" : "border-border/50 hover:border-primary/50"
    )}>
      {/* Premium Verified Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "relative flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-gradient-to-r shadow-lg",
          tierGradient
        )}>
          <Shield className="h-4 w-4 text-white animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wide">
            Verified
          </span>
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Avatar and Company Info */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <ReusableAvatar
              url={vendor.avatar_url}
              name={vendor.company_name}
              size="xl"
              variant="vendor"
              className="ring-4 ring-primary/20 shadow-lg"
            />
            {vendor.insurance_verified && (
              <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1.5 shadow-lg">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {vendor.company_name}
            </h3>
            
            {/* Rating and Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{vendor.completed_jobs} jobs</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{vendor.response_time_hours}h response</span>
              </div>
            </div>

            {/* Subscription Tier Badge */}
            {vendor.subscription_plan !== 'free' && (
              <Badge variant="secondary" className={cn(
                "bg-gradient-to-r text-white font-semibold uppercase text-xs",
                tierGradient
              )}>
                {vendor.subscription_plan}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {vendor.description}
          </p>
        )}

        {/* Specialties */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Award className="h-4 w-4 text-primary" />
            <span>Specialties</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {vendor.specialties.slice(0, 4).map((specialty, index) => (
              <Badge key={index} variant="outline" className="bg-primary/5 border-primary/20 text-xs">
                {specialty}
              </Badge>
            ))}
            {vendor.specialties.length > 4 && (
              <Badge variant="outline" className="bg-muted text-xs">
                +{vendor.specialties.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Certifications & Verifications */}
        <div className="flex flex-wrap gap-2">
          {vendor.insurance_verified && (
            <Badge variant="secondary" className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
              <Shield className="h-3 w-3 mr-1" />
              Insured
            </Badge>
          )}
          {vendor.background_check_verified && (
            <Badge variant="secondary" className="bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Background Checked
            </Badge>
          )}
          {vendor.years_experience && vendor.years_experience > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40">
              <Briefcase className="h-3 w-3 mr-1" />
              {vendor.years_experience}+ Years
            </Badge>
          )}
        </div>

        {/* Location */}
        {vendor.service_areas && vendor.service_areas.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">
              Serves: {vendor.service_areas.slice(0, 3).join(', ')}
              {vendor.service_areas.length > 3 && ` +${vendor.service_areas.length - 3} more`}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-border/50">
          <Button asChild className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            <Link to={`/vendor/profile/${vendor.user_id}`}>
              View Profile
            </Link>
          </Button>
          {vendor.phone && (
            <Button variant="outline" asChild>
              <a href={`tel:${vendor.phone}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

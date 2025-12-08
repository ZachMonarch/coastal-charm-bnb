import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Star, Crown, Zap, CheckCircle } from 'lucide-react';

interface PremiumVerifiedBadgeProps {
  isVerified: boolean;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showText?: boolean;
}

export default function PremiumVerifiedBadge({
  isVerified,
  subscriptionTier = 'basic',
  size = 'md',
  animated = true,
  showText = true
}: PremiumVerifiedBadgeProps) {
  if (!isVerified) return null;

  const getIcon = () => {
    switch (subscriptionTier) {
      case 'enterprise':
        return <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />;
      case 'premium':
        return <Star className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />;
      default:
        return <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />;
    }
  };

  const getStyles = () => {
    const baseStyles = "font-medium transition-all duration-300";
    const animationStyles = animated ? "hover:scale-105 hover:shadow-lg" : "";
    
    switch (subscriptionTier) {
      case 'enterprise':
        return `${baseStyles} ${animationStyles} bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg`;
      case 'premium':
        return `${baseStyles} ${animationStyles} bg-gradient-to-r from-info to-info/60 text-white border-0 shadow-md`;
      default:
        return `${baseStyles} ${animationStyles} bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40`;
    }
  };

  const getText = () => {
    if (!showText) return '';
    
    switch (subscriptionTier) {
      case 'enterprise':
        return 'Elite Verified';
      case 'premium':
        return 'Premium Verified';
      default:
        return 'Verified';
    }
  };

  return (
    <Badge className={getStyles()}>
      {getIcon()}
      {showText && getText()}
      {animated && subscriptionTier !== 'basic' && (
        <Zap className="h-3 w-3 ml-1 animate-pulse" />
      )}
    </Badge>
  );
}
# Vendor System Guide

## Overview
The Monarch Property Management vendor system provides a comprehensive platform for vendors to manage their applications, projects, and business operations.

## Features

### Vendor Dashboard
- **Overview Tab**: Quick stats, recent activity, and profile completion progress
- **Projects Tab**: Browse and apply to available projects via VendorProjectBrowser
- **Applications Tab**: Track submitted applications and their status
- **Profile Tab**: Manage vendor profile information
- **Payments Tab**: Handle payment information and transactions
- **Subscription Tab**: Manage subscription plans and billing
- **Settings Tab**: Account settings, security, and preferences

### Key Components

#### VendorDashboardComplete
Main dashboard component with tabbed interface for all vendor functionality.

#### VendorProjectBrowser
Browse available projects with filtering and application capabilities.

#### VendorApplicationForm
Submit applications for specific projects with required information.

#### VendorAccountSettings
Manage account settings including:
- Security settings (password, 2FA)
- Notification preferences
- Privacy settings

#### File Upload System
- Profile photo upload to `profile-avatars` bucket
- Document uploads to `documents` bucket
- Property image uploads to `property-images` bucket

### Navigation Structure
```
/vendor/dashboard - Main vendor dashboard
/vendor/reports - Vendor performance reports
/vendor/dashboard?tab=settings - Account settings
```

### Storage Buckets
- `profile-avatars`: Public bucket for vendor profile photos
- `property-images`: Public bucket for property-related images
- `documents`: Private bucket for sensitive documents

### Security Features
- Row Level Security (RLS) policies on all tables
- Secure file upload with validation
- Role-based access control
- Subscription-based feature access

## Development Notes

### Performance Optimizations
- Fixed infinite loading loops in useVendorApplications hook
- Proper dependency arrays in useEffect hooks
- Efficient data fetching with optimized queries

### Error Handling
- Comprehensive error boundaries
- Graceful fallbacks for missing data
- User-friendly error messages

### Best Practices
- Use React Router for navigation (no window.location.href)
- Implement proper loading states
- Follow component composition patterns
- Maintain consistent styling with design system tokens
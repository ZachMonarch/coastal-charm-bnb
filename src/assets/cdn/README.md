# CDN Assets Directory

This directory contains optimized WebP images for professional use across the application.

## Structure

- `ui/` - User interface assets (logos, icons, branding)
- `properties/` - Property images optimized for fast loading
- `heroes/` - Hero section backgrounds and banners
- `team/` - Team member photos and company images

## Guidelines

- All images are in WebP format for optimal compression and quality
- Images are optimized for different breakpoints (mobile, tablet, desktop)
- Use semantic naming conventions for easy identification
- Images are served with appropriate lazy loading and caching headers

## Usage

```typescript
import monarchLogo from '@/assets/cdn/ui/monarch-logo.webp';
import luxuryProperty from '@/assets/cdn/properties/luxury-downtown.webp';
```

## Performance Benefits

- 25-50% smaller file sizes compared to JPEG/PNG
- Better compression without quality loss
- Native browser support across modern browsers
- Reduced bandwidth usage and faster load times
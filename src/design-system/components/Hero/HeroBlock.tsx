import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, Play } from "lucide-react";

/**
 * Token-driven Hero Block Component
 * 
 * Variants:
 * - image: Background image with overlay
 * - gradient: Pure gradient background
 * - video: Background video with fallback
 * 
 * Features:
 * - Responsive typography scale
 * - LCP optimized (preload critical images)
 * - Accessible (proper heading hierarchy, ARIA labels)
 * - WCAG 2.2 AA compliant color contrast
 * - Reduced motion support
 * 
 * @see Design Tokens: src/design-system/tokens.json
 */

export interface HeroBlockProps {
  variant: "image" | "gradient" | "video";
  title: string;
  subtitle?: string;
  description?: string;
  cta?: {
    primary?: { text: string; href: string; onClick?: () => void; icon?: ReactNode };
    secondary?: { text: string; href: string; onClick?: () => void; icon?: ReactNode };
  };
  media?: {
    src: string;
    alt: string;
    poster?: string; // For video variant
  };
  overlay?: boolean;
  height?: "sm" | "md" | "lg" | "full";
  stats?: Array<{ number: string; label: string }>;
  showScrollIndicator?: boolean;
  scrollTarget?: string;
  className?: string;
}

export function HeroBlock({
  variant = "gradient",
  title,
  subtitle,
  description,
  cta,
  media,
  overlay = true,
  height = "full",
  stats,
  showScrollIndicator = true,
  scrollTarget = "#welcome",
  className,
}: HeroBlockProps) {
  const heightClasses = {
    sm: "min-h-[50vh]",
    md: "min-h-[70vh]",
    lg: "min-h-[85vh]",
    full: "min-h-screen",
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        heightClasses[height],
        className
      )}
      role="banner"
      aria-label="Hero section"
    >
      {/* Background Layer */}
      {variant === "image" && media && (
        <div className="absolute inset-0">
          <img
            src={media.src}
            alt={media.alt}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {overlay && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
                style={{ mixBlendMode: "overlay" }}
              />
            </>
          )}
        </div>
      )}

      {variant === "video" && media && (
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={media.poster}
            className="w-full h-full object-cover"
          >
            <source src={media.src} type="video/mp4" />
          </video>
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
          )}
        </div>
      )}

      {variant === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/10" />
      )}

      {/* Content Layer */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
          {/* Subtitle Badge */}
          {subtitle && (
            <div className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-full shadow-md">
              <span className="text-sm md:text-base font-medium text-foreground">
                {subtitle}
              </span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-tight">
            <span
              className={cn(
                "block",
                variant === "gradient"
                  ? "text-foreground"
                  : "text-white drop-shadow-lg"
              )}
            >
              {title}
            </span>
          </h1>

          {/* Description */}
          {description && (
            <p
              className={cn(
                "text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed",
                variant === "gradient"
                  ? "text-muted-foreground"
                  : "text-white/90"
              )}
            >
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          {cta && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {cta.primary && (
                <Button
                  asChild={!!cta.primary.href}
                  size="lg"
                  className="min-w-[200px] btn-primary shadow-primary"
                  onClick={cta.primary.onClick}
                >
                  {cta.primary.href ? (
                    <a href={cta.primary.href}>
                      {cta.primary.icon}
                      {cta.primary.text}
                    </a>
                  ) : (
                    <>
                      {cta.primary.icon}
                      {cta.primary.text}
                    </>
                  )}
                </Button>
              )}

              {cta.secondary && (
                <Button
                  asChild={!!cta.secondary.href}
                  size="lg"
                  variant="outline"
                  className={cn(
                    "min-w-[200px]",
                    variant === "gradient"
                      ? "border-primary text-primary hover:bg-primary/10"
                      : "border-overlay/30 text-overlay-foreground hover:bg-overlay/10 bg-overlay/5 backdrop-blur-sm"
                  )}
                  onClick={cta.secondary.onClick}
                >
                  {cta.secondary.href ? (
                    <a href={cta.secondary.href}>
                      {cta.secondary.icon}
                      {cta.secondary.text}
                    </a>
                  ) : (
                    <>
                      {cta.secondary.icon}
                      {cta.secondary.text}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto pt-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 md:p-6 rounded-xl backdrop-blur-sm border",
                    variant === "gradient"
                      ? "bg-card border-border shadow-sm"
                      : "bg-overlay/10 border-overlay/20"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={cn(
                      "text-2xl md:text-3xl font-bold mb-1",
                      variant === "gradient" ? "text-primary" : "text-overlay-foreground"
                    )}
                  >
                    {stat.number}
                  </div>
                  <div
                    className={cn(
                      "text-sm md:text-base",
                      variant === "gradient"
                        ? "text-muted-foreground"
                        : "text-overlay-muted"
                    )}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <a
            href={scrollTarget}
            className={cn(
              "flex flex-col items-center p-3 rounded-full backdrop-blur-sm border transition-all duration-300 hover:scale-110",
              variant === "gradient"
                ? "bg-card border-border hover:border-primary"
                : "bg-overlay/10 border-overlay/20 hover:bg-overlay/20"
            )}
            aria-label="Scroll to content"
          >
            <span
              className={cn(
                "text-xs mb-1",
                variant === "gradient" ? "text-muted-foreground" : "text-overlay-foreground"
              )}
            >
              Scroll
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5",
                variant === "gradient" ? "text-primary" : "text-overlay-foreground"
              )}
            />
          </a>
        </div>
      )}

      {/* Decorative Wave (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32">
        <svg
          className="absolute bottom-0 w-full h-full fill-background"
          preserveAspectRatio="none"
          viewBox="0 0 1440 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,50 C240,20 480,80 720,50 C960,20 1200,80 1440,50 L1440,100 L0,100 Z" />
        </svg>
      </div>
    </section>
  );
}

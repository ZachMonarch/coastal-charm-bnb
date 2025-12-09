import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/**
 * Token-driven CTA Banner Component
 * 
 * Variants:
 * - light: Light background for dark content
 * - dark: Dark background for light content
 * - gradient: Branded gradient background
 * - image: Background image with overlay
 * 
 * Features:
 * - Responsive layout (stacked on mobile, horizontal on desktop)
 * - Support for 1-2 CTA buttons
 * - Optional background image
 * - Proper contrast for accessibility
 * 
 * @see Design Tokens: src/design-system/tokens.json
 */

export interface CTABannerProps {
  variant: "light" | "dark" | "gradient" | "image";
  title: string;
  description?: string;
  primaryCTA: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
  };
  secondaryCTA?: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
  };
  backgroundImage?: string;
  className?: string;
}

export function CTABanner({
  variant,
  title,
  description,
  primaryCTA,
  secondaryCTA,
  backgroundImage,
  className,
}: CTABannerProps) {
  const variantClasses = {
    light: "bg-gradient-to-r from-background to-accent/20",
    dark: "bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900",
    gradient: "bg-gradient-to-r from-primary to-primary-dark",
    image: "relative bg-gray-900",
  };

  const textColorClasses = {
    light: "text-foreground",
    dark: "text-white",
    gradient: "text-white",
    image: "text-white",
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 md:py-20 lg:py-24",
        variantClasses[variant],
        className
      )}
    >
      {/* Background Image (for image variant) */}
      {variant === "image" && backgroundImage && (
        <>
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </>
      )}

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Title */}
          <h2
            className={cn(
              "text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight",
              textColorClasses[variant]
            )}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={cn(
                "text-base md:text-lg lg:text-xl max-w-2xl mx-auto",
                variant === "light"
                  ? "text-muted-foreground"
                  : "text-white/90"
              )}
            >
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild={!!primaryCTA.href}
              size="lg"
              className={cn(
                "min-w-[180px] group",
                variant === "light" && "btn-primary",
                (variant === "dark" || variant === "gradient" || variant === "image") &&
                  "bg-white text-gray-900 hover:bg-white/90"
              )}
              onClick={primaryCTA.onClick}
            >
              {primaryCTA.href ? (
                <a href={primaryCTA.href}>
                  {primaryCTA.icon || <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                  {primaryCTA.text}
                </a>
              ) : (
                <>
                  {primaryCTA.icon || <ArrowRight className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                  {primaryCTA.text}
                </>
              )}
            </Button>

            {secondaryCTA && (
              <Button
                asChild={!!secondaryCTA.href}
                size="lg"
                variant="outline"
                className={cn(
                  "min-w-[180px]",
                  variant === "light" && "border-primary text-primary hover:bg-primary/10",
                  (variant === "dark" || variant === "gradient" || variant === "image") &&
                    "border-overlay/30 text-overlay-foreground hover:bg-overlay/10 bg-overlay/5 backdrop-blur-sm"
                )}
                onClick={secondaryCTA.onClick}
              >
                {secondaryCTA.href ? (
                  <a href={secondaryCTA.href}>
                    {secondaryCTA.icon}
                    {secondaryCTA.text}
                  </a>
                ) : (
                  <>
                    {secondaryCTA.icon}
                    {secondaryCTA.text}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      {variant !== "image" && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </>
      )}
    </section>
  );
}

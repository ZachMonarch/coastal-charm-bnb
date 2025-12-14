import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeroCTA {
  label: string;
  href: string;
  variant?: "default" | "outline" | "secondary";
}

type HeroHeight = 'sm' | 'md' | 'lg' | 'full';

interface PageHeroWithImageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: HeroCTA[];
  backgroundImage: string;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
  /** Use compact rectangular format for dashboard pages */
  compact?: boolean;
  /** Height control: sm (128-160px), md (160-208px), lg (208-288px), full (40-50vh) */
  height?: HeroHeight;
}

const heightClasses: Record<HeroHeight, string> = {
  sm: "h-32 md:h-40",
  md: "h-40 md:h-52",
  lg: "h-52 md:h-72",
  full: "min-h-[40vh] md:min-h-[50vh]",
};

export default function PageHeroWithImage({
  title,
  description,
  icon: Icon,
  actions,
  backgroundImage,
  overlayOpacity = 0.6,
  className,
  children,
  compact = false,
  height = "full",
}: PageHeroWithImageProps) {
  const effectiveHeight = compact && height === "full" ? "md" : height;
  
  return (
    <section
      className={cn(
        "relative flex items-center overflow-hidden",
        heightClasses[effectiveHeight],
        compact ? "rounded-xl mb-6" : "justify-center",
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={backgroundImage}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Gradient Overlay for text readability */}
      <div
        className={cn(
          "absolute inset-0 z-[1]",
          compact 
            ? "bg-gradient-to-r from-black/70 via-black/50 to-black/40" 
            : "bg-gradient-to-b from-black/50 via-black/60 to-black/80"
        )}
        style={{ opacity: overlayOpacity }}
      />

      {/* Decorative Elements - only show for non-compact */}
      {!compact && (
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "relative z-10",
        compact 
          ? "px-6 py-4 md:py-6 text-left w-full" 
          : "container px-4 py-16 md:py-24 text-center"
      )}>
        <div className={compact ? "flex items-center gap-4" : ""}>
          {/* Icon */}
          {Icon && (
            <div className={cn(
              "relative",
              compact ? "flex-shrink-0" : "inline-block mb-6"
            )}>
              {!compact && <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />}
              <div className={cn(
                "relative rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-xl",
                compact ? "p-2.5 md:p-3" : "p-4 md:p-5"
              )}>
                <Icon className={cn(
                  "text-primary-foreground",
                  compact ? "h-5 w-5 md:h-6 md:w-6" : "h-10 w-10 md:h-12 md:w-12"
                )} />
              </div>
            </div>
          )}

          <div className={compact ? "flex-1 min-w-0" : ""}>
            {/* Title */}
            <h1 className={cn(
              "font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]",
              compact 
                ? "text-xl md:text-2xl lg:text-3xl mb-1" 
                : "text-3xl md:text-5xl lg:text-6xl mb-4 md:mb-6"
            )}>
              {title}
            </h1>

            {/* Description */}
            {description && (
              <p className={cn(
                "text-white/90 font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]",
                compact 
                  ? "text-sm md:text-base line-clamp-1" 
                  : "text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-8 [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]"
              )}>
                {description}
              </p>
            )}
          </div>

          {/* Actions - inline for compact */}
          {compact && actions && actions.length > 0 && (
            <div className="flex gap-2 flex-shrink-0">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  asChild
                  size="sm"
                  variant="secondary"
                  className="shadow-md"
                >
                  <Link to={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Actions - below content for non-compact */}
        {!compact && actions && actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                asChild
                size="lg"
                variant={action.variant === "outline" ? "heroAction" : "heroAction"}
                className="text-lg px-8 py-6 shadow-lg"
              >
                <Link to={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}

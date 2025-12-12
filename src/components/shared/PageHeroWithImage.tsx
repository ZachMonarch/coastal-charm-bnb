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

interface PageHeroWithImageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: HeroCTA[];
  backgroundImage: string;
  overlayOpacity?: number;
  className?: string;
  children?: React.ReactNode;
}

export default function PageHeroWithImage({
  title,
  description,
  icon: Icon,
  actions,
  backgroundImage,
  overlayOpacity = 0.6,
  className,
  children,
}: PageHeroWithImageProps) {
  return (
    <section
      className={cn(
        "relative min-h-[40vh] md:min-h-[50vh] flex items-center justify-center overflow-hidden",
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
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/60 to-black/80"
        style={{ opacity: overlayOpacity }}
      />

      {/* Decorative Elements */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-16 md:py-24 text-center">
        {/* Icon */}
        {Icon && (
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative p-4 md:p-5 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl">
              <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-lg md:text-xl lg:text-2xl text-white max-w-3xl mx-auto mb-8 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] font-medium [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
            {description}
          </p>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
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

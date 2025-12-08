import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardHeroWithImageProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  imageUrl: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DashboardHeroWithImage({
  title,
  subtitle,
  icon: Icon,
  imageUrl,
  className,
  children,
}: DashboardHeroWithImageProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl mb-8", className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60 dark:from-background/98 dark:via-background/85 dark:to-background/70" />
        {/* Brand Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12">
        <div className="flex items-start gap-6">
          {Icon && (
            <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30 border-2 border-primary/30">
              <Icon className="w-10 h-10 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent dark:from-white dark:via-white dark:to-white/80">
                {title}
              </span>
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                {subtitle}
              </p>
            )}
            {children && <div className="mt-6">{children}</div>}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-4 left-1/2 w-48 h-24 bg-secondary/10 rounded-full blur-3xl" />
      
      {/* Border Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
    </div>
  );
}

import { useState } from "react";
import { HeroBlock } from "@/design-system/components/Hero/HeroBlock";
import { Card } from "@/design-system/components/Card/Card";
import { CTABanner } from "@/design-system/components/CTA/CTABanner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Building,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { analytics } from "@/lib/analytics";
import { HomePageSEO } from "@/components/SEO/EnhancedSEO";
import heroImageWebP from "@/assets/hero-image-new.webp";

/**
 * Design System Showcase Page
 * 
 * Demonstrates all Phase 1, 2, 3 components and features:
 * - Token-driven theming
 * - Component variants
 * - Accessibility features
 * - Analytics integration
 * - SEO optimization
 */
export default function DesignSystemShowcase() {
  const { theme, setTheme } = useTheme();
  const [selectedVariant, setSelectedVariant] = useState<"default" | "elevated" | "neumorphic" | "glass">("default");

  return (
    <>
      <HomePageSEO />
      
      <div className="min-h-screen">
        {/* Hero Block Demo */}
        <HeroBlock
          variant="image"
          title="Monarch Design System"
          subtitle="✨ Production-Ready • Token-Driven • WCAG 2.2 AA"
          description="A comprehensive design system with 100+ tokens, accessible components, and complete Phase 1-2-3 implementation."
          media={{
            src: heroImageWebP,
            alt: "Monarch Property Management Design System",
          }}
          cta={{
            primary: {
              text: "Explore Components",
              href: "#components",
              icon: <Sparkles className="mr-2 h-5 w-5" />,
            },
            secondary: {
              text: "View Tokens",
              href: "#tokens",
            },
          }}
          stats={[
            { number: "100+", label: "Design Tokens" },
            { number: "10+", label: "Components" },
            { number: "100%", label: "WCAG AA" },
          ]}
          overlay
          height="full"
          showScrollIndicator
        />

        {/* Theme Toggle Section */}
        <section className="py-16 bg-gradient-to-b from-background to-accent/5">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge className="mb-4">Phase 1: Design Tokens</Badge>
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Theme System
              </h2>
              <p className="text-muted-foreground text-lg">
                Automatic dark mode with system preference detection
              </p>

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => {
                    setTheme("light");
                    analytics.trackEvent("hero_cta_click", { theme: "light" });
                  }}
                  className="min-w-[120px]"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => {
                    setTheme("dark");
                    analytics.trackEvent("hero_cta_click", { theme: "dark" });
                  }}
                  className="min-w-[120px]"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="min-w-[120px]"
                >
                  System
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Semantic Colors Demo */}
        <section id="tokens" className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <Badge>Phase 1: Semantic Colors</Badge>
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  WCAG 2.2 AA Compliant Colors
                </h2>
                <p className="text-muted-foreground">
                  All semantic colors meet 4.5:1 contrast minimum
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert className="border-success/50 bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertTitle className="text-success">Success State</AlertTitle>
                  <AlertDescription className="text-success-foreground/80">
                    Contrast: 4.8:1 — Operations completed successfully
                  </AlertDescription>
                </Alert>

                <Alert className="border-warning/50 bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-warning">Warning State</AlertTitle>
                  <AlertDescription className="text-warning-foreground/80">
                    Contrast: 5.2:1 — Please review this action
                  </AlertDescription>
                </Alert>

                <Alert className="border-error/50 bg-error/10">
                  <XCircle className="h-4 w-4 text-error" />
                  <AlertTitle className="text-error">Error State</AlertTitle>
                  <AlertDescription className="text-error-foreground/80">
                    Contrast: 4.7:1 — Operation failed, please retry
                  </AlertDescription>
                </Alert>

                <Alert className="border-info/50 bg-info/10">
                  <Info className="h-4 w-4 text-info" />
                  <AlertTitle className="text-info">Info State</AlertTitle>
                  <AlertDescription className="text-info-foreground/80">
                    Contrast: 5.1:1 — Additional information available
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </section>

        {/* Card Variants Demo */}
        <section id="components" className="py-16 bg-gradient-to-b from-accent/5 to-background">
          <div className="container">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <Badge>Phase 2: Component Library</Badge>
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  Card Component Variants
                </h2>
                <p className="text-muted-foreground">
                  Token-driven, interactive, and fully accessible
                </p>
              </div>

              {/* Variant Selector */}
              <div className="flex justify-center gap-2 flex-wrap">
                {(["default", "elevated", "neumorphic", "glass"] as const).map((v) => (
                  <Button
                    key={v}
                    variant={selectedVariant === v ? "default" : "outline"}
                    onClick={() => setSelectedVariant(v)}
                    size="sm"
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                  variant={selectedVariant}
                  interactive
                  equalHeight
                  header={
                    <div className="space-y-2">
                      <Building className="h-8 w-8 text-primary" />
                      <h3 className="text-xl font-semibold">Property A</h3>
                    </div>
                  }
                  footer={
                    <Button className="w-full" size="sm">
                      View Details
                    </Button>
                  }
                >
                  <p className="text-muted-foreground">
                    Modern luxury apartment with stunning city views and premium amenities.
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl font-bold text-primary">$2,500</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                </Card>

                <Card
                  variant={selectedVariant}
                  interactive
                  equalHeight
                  header={
                    <div className="space-y-2">
                      <Building className="h-8 w-8 text-primary" />
                      <h3 className="text-xl font-semibold">Property B</h3>
                    </div>
                  }
                  footer={
                    <Button className="w-full" size="sm">
                      View Details
                    </Button>
                  }
                >
                  <p className="text-muted-foreground">
                    Spacious family townhouse with private garden and garage space.
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl font-bold text-primary">$3,200</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                </Card>

                <Card
                  variant={selectedVariant}
                  interactive
                  equalHeight
                  header={
                    <div className="space-y-2">
                      <Building className="h-8 w-8 text-primary" />
                      <h3 className="text-xl font-semibold">Property C</h3>
                    </div>
                  }
                  footer={
                    <Button className="w-full" size="sm" disabled>
                      Rented
                    </Button>
                  }
                >
                  <p className="text-muted-foreground">
                    Cozy studio loft in vibrant downtown location near transit.
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl font-bold text-muted-foreground">$1,800</span>
                    <Badge variant="secondary">Rented</Badge>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Variants */}
        <CTABanner
          variant="gradient"
          title="Ready to Experience the Design System?"
          description="All components are production-ready, accessible, and fully documented"
          primaryCTA={{
            text: "View Documentation",
            href: "/docs/design-system/tokens.md",
          }}
          secondaryCTA={{
            text: "Explore Components",
            href: "#components",
          }}
        />

        <CTABanner
          variant="light"
          title="Accessibility First Design"
          description="WCAG 2.2 AA compliant with keyboard navigation, screen reader support, and reduced motion detection"
          primaryCTA={{
            text: "Learn More",
            href: "/docs",
          }}
        />

        {/* Analytics & SEO Demo */}
        <section className="py-16 bg-gradient-to-b from-background to-primary/5">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge>Phase 3: Analytics & SEO</Badge>
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Analytics & SEO Ready
              </h2>
              <p className="text-muted-foreground text-lg">
                Built-in analytics instrumentation and comprehensive SEO with JSON-LD structured data
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                <Card variant="elevated">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Analytics Events</h3>
                    <ul className="text-left space-y-2 text-muted-foreground">
                      <li>✅ Page view tracking</li>
                      <li>✅ CTA click events</li>
                      <li>✅ Form submissions</li>
                      <li>✅ User interactions</li>
                      <li>✅ Ready for PostHog/GA4</li>
                    </ul>
                  </div>
                </Card>

                <Card variant="elevated">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">SEO Features</h3>
                    <ul className="text-left space-y-2 text-muted-foreground">
                      <li>✅ JSON-LD schemas</li>
                      <li>✅ OpenGraph & Twitter Cards</li>
                      <li>✅ Canonical URLs</li>
                      <li>✅ Sitemap generation</li>
                      <li>✅ Mobile optimization</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Summary */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <Badge>Complete System</Badge>
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  All Phases Complete
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card variant="elevated" className="text-center">
                  <div className="space-y-4">
                    <div className="text-5xl font-bold text-primary">1</div>
                    <h3 className="text-xl font-semibold">Design Tokens</h3>
                    <p className="text-muted-foreground">
                      100+ tokens covering colors, spacing, typography, shadows, and motion
                    </p>
                  </div>
                </Card>

                <Card variant="elevated" className="text-center">
                  <div className="space-y-4">
                    <div className="text-5xl font-bold text-primary">2</div>
                    <h3 className="text-xl font-semibold">Components</h3>
                    <p className="text-muted-foreground">
                      Token-driven, accessible components with variants and full WCAG 2.2 AA compliance
                    </p>
                  </div>
                </Card>

                <Card variant="elevated" className="text-center">
                  <div className="space-y-4">
                    <div className="text-5xl font-bold text-primary">3</div>
                    <h3 className="text-xl font-semibold">Integration</h3>
                    <p className="text-muted-foreground">
                      Analytics, SEO, and CMS infrastructure ready for production deployment
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

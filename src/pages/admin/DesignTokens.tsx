import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Palette, Type, Square, Layers, Zap, Moon, Sun, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import tokens from '@/design-system/tokens.json';

// Color swatch component with side-by-side comparison
const ColorSwatch = ({ 
  name, 
  lightValue, 
  darkValue, 
  description,
  showComparison 
}: { 
  name: string; 
  lightValue: string; 
  darkValue: string;
  description?: string;
  showComparison: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(`hsl(${value})`);
    setCopied(true);
    toast.success(`Copied: hsl(${value})`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      {showComparison ? (
        <div className="flex gap-2">
          {/* Light mode swatch */}
          <div className="flex-1 space-y-2">
            <div 
              className="h-16 rounded-lg border border-border/50 shadow-sm cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: `hsl(${lightValue})` }}
              onClick={() => copyToClipboard(lightValue)}
              title="Click to copy"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sun className="h-3 w-3" />
              <span>Light</span>
            </div>
          </div>
          {/* Dark mode swatch */}
          <div className="flex-1 space-y-2">
            <div 
              className="h-16 rounded-lg border border-border/50 shadow-sm cursor-pointer transition-transform hover:scale-105"
              style={{ backgroundColor: `hsl(${darkValue})` }}
              onClick={() => copyToClipboard(darkValue)}
              title="Click to copy"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Moon className="h-3 w-3" />
              <span>Dark</span>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="h-16 rounded-lg border border-border/50 shadow-sm cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: `hsl(${lightValue})` }}
          onClick={() => copyToClipboard(lightValue)}
          title="Click to copy"
        />
      )}
      <div className="mt-2">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">
          {lightValue}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {copied && (
        <div className="absolute top-2 right-2 bg-success text-success-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  );
};

// Typography preview component
const TypographyPreview = ({ size, value, lineHeight, pixels }: { 
  size: string; 
  value: string; 
  lineHeight: string;
  pixels: string;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
    <div className="flex-1">
      <p style={{ fontSize: value, lineHeight }} className="font-medium">
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
    <div className="text-right">
      <Badge variant="outline" className="font-mono text-xs">{size}</Badge>
      <p className="text-xs text-muted-foreground mt-1">{value} / {pixels}</p>
    </div>
  </div>
);

// Spacing preview component
const SpacingPreview = ({ name, value, pixels }: { name: string; value: string; pixels: string }) => (
  <div className="flex items-center gap-4 py-2">
    <div className="w-16 text-sm font-medium">{name}</div>
    <div 
      className="h-6 bg-primary rounded"
      style={{ width: value }}
    />
    <div className="text-xs text-muted-foreground font-mono">{value} ({pixels})</div>
  </div>
);

// Shadow preview component
const ShadowPreview = ({ name, value, description }: { name: string; value: string; description?: string }) => (
  <div className="space-y-2">
    <div 
      className="h-24 rounded-lg bg-card border border-border/50"
      style={{ boxShadow: value }}
    />
    <p className="font-medium text-sm">{name}</p>
    <p className="text-xs font-mono text-muted-foreground truncate">{value}</p>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

// Border radius preview component
const BorderRadiusPreview = ({ name, value, pixels }: { name: string; value: string; pixels?: string }) => (
  <div className="text-center space-y-2">
    <div 
      className="h-16 w-16 mx-auto bg-primary"
      style={{ borderRadius: value }}
    />
    <p className="font-medium text-sm">{name}</p>
    <p className="text-xs font-mono text-muted-foreground">{value}{pixels ? ` (${pixels})` : ''}</p>
  </div>
);

// Motion preview component
const MotionPreview = ({ name, value, description }: { name: string; value: string; description?: string }) => {
  const [animate, setAnimate] = useState(false);

  return (
    <div className="space-y-2">
      <div 
        className="h-16 w-16 bg-primary rounded-lg cursor-pointer"
        style={{ 
          transition: `transform ${value}`,
          transform: animate ? 'translateX(100px)' : 'translateX(0)'
        }}
        onClick={() => setAnimate(!animate)}
      />
      <p className="font-medium text-sm">{name}</p>
      <p className="text-xs font-mono text-muted-foreground">{value}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Button size="sm" variant="outline" onClick={() => setAnimate(!animate)}>
        Play
      </Button>
    </div>
  );
};

export default function DesignTokens() {
  const [showComparison, setShowComparison] = useState(true);

  // Brand colors
  const brandColors = [
    { name: 'Primary (Gold)', light: '32 82% 33%', dark: '34 85% 55%', desc: 'Monarch Gold - WCAG AA (4.64:1)' },
    { name: 'Primary Light', light: '32 80% 40%', dark: '36 80% 62%', desc: 'Lighter variant for hover' },
    { name: 'Primary Dark', light: '28 85% 28%', dark: '30 90% 45%', desc: 'Darker variant for pressed' },
    { name: 'Secondary (Teal)', light: '175 35% 35%', dark: '175 40% 50%', desc: 'Teal from MONARCH text' },
  ];

  // Semantic colors
  const semanticColors = [
    { name: 'Success', light: '155 60% 35%', dark: '155 55% 45%', desc: 'Success state' },
    { name: 'Warning', light: '38 92% 50%', dark: '38 90% 55%', desc: 'Warning state' },
    { name: 'Error', light: '0 75% 55%', dark: '0 70% 60%', desc: 'Error state' },
    { name: 'Info', light: '200 70% 50%', dark: '200 65% 55%', desc: 'Info state' },
  ];

  // Surface colors
  const surfaceColors = [
    { name: 'Background', light: '40 25% 97%', dark: '0 0% 8%', desc: 'Main background' },
    { name: 'Card', light: '0 0% 100%', dark: '0 0% 12%', desc: 'Card surface' },
    { name: 'Muted', light: '40 15% 94%', dark: '0 0% 18%', desc: 'Muted surface' },
    { name: 'Foreground', light: '0 0% 12%', dark: '0 0% 96%', desc: 'Primary text' },
    { name: 'Muted Foreground', light: '0 0% 40%', dark: '0 0% 70%', desc: 'Secondary text' },
  ];

  // Chart colors
  const chartColors = [
    { name: 'Chart 1', light: '32 82% 33%', dark: '34 85% 55%', desc: 'Monarch Gold' },
    { name: 'Chart 2', light: '175 35% 45%', dark: '175 45% 55%', desc: 'Teal' },
    { name: 'Chart 3', light: '200 60% 60%', dark: '200 55% 65%', desc: 'Sky Blue' },
    { name: 'Chart 4', light: '25 50% 55%', dark: '28 55% 60%', desc: 'Earth Brown' },
    { name: 'Chart 5', light: '155 40% 50%', dark: '155 45% 55%', desc: 'Sage Green' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Palette className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Design Tokens</h1>
                  <p className="text-muted-foreground">Monarch Property Management Design System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="comparison" className="text-sm">Side-by-side comparison</Label>
                <Switch 
                  id="comparison" 
                  checked={showComparison} 
                  onCheckedChange={setShowComparison}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList variant="colorful" className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid gap-1 p-1.5">
            <TabsTrigger variant="colorful" value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger variant="colorful" value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger variant="colorful" value="spacing" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Spacing
            </TabsTrigger>
            <TabsTrigger variant="colorful" value="shadows" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Shadows
            </TabsTrigger>
            <TabsTrigger variant="colorful" value="radius" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Radius
            </TabsTrigger>
            <TabsTrigger variant="colorful" value="motion" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Motion
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            {/* Brand Colors */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  Brand Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {brandColors.map((color) => (
                    <ColorSwatch
                      key={color.name}
                      name={color.name}
                      lightValue={color.light}
                      darkValue={color.dark}
                      description={color.desc}
                      showComparison={showComparison}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Semantic Colors */}
            <Card className="border-2 border-success/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-success" />
                  Semantic Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {semanticColors.map((color) => (
                    <ColorSwatch
                      key={color.name}
                      name={color.name}
                      lightValue={color.light}
                      darkValue={color.dark}
                      description={color.desc}
                      showComparison={showComparison}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Surface Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Surface Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {surfaceColors.map((color) => (
                    <ColorSwatch
                      key={color.name}
                      name={color.name}
                      lightValue={color.light}
                      darkValue={color.dark}
                      description={color.desc}
                      showComparison={showComparison}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart Colors */}
            <Card className="border-2 border-info/20">
              <CardHeader>
                <CardTitle>Chart Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {chartColors.map((color) => (
                    <ColorSwatch
                      key={color.name}
                      name={color.name}
                      lightValue={color.light}
                      darkValue={color.dark}
                      description={color.desc}
                      showComparison={showComparison}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Font Families</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-lg font-medium mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Inter (Body Font)
                  </p>
                  <p className="text-muted-foreground font-mono text-sm">
                    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-lg font-medium mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Playfair Display (Headings)
                  </p>
                  <p className="text-muted-foreground font-mono text-sm">
                    'Playfair Display', Georgia, serif
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-lg font-medium mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    JetBrains Mono (Code)
                  </p>
                  <p className="text-muted-foreground font-mono text-sm">
                    'JetBrains Mono', Monaco, monospace
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(tokens.typography.fontSize).map(([size, config]) => (
                  <TypographyPreview
                    key={size}
                    size={size}
                    value={config.value}
                    lineHeight={config.lineHeight}
                    pixels={config.pixels}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Weights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(tokens.typography.fontWeight).map(([weight, config]) => (
                  <div key={weight} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <p className="text-lg" style={{ fontWeight: Number(config.value) }}>
                      {weight.charAt(0).toUpperCase() + weight.slice(1)} - The quick brown fox
                    </p>
                    <Badge variant="outline" className="font-mono">{config.value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing">
            <Card>
              <CardHeader>
                <CardTitle>Spacing Scale</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(tokens.spacing).map(([name, config]) => (
                  <SpacingPreview
                    key={name}
                    name={name}
                    value={config.value}
                    pixels={config.pixels}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shadows Tab */}
          <TabsContent value="shadows">
            <Card>
              <CardHeader>
                <CardTitle>Shadow Elevations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {Object.entries(tokens.shadow).map(([name, config]) => (
                    <ShadowPreview
                      key={name}
                      name={name}
                      value={config.value}
                      description={config.description}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Border Radius Tab */}
          <TabsContent value="radius">
            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-6">
                  {Object.entries(tokens.borderRadius).map(([name, config]) => (
                    <BorderRadiusPreview
                      key={name}
                      name={name}
                      value={config.value}
                      pixels={'pixels' in config ? config.pixels : undefined}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Motion Tab */}
          <TabsContent value="motion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {Object.entries(tokens.motion.duration).map(([name, config]) => (
                    <MotionPreview
                      key={name}
                      name={name}
                      value={config.value}
                      description={config.description}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Easing Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(tokens.motion.easing).map(([name, config]) => (
                    <div key={name} className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <p className="font-medium">{name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{config.value}</p>
                      {config.description && (
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

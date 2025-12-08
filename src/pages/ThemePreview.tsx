import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Moon, Sun, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { statusColors, priorityColors, paymentStatusColors, iconColors, chartColorArray } from "@/utils/themeColors";

export default function ThemePreview() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Design System Preview</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive visual verification of all design tokens and components
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="mr-2 h-5 w-5" /> : <Moon className="mr-2 h-5 w-5" />}
            Toggle {theme === "dark" ? "Light" : "Dark"} Mode
          </Button>
        </div>

        {/* Color Palette Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette (CSS Variables)</CardTitle>
            <CardDescription>Core semantic colors from index.css</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'Background', var: 'background', text: 'foreground' },
                { name: 'Foreground', var: 'foreground', text: 'background' },
                { name: 'Card', var: 'card', text: 'card-foreground' },
                { name: 'Primary', var: 'primary', text: 'primary-foreground' },
                { name: 'Secondary', var: 'secondary', text: 'secondary-foreground' },
                { name: 'Muted', var: 'muted', text: 'muted-foreground' },
                { name: 'Accent', var: 'accent', text: 'accent-foreground' },
                { name: 'Success', var: 'success', text: 'success-foreground' },
                { name: 'Warning', var: 'warning', text: 'warning-foreground' },
                { name: 'Destructive', var: 'destructive', text: 'destructive-foreground' },
                { name: 'Info', var: 'info', text: 'info-foreground' },
                { name: 'Border', var: 'border', text: 'foreground' },
              ].map(({ name, var: cssVar, text }) => (
                <div key={name} className="space-y-2">
                  <div
                    className="h-20 rounded-lg border flex items-center justify-center"
                    style={{ backgroundColor: `hsl(var(--${cssVar}))`, color: `hsl(var(--${text}))` }}
                  >
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">--{cssVar}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Badge Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
            <CardDescription>All status types with theme-aware colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(statusColors).map(([status, className]) => (
                <div key={status} className="space-y-2">
                  <Badge className={className}>{status.replace(/_/g, ' ')}</Badge>
                  <p className="text-xs text-muted-foreground">{status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Levels</CardTitle>
            <CardDescription>Priority badge variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(priorityColors).map(([priority, className]) => (
                <Badge key={priority} className={className}>
                  {priority.toUpperCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Indicators</CardTitle>
            <CardDescription>Payment state variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(paymentStatusColors).map(([status, className]) => (
                <Badge key={status} className={className}>
                  {status.toUpperCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Icon Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Color Variants</CardTitle>
            <CardDescription>Semantic icon colors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-8">
              {Object.entries(iconColors).map(([type, className]) => (
                <div key={type} className="flex items-center gap-2">
                  {type === 'success' && <CheckCircle2 className={`h-8 w-8 ${className}`} />}
                  {type === 'warning' && <AlertTriangle className={`h-8 w-8 ${className}`} />}
                  {type === 'error' && <XCircle className={`h-8 w-8 ${className}`} />}
                  {type === 'info' && <Info className={`h-8 w-8 ${className}`} />}
                  {type === 'muted' && <Info className={`h-8 w-8 ${className}`} />}
                  {type === 'primary' && <CheckCircle2 className={`h-8 w-8 ${className}`} />}
                  <span className="text-sm text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Chart Color Palette</CardTitle>
            <CardDescription>Theme-aware chart colors using CSS variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {chartColorArray.map((color, index) => (
                <div key={index} className="space-y-2">
                  <div
                    className="h-20 rounded-lg border"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-muted-foreground text-center">Chart {index + 1}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Card Variants</CardTitle>
            <CardDescription>Different card styles</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card style</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Using bg-card and text-card-foreground</p>
              </CardContent>
            </Card>
            
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Primary Border</CardTitle>
                <CardDescription>Highlighted card</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">border-primary accent</p>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Muted Background</CardTitle>
                <CardDescription>Subtle variant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">bg-muted surface</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Alert States */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Components</CardTitle>
            <CardDescription>Success, warning, error, info states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-success/10 border-success/30">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">Success</AlertTitle>
              <AlertDescription className="text-success/80">
                Operation completed successfully with all validations passed.
              </AlertDescription>
            </Alert>

            <Alert className="bg-warning/10 border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Warning</AlertTitle>
              <AlertDescription className="text-warning/80">
                Please review the following items before proceeding.
              </AlertDescription>
            </Alert>

            <Alert className="bg-destructive/10 border-destructive/30">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive">Error</AlertTitle>
              <AlertDescription className="text-destructive/80">
                An error occurred during processing. Please try again.
              </AlertDescription>
            </Alert>

            <Alert className="bg-info/10 border-info/30">
              <Info className="h-4 w-4 text-info" />
              <AlertTitle className="text-info">Information</AlertTitle>
              <AlertDescription className="text-info/80">
                Additional information to help you complete this task.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Inputs, buttons, and controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Text Input</label>
                <Input placeholder="Enter text..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Disabled Input</label>
                <Input placeholder="Disabled..." disabled />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox id="check1" checked />
                <label htmlFor="check1" className="text-sm text-foreground">Checked</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="check2" />
                <label htmlFor="check2" className="text-sm text-foreground">Unchecked</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="switch1" checked />
                <label htmlFor="switch1" className="text-sm text-foreground">On</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="switch2" />
                <label htmlFor="switch2" className="text-sm text-foreground">Off</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>Font sizes and weights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Heading 1 - 4xl Bold</h1>
            <h2 className="text-3xl font-bold text-foreground">Heading 2 - 3xl Bold</h2>
            <h3 className="text-2xl font-semibold text-foreground">Heading 3 - 2xl Semibold</h3>
            <h4 className="text-xl font-semibold text-foreground">Heading 4 - xl Semibold</h4>
            <p className="text-base text-foreground">Body text - base Regular</p>
            <p className="text-sm text-muted-foreground">Small text - sm Muted</p>
            <p className="text-xs text-muted-foreground">Extra small text - xs Muted</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

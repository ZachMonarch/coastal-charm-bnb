import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Shimmer, ShimmerCard } from '@/components/ui/shimmer';
import { EmptyState, NoDataState, NoSearchResultsState, NoFilesState } from '@/components/ui/empty-state';
import { 
  Layers, Square, Type, AlertCircle, CheckCircle, XCircle, Info,
  Copy, Check, Settings, User, Bell, Star, Zap, Heart, Play, Inbox, Search, FileX
} from 'lucide-react';
import { toast } from 'sonner';

// Code preview component
const CodePreview = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-4 rounded-lg bg-muted/50 border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-xs font-mono text-muted-foreground">JSX</span>
        <Button variant="ghost" size="sm" onClick={copyCode}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="p-4 text-sm font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Props control panel
const PropsPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
    <h4 className="font-medium text-sm flex items-center gap-2">
      <Settings className="h-4 w-4" />
      Props
    </h4>
    {children}
  </div>
);

export default function ComponentPlayground() {
  // Button state
  const [buttonVariant, setButtonVariant] = useState<'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'>('default');
  const [buttonSize, setButtonSize] = useState<'default' | 'sm' | 'lg' | 'icon'>('default');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Badge state
  const [badgeVariant, setBadgeVariant] = useState<'default' | 'secondary' | 'destructive' | 'outline'>('default');

  // Card state
  const [cardVariant, setCardVariant] = useState('default');

  // Progress state
  const [progressValue, setProgressValue] = useState([65]);

  // Alert state
  const [alertVariant, setAlertVariant] = useState<'default' | 'destructive'>('default');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10 border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20">
              <Layers className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Component Playground</h1>
              <p className="text-muted-foreground">Interactive testing ground for all UI components</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="buttons" className="space-y-6">
          <TabsList variant="colorful" className="flex-wrap h-auto gap-2 p-2">
            <TabsTrigger variant="colorful" value="buttons">Buttons</TabsTrigger>
            <TabsTrigger variant="colorful" value="badges">Badges</TabsTrigger>
            <TabsTrigger variant="colorful" value="cards">Cards</TabsTrigger>
            <TabsTrigger variant="colorful" value="tabs">Tab Styles</TabsTrigger>
            <TabsTrigger variant="colorful" value="forms">Form Elements</TabsTrigger>
            <TabsTrigger variant="colorful" value="feedback">Feedback</TabsTrigger>
            <TabsTrigger variant="colorful" value="loading">Loading States</TabsTrigger>
            <TabsTrigger variant="colorful" value="data">Data Display</TabsTrigger>
          </TabsList>

          {/* Buttons */}
          <TabsContent value="buttons" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Button Variants</CardTitle>
                  <CardDescription>All available button styles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Live Preview */}
                  <div className="p-8 rounded-lg bg-muted/30 border border-dashed border-border flex items-center justify-center">
                    <Button 
                      variant={buttonVariant} 
                      size={buttonSize} 
                      disabled={buttonDisabled || buttonLoading}
                    >
                      {buttonLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Click me'
                      )}
                    </Button>
                  </div>

                  {/* Props Controls */}
                  <PropsPanel>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Variant</Label>
                        <Select value={buttonVariant} onValueChange={(v: any) => setButtonVariant(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="destructive">Destructive</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                            <SelectItem value="secondary">Secondary</SelectItem>
                            <SelectItem value="ghost">Ghost</SelectItem>
                            <SelectItem value="link">Link</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <Select value={buttonSize} onValueChange={(v: any) => setButtonSize(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="sm">Small</SelectItem>
                            <SelectItem value="lg">Large</SelectItem>
                            <SelectItem value="icon">Icon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="disabled" 
                          checked={buttonDisabled} 
                          onCheckedChange={(c) => setButtonDisabled(!!c)} 
                        />
                        <Label htmlFor="disabled">Disabled</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="loading" 
                          checked={buttonLoading} 
                          onCheckedChange={(c) => setButtonLoading(!!c)} 
                        />
                        <Label htmlFor="loading">Loading</Label>
                      </div>
                    </div>
                  </PropsPanel>

                  <CodePreview code={`<Button variant="${buttonVariant}" size="${buttonSize}"${buttonDisabled ? ' disabled' : ''}>
  Click me
</Button>`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Button Variants</CardTitle>
                  <CardDescription>Quick reference for all styles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon"><Star className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button className="btn-ripple">With Ripple</Button>
                    <Button className="btn-golden-shimmer text-white">Golden Shimmer</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Badge Variants</CardTitle>
                <CardDescription>Status indicators and labels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-8 rounded-lg bg-muted/30 border border-dashed border-border flex items-center justify-center gap-4">
                  <Badge variant={badgeVariant}>Badge Text</Badge>
                </div>

                <PropsPanel>
                  <div className="space-y-2">
                    <Label>Variant</Label>
                    <Select value={badgeVariant} onValueChange={(v: any) => setBadgeVariant(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="destructive">Destructive</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PropsPanel>

                <div className="space-y-4">
                  <h4 className="font-medium">Status Badges</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-success/10 text-success border-success/20">Success</Badge>
                    <Badge className="bg-warning/10 text-warning border-warning/20">Warning</Badge>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">Error</Badge>
                    <Badge className="bg-info/10 text-info border-info/20">Info</Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20">Primary</Badge>
                  </div>
                </div>

                <CodePreview code={`<Badge variant="${badgeVariant}">Badge Text</Badge>

{/* Status Badges */}
<Badge className="bg-success/10 text-success border-success/20">Success</Badge>
<Badge className="bg-warning/10 text-warning border-warning/20">Warning</Badge>`} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards */}
          <TabsContent value="cards" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="card-hover-lift">
                <CardHeader>
                  <CardTitle>Hover Lift</CardTitle>
                  <CardDescription>Card with lift animation on hover</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Hover over this card to see the lift effect.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover-glow">
                <CardHeader>
                  <CardTitle>Hover Glow</CardTitle>
                  <CardDescription>Card with glow effect on hover</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Hover over this card to see the glow effect.
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Glass Card</CardTitle>
                  <CardDescription>Glassmorphism style card</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    A glass-like frosted effect.
                  </p>
                </CardContent>
              </Card>

              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Neumorphic</CardTitle>
                  <CardDescription>Soft UI neumorphic style</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Soft shadows for depth.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-brand">
                <CardHeader>
                  <CardTitle>Brand Card</CardTitle>
                  <CardDescription>Card with brand accent</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Subtle brand gradient overlay.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle>Interactive</CardTitle>
                  <CardDescription>Card with border glow</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Glowing border on hover.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Styles */}
          <TabsContent value="tabs" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Default Tabs</CardTitle>
                  <CardDescription>Standard tab style with subtle background</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tab1">
                    <TabsList>
                      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                      <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1" className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Content for Tab 1</p>
                    </TabsContent>
                    <TabsContent value="tab2" className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Content for Tab 2</p>
                    </TabsContent>
                    <TabsContent value="tab3" className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Content for Tab 3</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pills Tabs</CardTitle>
                  <CardDescription>Rounded pill-style tabs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tab1">
                    <TabsList variant="pills">
                      <TabsTrigger variant="pills" value="tab1">Tab 1</TabsTrigger>
                      <TabsTrigger variant="pills" value="tab2">Tab 2</TabsTrigger>
                      <TabsTrigger variant="pills" value="tab3">Tab 3</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1" className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Content for Tab 1</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Underline Tabs</CardTitle>
                  <CardDescription>Minimal underline indicator</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tab1">
                    <TabsList variant="underline">
                      <TabsTrigger variant="underline" value="tab1">Tab 1</TabsTrigger>
                      <TabsTrigger variant="underline" value="tab2">Tab 2</TabsTrigger>
                      <TabsTrigger variant="underline" value="tab3">Tab 3</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1" className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Content for Tab 1</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Colorful Tabs</CardTitle>
                  <CardDescription>Gradient-style colorful tabs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tab1">
                    <TabsList variant="colorful">
                      <TabsTrigger variant="colorful" value="tab1">Tab 1</TabsTrigger>
                      <TabsTrigger variant="colorful" value="tab2">Tab 2</TabsTrigger>
                      <TabsTrigger variant="colorful" value="tab3">Tab 3</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1" className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Content for Tab 1</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Form Elements */}
          <TabsContent value="forms" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input Variants</CardTitle>
                  <CardDescription>Enhanced input fields with colorful focus states</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Input</Label>
                    <Input placeholder="Default input..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Colorful Input</Label>
                    <Input variant="colorful" placeholder="Colorful focus..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Filled Input</Label>
                    <Input variant="filled" placeholder="Filled style..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Success Input</Label>
                    <Input variant="success" placeholder="Success state..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Warning Input</Label>
                    <Input variant="warning" placeholder="Warning state..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Textarea with Character Count</Label>
                    <Textarea variant="colorful" showCount maxLength={200} placeholder="Type here..." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Selection Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Default Select</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Option 1</SelectItem>
                        <SelectItem value="2">Option 2</SelectItem>
                        <SelectItem value="3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Colorful Select</Label>
                    <Select>
                      <SelectTrigger variant="colorful">
                        <SelectValue placeholder="Colorful focus..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Option A</SelectItem>
                        <SelectItem value="2">Option B</SelectItem>
                        <SelectItem value="3">Option C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Success Select</Label>
                    <Select>
                      <SelectTrigger variant="success">
                        <SelectValue placeholder="Success state..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Valid Option 1</SelectItem>
                        <SelectItem value="2">Valid Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Checkboxes</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox id="check1" />
                      <Label htmlFor="check1">Option A</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="check2" defaultChecked />
                      <Label htmlFor="check2">Option B (checked)</Label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Radio Group</Label>
                    <RadioGroup defaultValue="opt1">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="opt1" id="opt1" />
                        <Label htmlFor="opt1">Option 1</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="opt2" id="opt2" />
                        <Label htmlFor="opt2">Option 2</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="switch">Switch</Label>
                    <Switch id="switch" />
                  </div>

                  <div className="space-y-2">
                    <Label>Slider: {progressValue[0]}%</Label>
                    <Slider value={progressValue} onValueChange={setProgressValue} max={100} step={1} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Default Alert</AlertTitle>
                    <AlertDescription>This is a default informational alert.</AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error Alert</AlertTitle>
                    <AlertDescription>Something went wrong. Please try again.</AlertDescription>
                  </Alert>
                  <Alert className="border-success/50 bg-success/10 text-success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success Alert</AlertTitle>
                    <AlertDescription>Operation completed successfully!</AlertDescription>
                  </Alert>
                  <Alert className="border-warning/50 bg-warning/10 text-warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warning Alert</AlertTitle>
                    <AlertDescription>Please review before continuing.</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress & Toasts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Progress Bars</Label>
                    <Progress value={25} className="h-2" />
                    <Progress value={50} className="h-3" />
                    <Progress value={75} className="h-4" />
                    <Progress value={100} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <Label>Toast Notifications</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => toast.success('Success!')}>
                        Success Toast
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => toast.error('Error!')}>
                        Error Toast
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info('Info message')}>
                        Info Toast
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => toast.warning('Warning!')}>
                        Warning Toast
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Loading States */}
          <TabsContent value="loading" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skeleton Loaders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-[60%]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shimmer Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Shimmer variant="card" />
                  <div className="flex items-center gap-4">
                    <Shimmer variant="avatar" />
                    <div className="flex-1 space-y-2">
                      <Shimmer variant="text" />
                      <Shimmer variant="text" className="w-3/4" />
                    </div>
                  </div>
                  <Shimmer variant="button" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Display */}
          <TabsContent value="data" className="space-y-6">
            {/* Empty States Section */}
            <Card>
              <CardHeader>
                <CardTitle>Empty States</CardTitle>
                <CardDescription>Colorful empty state components for various scenarios</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EmptyState
                  icon={Inbox}
                  title="No items"
                  description="Get started by adding your first item."
                  variant="colorful"
                  size="sm"
                  action={{ label: "Add Item", onClick: () => toast.success("Add clicked!") }}
                />
                <NoSearchResultsState size="sm" />
                <NoFilesState size="sm" action={{ label: "Upload", onClick: () => toast.info("Upload clicked!") }} />
              </CardContent>
            </Card>

            {/* Progress Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Variants</CardTitle>
                <CardDescription>Enhanced progress bars with color variants and animations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default</Label>
                  <Progress value={65} />
                </div>
                <div className="space-y-2">
                  <Label>Success</Label>
                  <Progress value={80} variant="success" />
                </div>
                <div className="space-y-2">
                  <Label>Warning</Label>
                  <Progress value={45} variant="warning" />
                </div>
                <div className="space-y-2">
                  <Label>Error</Label>
                  <Progress value={25} variant="error" />
                </div>
                <div className="space-y-2">
                  <Label>Gradient with Animation</Label>
                  <Progress value={70} variant="gradient" animated showValue />
                </div>
                <div className="space-y-2">
                  <Label>Size Variants</Label>
                  <div className="space-y-2">
                    <Progress value={60} size="sm" variant="info" />
                    <Progress value={60} size="default" variant="info" />
                    <Progress value={60} size="lg" variant="info" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Avatars</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>MD</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>LG</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary text-primary-foreground">XL</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 ring-2 ring-success ring-offset-2">
                      <AvatarFallback className="bg-success text-success-foreground">OK</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10 ring-2 ring-warning ring-offset-2">
                      <AvatarFallback className="bg-warning text-warning-foreground">WN</AvatarFallback>
                    </Avatar>
                    <Avatar className="h-10 w-10 ring-2 ring-destructive ring-offset-2">
                      <AvatarFallback className="bg-destructive text-destructive-foreground">ER</AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Icons with Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="icon-hover p-3 rounded-lg bg-muted">
                      <Star className="h-6 w-6" />
                    </div>
                    <div className="icon-hover p-3 rounded-lg bg-muted">
                      <Heart className="h-6 w-6" />
                    </div>
                    <div className="icon-hover p-3 rounded-lg bg-muted">
                      <Bell className="h-6 w-6" />
                    </div>
                    <div className="icon-hover p-3 rounded-lg bg-muted">
                      <Settings className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary animate-glow">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 text-success">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 text-warning">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive">
                      <XCircle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

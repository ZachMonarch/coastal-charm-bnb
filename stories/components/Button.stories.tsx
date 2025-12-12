import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Play, Download, Settings } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "hero", "heroSolid", "neumorphic", "glass"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Click me",
    variant: "default",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="warning">Warning</Button>
      </div>
      <div className="flex flex-wrap gap-4 bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-lg">
        <Button variant="hero">Hero</Button>
        <Button variant="heroSolid">Hero Solid</Button>
        <Button variant="neumorphic">Neumorphic</Button>
        <Button variant="glass">Glass</Button>
        <Button variant="shimmer">Shimmer</Button>
        <Button variant="gradient">Gradient</Button>
        <Button variant="glow">Glow</Button>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Play className="mr-2 h-4 w-4" />
        Play Video
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button size="icon">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const TokenMapping: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Token Mapping</h3>
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Property</th>
            <th className="text-left p-2">Token</th>
            <th className="text-left p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2">Background (default)</td>
            <td className="p-2 font-mono text-xs">colors.brand.primary</td>
            <td className="p-2 font-mono text-xs">hsl(25 85% 55%)</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Text Color</td>
            <td className="p-2 font-mono text-xs">colors.brand.primaryForeground</td>
            <td className="p-2 font-mono text-xs">hsl(0 0% 100%)</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Border Radius</td>
            <td className="p-2 font-mono text-xs">borderRadius.md</td>
            <td className="p-2 font-mono text-xs">0.5rem (8px)</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Padding</td>
            <td className="p-2 font-mono text-xs">spacing.md, spacing.sm</td>
            <td className="p-2 font-mono text-xs">1rem, 0.5rem</td>
          </tr>
          <tr>
            <td className="p-2">Transition</td>
            <td className="p-2 font-mono text-xs">motion.duration.normal</td>
            <td className="p-2 font-mono text-xs">300ms</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

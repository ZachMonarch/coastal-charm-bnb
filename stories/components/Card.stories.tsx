import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "@/design-system/components/Card/Card";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "elevated", "neumorphic", "glass"],
    },
    interactive: { control: "boolean" },
    equalHeight: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: <p>This is a default card with standard elevation.</p>,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card variant="default">
        <h3 className="font-semibold mb-2">Default Card</h3>
        <p className="text-sm text-muted-foreground">Standard card with border and subtle shadow.</p>
      </Card>
      <Card variant="elevated">
        <h3 className="font-semibold mb-2">Elevated Card</h3>
        <p className="text-sm text-muted-foreground">Card with prominent shadow for emphasis.</p>
      </Card>
      <Card variant="neumorphic">
        <h3 className="font-semibold mb-2">Neumorphic Card</h3>
        <p className="text-sm text-muted-foreground">Soft UI design with inset shadows.</p>
      </Card>
      <Card variant="glass">
        <h3 className="font-semibold mb-2">Glass Card</h3>
        <p className="text-sm text-muted-foreground">Glassmorphic effect with backdrop blur.</p>
      </Card>
    </div>
  ),
};

export const WithHeaderFooter: Story = {
  args: {
    variant: "elevated",
    header: <h3 className="text-lg font-bold">Property Details</h3>,
    footer: (
      <div className="flex gap-2">
        <Button size="sm">View Details</Button>
        <Button size="sm" variant="outline">
          Contact Agent
        </Button>
      </div>
    ),
    children: (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">123 Main Street, Downtown</p>
        <p className="text-2xl font-bold text-primary">$2,500/mo</p>
        <p className="text-sm">2 bed • 2 bath • 1,200 sqft</p>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    variant: "default",
    interactive: true,
    children: <p>Click me! I have hover effects.</p>,
    onClick: () => alert("Card clicked!"),
  },
};

export const TokenMapping: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Token Mapping</h3>
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Variant</th>
            <th className="text-left p-2">Token Property</th>
            <th className="text-left p-2">Token Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2">Default</td>
            <td className="p-2 font-mono text-xs">shadow.sm</td>
            <td className="p-2 font-mono text-xs">0 1px 2px 0 rgb(0 0 0 / 0.05)</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Elevated</td>
            <td className="p-2 font-mono text-xs">shadow.lg</td>
            <td className="p-2 font-mono text-xs">0 10px 15px -3px rgb(0 0 0 / 0.1)</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">All</td>
            <td className="p-2 font-mono text-xs">borderRadius.lg</td>
            <td className="p-2 font-mono text-xs">0.75rem (12px)</td>
          </tr>
          <tr>
            <td className="p-2">Interactive</td>
            <td className="p-2 font-mono text-xs">motion.duration.normal</td>
            <td className="p-2 font-mono text-xs">300ms</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

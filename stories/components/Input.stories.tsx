import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Mail, Lock } from "lucide-react";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
    disabled: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-80">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="email" placeholder="Email" className="pl-9" />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="password" placeholder="Password" className="pl-9" />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input placeholder="Default state" />
      <Input placeholder="Disabled state" disabled />
      <Input placeholder="With value" defaultValue="John Doe" />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="tel" placeholder="Phone input" />
      <Input type="url" placeholder="URL input" />
    </div>
  ),
};

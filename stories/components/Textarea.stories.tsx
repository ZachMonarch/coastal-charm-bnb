import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  argTypes: {
    disabled: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-96">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Enter your message..." />
    </div>
  ),
};

export const WithContent: Story = {
  args: {
    defaultValue: "This is a pre-filled textarea with some content. You can edit this text.",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "This textarea is disabled",
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Textarea placeholder="Small (min-h-[80px])" className="min-h-[80px]" />
      <Textarea placeholder="Medium (min-h-[120px])" className="min-h-[120px]" />
      <Textarea placeholder="Large (min-h-[200px])" className="min-h-[200px]" />
    </div>
  ),
};

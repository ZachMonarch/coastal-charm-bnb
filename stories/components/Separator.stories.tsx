import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@/components/ui/separator";

const meta: Meta<typeof Separator> = {
  title: "Components/Separator",
  component: Separator,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm">This is content above the separator</p>
      <Separator />
      <p className="text-sm">This is content below the separator</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center space-x-4">
      <div className="text-sm">Item 1</div>
      <Separator orientation="vertical" />
      <div className="text-sm">Item 2</div>
      <Separator orientation="vertical" />
      <div className="text-sm">Item 3</div>
    </div>
  ),
};

export const InContent: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Property Details</h3>
        <p className="text-sm text-muted-foreground">
          View and manage property information
        </p>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Address:</span>
          <span className="font-medium">123 Main St</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium">Apartment</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bedrooms:</span>
          <span className="font-medium">2</span>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Rent:</span>
          <span className="font-medium">$2,500/mo</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium text-green-600">Available</span>
        </div>
      </div>
    </div>
  ),
};

export const MenuDivider: Story = {
  render: () => (
    <div className="w-64 p-2 border rounded-lg">
      <div className="space-y-1">
        <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md">
          Profile
        </button>
        <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md">
          Settings
        </button>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1">
        <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md">
          Help Center
        </button>
        <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md">
          Documentation
        </button>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1">
        <button className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md">
          Log Out
        </button>
      </div>
    </div>
  ),
};

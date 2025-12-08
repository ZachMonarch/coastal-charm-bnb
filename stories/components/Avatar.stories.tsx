import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.jpg" alt="User" />
      <AvatarFallback>MP</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
        <AvatarFallback className="text-xl">LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-24 w-24">
        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
        <AvatarFallback className="text-2xl">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const UserList: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent">
        <Avatar>
          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">John Doe</p>
          <p className="text-xs text-muted-foreground">Property Manager</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent">
        <Avatar>
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Jane Smith</p>
          <p className="text-xs text-muted-foreground">Tenant</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">AB</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">Alex Brown</p>
          <p className="text-xs text-muted-foreground">Vendor</p>
        </div>
      </div>
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-4">
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" />
        <AvatarFallback>JS</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback>+5</AvatarFallback>
      </Avatar>
    </div>
  ),
};

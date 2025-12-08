import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  argTypes: {
    disabled: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled">Disabled checkbox</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled checked />
        <Label htmlFor="disabled-checked">Disabled checked</Label>
      </div>
    </div>
  ),
};

export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Select Amenities</h3>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="parking" defaultChecked />
          <Label htmlFor="parking">Parking</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="gym" defaultChecked />
          <Label htmlFor="gym">Gym/Fitness Center</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="pool" />
          <Label htmlFor="pool">Swimming Pool</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="pets" />
          <Label htmlFor="pets">Pet Friendly</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="laundry" defaultChecked />
          <Label htmlFor="laundry">In-Unit Laundry</Label>
        </div>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox id="email" defaultChecked />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="email" className="text-sm font-medium leading-none">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your properties
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="sms" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="sms" className="text-sm font-medium leading-none">
                SMS Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get text message alerts for urgent matters
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="push" defaultChecked />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="push" className="text-sm font-medium leading-none">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive in-app notifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

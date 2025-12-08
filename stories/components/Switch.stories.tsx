import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  argTypes: {
    disabled: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off">Disabled (Off)</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="disabled-on" disabled checked />
        <Label htmlFor="disabled-on">Disabled (On)</Label>
      </div>
    </div>
  ),
};

export const SettingsPanel: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Property Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="available">Available for Rent</Label>
              <p className="text-sm text-muted-foreground">
                Show this property in public listings
              </p>
            </div>
            <Switch id="available" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="featured">Featured Property</Label>
              <p className="text-sm text-muted-foreground">
                Display prominently on homepage
              </p>
            </div>
            <Switch id="featured" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pets">Pet Friendly</Label>
              <p className="text-sm text-muted-foreground">
                Allow tenants with pets
              </p>
            </div>
            <Switch id="pets" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="parking">Parking Available</Label>
              <p className="text-sm text-muted-foreground">
                Dedicated parking space included
              </p>
            </div>
            <Switch id="parking" defaultChecked />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch id="email-notif" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notif">SMS Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get urgent alerts via text
              </p>
            </div>
            <Switch id="sms-notif" />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const CompactList: Story = {
  render: () => (
    <div className="space-y-2 max-w-sm">
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label htmlFor="notifications" className="cursor-pointer">
          Notifications
        </Label>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label htmlFor="auto-save" className="cursor-pointer">
          Auto-save
        </Label>
        <Switch id="auto-save" defaultChecked />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label htmlFor="dark-mode" className="cursor-pointer">
          Dark Mode
        </Label>
        <Switch id="dark-mode" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label htmlFor="analytics" className="cursor-pointer">
          Analytics
        </Label>
        <Switch id="analytics" defaultChecked />
      </div>
    </div>
  ),
};

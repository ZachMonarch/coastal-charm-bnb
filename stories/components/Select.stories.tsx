import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a property type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apartment">Apartment</SelectItem>
        <SelectItem value="house">House</SelectItem>
        <SelectItem value="condo">Condo</SelectItem>
        <SelectItem value="townhouse">Townhouse</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[280px]">
      <Label htmlFor="property-type">Property Type</Label>
      <Select>
        <SelectTrigger id="property-type">
          <SelectValue placeholder="Select a type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apartment">Apartment</SelectItem>
          <SelectItem value="house">House</SelectItem>
          <SelectItem value="condo">Condo</SelectItem>
          <SelectItem value="townhouse">Townhouse</SelectItem>
          <SelectItem value="studio">Studio</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const MultipleSelects: Story = {
  render: () => (
    <div className="space-y-4 w-[280px]">
      <div className="space-y-2">
        <Label>Property Status</Label>
        <Select defaultValue="available">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="maintenance">Under Maintenance</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Bedrooms</Label>
        <Select defaultValue="2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="1">1 Bedroom</SelectItem>
            <SelectItem value="2">2 Bedrooms</SelectItem>
            <SelectItem value="3">3 Bedrooms</SelectItem>
            <SelectItem value="4+">4+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price Range</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1000">$0 - $1,000</SelectItem>
            <SelectItem value="1000-2000">$1,000 - $2,000</SelectItem>
            <SelectItem value="2000-3000">$2,000 - $3,000</SelectItem>
            <SelectItem value="3000+">$3,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
      </SelectContent>
    </Select>
  ),
};

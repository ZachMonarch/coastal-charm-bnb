import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const meta: Meta = {
  title: "Components/PropertySelect",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <div style={{ marginBottom: 8 }}>
        <Label htmlFor="property-select">Property</Label>
      </div>
      <Select>
        <SelectTrigger id="property-select">
          <SelectValue placeholder="Select a property" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="prop_1">123 Main St — Unit 1</SelectItem>
          <SelectItem value="prop_2">456 Oak Ave — Bldg A</SelectItem>
          <SelectItem value="prop_3">789 Pine Dr — Apt 12</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

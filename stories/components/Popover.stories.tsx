import type { Meta, StoryObj } from "@storybook/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Quick Actions</h4>
          <p className="text-sm text-muted-foreground">
            Perform common tasks quickly from here.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Edit Property</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Update Property</h4>
            <p className="text-sm text-muted-foreground">
              Make changes to property details.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                defaultValue="Downtown Loft"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                defaultValue="$2,500"
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                defaultValue="Available"
                className="col-span-2 h-8"
              />
            </div>
          </div>
          <Button size="sm">Save Changes</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const PropertyFilters: Story = {
  render: () => (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Price Range</Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Set Price Range</h4>
              <p className="text-sm text-muted-foreground">
                Filter properties by monthly rent.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="min-price">Min</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="0"
                  className="col-span-2 h-8"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="max-price">Max</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="10000"
                  className="col-span-2 h-8"
                />
              </div>
            </div>
            <Button size="sm">Apply Filter</Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Move-in Date
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Select Move-in Date</h4>
              <p className="text-sm text-muted-foreground">
                Choose your preferred move-in timeframe.
              </p>
            </div>
            <div className="grid gap-2">
              <Button variant="outline" size="sm">
                Immediately
              </Button>
              <Button variant="outline" size="sm">
                Within 30 days
              </Button>
              <Button variant="outline" size="sm">
                Within 60 days
              </Button>
              <Button variant="outline" size="sm">
                Within 90 days
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="flex gap-4 justify-center items-center min-h-[400px]">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p className="text-sm">Popover content on top</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p className="text-sm">Popover content on right</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p className="text-sm">Popover content on bottom</p>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p className="text-sm">Popover content on left</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const QuickActions: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Quick Actions</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-2">
          <Button variant="outline" size="sm" className="justify-start">
            View Property Details
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            Edit Property
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            Manage Bookings
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            Download Reports
          </Button>
          <div className="border-t pt-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-destructive w-full"
            >
              Delete Property
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

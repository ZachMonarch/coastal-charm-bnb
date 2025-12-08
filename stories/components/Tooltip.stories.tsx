import type { Meta, StoryObj } from "@storybook/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, Settings } from "lucide-react";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline">
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Additional information</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click for help documentation</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open settings panel</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const PropertyManagementTooltips: Story = {
  render: () => (
    <TooltipProvider>
      <div className="space-y-4 p-6 border rounded-lg max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Property Status</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                <strong>Available:</strong> Property is ready for new tenants<br />
                <strong>Rented:</strong> Currently occupied<br />
                <strong>Maintenance:</strong> Undergoing repairs
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Verification Status</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Properties must be verified before appearing in public listings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Occupancy Rate</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Percentage of rented units across all your properties</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  ),
};

export const Positions: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-4 justify-center items-center min-h-[300px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Tooltip on top</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Tooltip on right</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Tooltip on bottom</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Tooltip on left</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const RichContent: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">View Details</Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Property Information</p>
            <ul className="text-sm space-y-1">
              <li>• 2 Bedrooms, 2 Bathrooms</li>
              <li>• 1,200 sqft</li>
              <li>• $2,500/month</li>
              <li>• Available Now</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

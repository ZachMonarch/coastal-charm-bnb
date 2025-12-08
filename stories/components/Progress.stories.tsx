import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

const meta: Meta<typeof Progress> = {
  title: "Components/Progress",
  component: Progress,
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Starting</span>
          <span className="text-muted-foreground">0%</span>
        </div>
        <Progress value={0} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Quarter Complete</span>
          <span className="text-muted-foreground">25%</span>
        </div>
        <Progress value={25} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Halfway There</span>
          <span className="text-muted-foreground">50%</span>
        </div>
        <Progress value={50} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Almost Done</span>
          <span className="text-muted-foreground">75%</span>
        </div>
        <Progress value={75} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Complete</span>
          <span className="text-muted-foreground">100%</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  ),
};

export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 10;
        });
      }, 500);

      return () => clearInterval(timer);
    }, []);

    return (
      <div className="space-y-2 w-full max-w-md">
        <div className="flex justify-between text-sm">
          <span>Processing...</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    );
  },
};

export const PropertyOnboarding: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-4">Property Setup Progress</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Basic Information</span>
              <span className="text-green-600 font-medium">✓ Complete</span>
            </div>
            <Progress value={100} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Property Details</span>
              <span className="text-primary font-medium">70% Complete</span>
            </div>
            <Progress value={70} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Photos & Media</span>
              <span className="text-muted-foreground">40% Complete</span>
            </div>
            <Progress value={40} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pricing & Availability</span>
              <span className="text-muted-foreground">Not Started</span>
            </div>
            <Progress value={0} />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-lg font-bold text-primary">52%</span>
        </div>
        <Progress value={52} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          Complete all sections to publish your property
        </p>
      </div>
    </div>
  ),
};

export const WithColors: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <span className="text-sm">Default (Primary)</span>
        <Progress value={60} />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Success</span>
        <Progress value={100} className="[&>div]:bg-green-500" />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Warning</span>
        <Progress value={45} className="[&>div]:bg-yellow-500" />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Danger</span>
        <Progress value={20} className="[&>div]:bg-red-500" />
      </div>
    </div>
  ),
};

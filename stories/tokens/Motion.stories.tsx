import type { Meta, StoryObj } from "@storybook/react";
import { tokens } from "@/lib/theme";
import { useState } from "react";

const meta: Meta = {
  title: "Tokens/Motion",
  parameters: {
    layout: "padded",
  },
};

export default meta;

export const MotionDurations: StoryObj = {
  render: () => {
    const [active, setActive] = useState<string | null>(null);

    return (
      <div className="space-y-8 p-8">
        <h2 className="text-2xl font-bold mb-6">Motion Durations</h2>
        {Object.entries(tokens.motion.duration).map(([speed, config]) => (
          <div key={speed} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold">{speed}</div>
                <div className="text-muted-foreground">{config.value}</div>
              </div>
              <button
                onClick={() => setActive(speed)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Animate
              </button>
            </div>
            <div className="relative h-12 bg-muted rounded-md overflow-hidden">
              <div
                className="absolute h-full w-16 bg-primary rounded-md"
                style={{
                  transform: active === speed ? "translateX(400px)" : "translateX(0)",
                  transition: `transform ${config.value} ${tokens.motion.easing.default.value}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const MotionEasings: StoryObj = {
  render: () => {
    const [active, setActive] = useState<string | null>(null);

    return (
      <div className="space-y-8 p-8">
        <h2 className="text-2xl font-bold mb-6">Motion Easings</h2>
        {Object.entries(tokens.motion.easing).map(([easing, config]) => (
          <div key={easing} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold">{easing}</div>
                <div className="text-muted-foreground font-mono text-xs">{config.value}</div>
              </div>
              <button
                onClick={() => setActive(easing)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Animate
              </button>
            </div>
            <div className="relative h-12 bg-muted rounded-md overflow-hidden">
              <div
                className="absolute h-full w-16 bg-primary rounded-md"
                style={{
                  transform: active === easing ? "translateX(400px)" : "translateX(0)",
                  transition: `transform 500ms ${config.value}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
};

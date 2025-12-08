import type { Meta, StoryObj } from "@storybook/react";
import { tokens } from "@/lib/theme";

const meta: Meta = {
  title: "Tokens/Shadows",
  parameters: {
    layout: "padded",
  },
};

export default meta;

export const ShadowScale: StoryObj = {
  render: () => (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold mb-6">Shadow Elevations</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(tokens.shadow).map(([size, config]) => (
          <div key={size} className="space-y-2">
            <div
              className="h-32 rounded-lg bg-card"
              style={{ boxShadow: config.value }}
            />
            <div className="text-sm">
              <div className="font-semibold">{size}</div>
              <div className="text-muted-foreground font-mono text-xs">
                {config.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { tokens } from "@/lib/theme";

const meta: Meta = {
  title: "Tokens/Spacing",
  parameters: {
    layout: "padded",
  },
};

export default meta;

export const SpacingScale: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Spacing Scale</h2>
      {Object.entries(tokens.spacing).map(([size, config]) => (
        <div key={size} className="flex items-center gap-4">
          <div className="w-32 text-sm font-semibold">{size}</div>
          <div
            className="bg-primary"
            style={{
              width: config.value,
              height: "24px",
            }}
          />
          <div className="text-sm text-muted-foreground">
            {config.value} ({config.pixels})
          </div>
        </div>
      ))}
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { tokens } from "@/lib/theme";

const meta: Meta = {
  title: "Tokens/Typography",
  parameters: {
    layout: "padded",
  },
};

export default meta;

export const FontSizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Font Size Scale</h2>
      {Object.entries(tokens.typography.fontSize).map(([size, config]) => (
        <div key={size} className="border-b pb-4">
          <div
            className="mb-2"
            style={{
              fontSize: config.value,
              lineHeight: config.lineHeight,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">{size}</span>: {config.value} / {config.lineHeight} ({config.pixels})
          </div>
        </div>
      ))}
    </div>
  ),
};

export const FontFamilies: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Body Font (Inter)</h3>
        <p style={{ fontFamily: tokens.typography.fontFamily.body.value }}>
          The quick brown fox jumps over the lazy dog. This is the primary body font used throughout the Monarch Property Management platform.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Heading Font (Playfair Display)</h3>
        <p style={{ fontFamily: tokens.typography.fontFamily.heading.value, fontSize: "2rem" }}>
          The quick brown fox jumps over the lazy dog
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Monospace Font</h3>
        <p style={{ fontFamily: tokens.typography.fontFamily.mono.value }}>
          const monarchToken = "25 85% 55%";
        </p>
      </div>
    </div>
  ),
};

export const FontWeights: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold mb-6">Font Weight Scale</h2>
      {Object.entries(tokens.typography.fontWeight).map(([weight, value]) => (
        <div key={weight} style={{ fontWeight: value.value }}>
          {weight} ({value.value}): The quick brown fox jumps over the lazy dog
        </div>
      ))}
    </div>
  ),
};

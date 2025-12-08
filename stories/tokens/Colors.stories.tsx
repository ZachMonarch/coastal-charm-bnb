import type { Meta, StoryObj } from "@storybook/react";
import { tokens, hslToColor } from "@/lib/theme";

const meta: Meta = {
  title: "Tokens/Colors",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const BrandColors: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Brand Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(tokens.colors.brand).map(([name, value]) => (
            <div key={name} className="space-y-2">
              <div
                className="h-24 rounded-lg border shadow-md"
                style={{ backgroundColor: hslToColor(value) }}
              />
              <div className="text-sm">
                <div className="font-semibold">{name}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const SemanticColors: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Semantic Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(tokens.colors.semantic).map(([name, value]) => (
            <div key={name} className="space-y-2">
              <div
                className="h-24 rounded-lg border shadow-md flex items-center justify-center"
                style={{ backgroundColor: hslToColor(value) }}
              >
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{name}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const SurfaceColors: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Surface Colors (Light Mode)</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(tokens.colors.surface.light).map(([name, obj]) => (
            <div key={name} className="space-y-2">
              <div
                className="h-24 rounded-lg border shadow-md"
                style={{ backgroundColor: hslToColor(obj.value) }}
              />
              <div className="text-sm">
                <div className="font-semibold">{name}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {obj.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Surface Colors (Dark Mode)</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(tokens.colors.surface.dark).map(([name, obj]) => (
            <div key={name} className="space-y-2">
              <div
                className="h-24 rounded-lg border border-white/20 shadow-md"
                style={{ backgroundColor: hslToColor(obj.value) }}
              />
              <div className="text-sm">
                <div className="font-semibold">{name}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {obj.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

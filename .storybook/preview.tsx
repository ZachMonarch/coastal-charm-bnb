import type { Preview } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    backgrounds: {
      disable: true,
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "focus-order-semantics",
            enabled: true,
          },
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    (Story) => (
      <div className="min-h-screen bg-background text-foreground p-8">
        <Story />
      </div>
    ),
  ],
};

export default preview;

import type { Meta, StoryObj } from '@storybook/react';
import ThemeToggle from '@/components/ThemeToggle';

/**
 * ThemeToggle - Light/Dark mode switcher
 * 
 * Features:
 * - localStorage persistence
 * - System preference detection (prefers-color-scheme)
 * - Smooth icon transitions
 * - WCAG 2.2 AA compliant touch targets (44x44px)
 * - Keyboard accessible
 */
const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toggle button for switching between light and dark themes with automatic system preference detection.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default theme toggle (follows system preference)
 */
export const Default: Story = {};

/**
 * Light mode active
 */
export const LightMode: Story = {
  decorators: [
    (Story) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return (
        <div className="p-8 bg-background border border-border rounded-lg">
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Theme toggle in light mode showing moon icon.',
      },
    },
  },
};

/**
 * Dark mode active
 */
export const DarkMode: Story = {
  decorators: [
    (Story) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
      return (
        <div className="p-8 bg-background border border-border rounded-lg">
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Theme toggle in dark mode showing sun icon.',
      },
    },
  },
};

/**
 * With navigation context
 */
export const InNavbar: Story = {
  decorators: [
    (Story) => (
      <nav className="flex items-center gap-4 p-4 bg-card border-b border-border">
        <span className="font-semibold">Navigation</span>
        <div className="ml-auto flex items-center gap-2">
          <Story />
        </div>
      </nav>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Theme toggle positioned within a navigation bar context.',
      },
    },
  },
};

/**
 * Design Token Mapping
 */
export const TokenMapping: Story = {
  render: () => (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">ThemeToggle Design Token Mapping</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Dimensions</h3>
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Property</th>
                <th className="border border-border p-2 text-left">Token</th>
                <th className="border border-border p-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Button Size</td>
                <td className="border border-border p-2"><code>min-w-[44px] min-h-[44px]</code></td>
                <td className="border border-border p-2">44x44px (WCAG AA touch target)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Icon Size</td>
                <td className="border border-border p-2"><code>h-5 w-5</code></td>
                <td className="border border-border p-2">20x20px</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Border Radius</td>
                <td className="border border-border p-2"><code>rounded-full</code></td>
                <td className="border border-border p-2">Circular (50%)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">States</h3>
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">State</th>
                <th className="border border-border p-2 text-left">Token</th>
                <th className="border border-border p-2 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Hover</td>
                <td className="border border-border p-2"><code>hover:bg-muted</code></td>
                <td className="border border-border p-2">Visual feedback on pointer hover</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Transition</td>
                <td className="border border-border p-2"><code>transition-all duration-300</code></td>
                <td className="border border-border p-2">Smooth state changes</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Icon Animation</td>
                <td className="border border-border p-2"><code>transition-transform duration-500</code></td>
                <td className="border border-border p-2">Icon rotation effect</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Accessibility Features</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><code>aria-label="Toggle theme"</code> - Descriptive label for screen readers</li>
            <li><code>&lt;span className="sr-only"&gt;</code> - Additional hidden text for context</li>
            <li>Keyboard accessible (Enter/Space to activate)</li>
            <li>Focus visible with ring indicator</li>
            <li>44x44px touch target meets WCAG 2.2 Level AA</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">localStorage Integration</h3>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div className="mb-2"><strong>Key:</strong> "theme"</div>
            <div className="mb-2"><strong>Values:</strong> "light" | "dark"</div>
            <div><strong>Fallback:</strong> System preference (prefers-color-scheme)</div>
          </div>
        </div>
      </div>
    </div>
  ),
};

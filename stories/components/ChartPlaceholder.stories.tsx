import type { Meta, StoryObj } from '@storybook/react';
import ChartPlaceholder from '@/components/layout/ChartPlaceholder';
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react';

/**
 * ChartPlaceholder - Empty state wrapper for charts
 * 
 * Features:
 * - Customizable icon and message
 * - Neumorphic card styling
 * - Responsive height
 * - Skeleton loading state option
 */
const meta = {
  title: 'Components/ChartPlaceholder',
  component: ChartPlaceholder,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Placeholder component for chart areas with optional icon and custom messages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text displayed in placeholder',
    },
    icon: {
      control: false,
      description: 'React icon component to display',
    },
    height: {
      control: 'text',
      description: 'CSS height value (e.g., "400px", "h-96")',
    },
  },
} satisfies Meta<typeof ChartPlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default placeholder with bar chart icon
 */
export const Default: Story = {
  args: {
    title: 'Chart will render here',
  },
};

/**
 * Line chart placeholder
 */
export const LineChartPlaceholder: Story = {
  args: {
    title: 'Performance Trends',
    icon: <LineChart className="w-12 h-12 text-primary/40" />,
  },
};

/**
 * Pie chart placeholder
 */
export const PieChartPlaceholder: Story = {
  args: {
    title: 'Distribution Analysis',
    icon: <PieChart className="w-12 h-12 text-primary/40" />,
  },
};

/**
 * Trending data placeholder
 */
export const TrendingDataPlaceholder: Story = {
  args: {
    title: 'Revenue Analytics',
    icon: <TrendingUp className="w-12 h-12 text-primary/40" />,
  },
};

/**
 * Custom height (tall)
 */
export const TallPlaceholder: Story = {
  args: {
    title: 'Detailed Report Chart',
    icon: <BarChart3 className="w-16 h-16 text-primary/40" />,
    height: '500px',
  },
};

/**
 * Custom height (short)
 */
export const ShortPlaceholder: Story = {
  args: {
    title: 'Mini Chart',
    icon: <LineChart className="w-8 h-8 text-primary/40" />,
    height: '200px',
  },
};

/**
 * Dark mode variant
 */
export const DarkMode: Story = {
  args: {
    title: 'Analytics Dashboard',
    icon: <BarChart3 className="w-12 h-12 text-primary/40" />,
  },
  decorators: [
    (Story) => {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('dark');
      }
      return (
        <div className="p-8 bg-background">
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/**
 * In dashboard context
 */
export const InDashboard: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-background">
        <Story />
        <ChartPlaceholder title="Revenue Trends" icon={<LineChart className="w-12 h-12 text-primary/40" />} />
        <ChartPlaceholder title="Property Distribution" icon={<PieChart className="w-12 h-12 text-primary/40" />} />
        <ChartPlaceholder title="Growth Metrics" icon={<TrendingUp className="w-12 h-12 text-primary/40" />} />
      </div>
    ),
  ],
  args: {
    title: 'Monthly Overview',
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Design Token Mapping
 */
export const TokenMapping: Story = {
  render: () => (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">ChartPlaceholder Design Token Mapping</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Layout</h3>
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
                <td className="border border-border p-2">Container</td>
                <td className="border border-border p-2"><code>neumorphic-card</code></td>
                <td className="border border-border p-2">Custom shadow class for depth</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Padding</td>
                <td className="border border-border p-2"><code>p-8</code></td>
                <td className="border border-border p-2">2rem (32px)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Border Radius</td>
                <td className="border border-border p-2"><code>rounded-2xl</code></td>
                <td className="border border-border p-2">1rem (16px)</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Default Height</td>
                <td className="border border-border p-2"><code>min-h-[300px]</code></td>
                <td className="border border-border p-2">300px minimum</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Typography & Colors</h3>
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-2 text-left">Element</th>
                <th className="border border-border p-2 text-left">Token</th>
                <th className="border border-border p-2 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Title Text</td>
                <td className="border border-border p-2"><code>text-muted-foreground</code></td>
                <td className="border border-border p-2">Subtle, non-intrusive text</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Title Size</td>
                <td className="border border-border p-2"><code>text-sm</code></td>
                <td className="border border-border p-2">14px font size</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Icon Color</td>
                <td className="border border-border p-2"><code>text-primary/40</code></td>
                <td className="border border-border p-2">40% opacity primary color</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Usage Examples</h3>
          <div className="space-y-2 text-muted-foreground">
            <p><strong>Dashboard KPI Charts:</strong> Use with <code>height="400px"</code> for consistent grid layout</p>
            <p><strong>Report Sections:</strong> Custom icons like <code>LineChart</code>, <code>PieChart</code> for context</p>
            <p><strong>Loading States:</strong> Replace with actual Chart.js or Recharts components on data load</p>
            <p><strong>Empty Data:</strong> Show placeholder when no data is available with descriptive message</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Accessibility</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Flexbox centering ensures proper alignment</li>
            <li>Semantic HTML structure</li>
            <li>Icon decorative role (text provides context)</li>
            <li>High contrast text-to-background ratio</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};

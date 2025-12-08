import type { Meta, StoryObj } from "@storybook/react";
import { HeroBlock } from "@/design-system/components/Hero/HeroBlock";
import { Play } from "lucide-react";

const meta: Meta<typeof HeroBlock> = {
  title: "Components/HeroBlock",
  component: HeroBlock,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["image", "gradient", "video"],
    },
    height: {
      control: "select",
      options: ["sm", "md", "lg", "full"],
    },
    overlay: { control: "boolean" },
    showScrollIndicator: { control: "boolean" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HeroBlock>;

export const Gradient: Story = {
  args: {
    variant: "gradient",
    title: "Welcome to Monarch Property Management",
    subtitle: "Premium Property Solutions",
    description: "Experience luxury living with our expertly managed properties across the city.",
    cta: {
      primary: { text: "Explore Properties", href: "/properties" },
      secondary: { text: "Learn More", href: "/about" },
    },
    stats: [
      { number: "500+", label: "Properties" },
      { number: "10k+", label: "Happy Tenants" },
      { number: "50+", label: "Cities" },
    ],
  },
};

export const ImageBackground: Story = {
  args: {
    variant: "image",
    title: "Find Your Dream Home",
    description: "Discover premium properties in the heart of the city",
    media: {
      src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000",
      alt: "Modern luxury home exterior",
    },
    overlay: true,
    cta: {
      primary: { text: "View Properties", href: "/properties", icon: <Play className="mr-2 h-4 w-4" /> },
    },
  },
};

export const TokenMapping: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <h3 className="text-lg font-semibold">Hero Block Token Mapping</h3>
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Element</th>
            <th className="text-left p-2">Token</th>
            <th className="text-left p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2">Title Font</td>
            <td className="p-2 font-mono text-xs">typography.fontFamily.heading</td>
            <td className="p-2 font-mono text-xs">'Playfair Display', serif</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Title Size (Desktop)</td>
            <td className="p-2 font-mono text-xs">typography.fontSize.5xl</td>
            <td className="p-2 font-mono text-xs">3rem (48px)</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Overlay Gradient</td>
            <td className="p-2 font-mono text-xs">colors.brand.primary</td>
            <td className="p-2 font-mono text-xs">hsl(25 85% 55% / 0.1)</td>
          </tr>
          <tr>
            <td className="p-2">Scroll Animation</td>
            <td className="p-2 font-mono text-xs">motion.duration.slow</td>
            <td className="p-2 font-mono text-xs">500ms</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

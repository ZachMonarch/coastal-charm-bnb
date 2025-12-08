import type { Meta, StoryObj } from "@storybook/react";
import { CTABanner } from "@/design-system/components/CTA/CTABanner";

const meta: Meta<typeof CTABanner> = {
  title: "Components/CTABanner",
  component: CTABanner,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["light", "dark", "gradient", "image"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CTABanner>;

export const Light: Story = {
  args: {
    variant: "light",
    title: "Ready to Get Started?",
    description: "Join thousands of property managers who trust Monarch for their business.",
    primaryCTA: {
      text: "Get Started",
      href: "/signup",
    },
    secondaryCTA: {
      text: "Learn More",
      href: "/about",
    },
  },
};

export const Dark: Story = {
  args: {
    variant: "dark",
    title: "Transform Your Property Management",
    description: "Experience the difference with our premium platform.",
    primaryCTA: {
      text: "Start Free Trial",
      href: "/trial",
    },
  },
};

export const Gradient: Story = {
  args: {
    variant: "gradient",
    title: "Elevate Your Business",
    description: "Streamline operations, increase efficiency, and grow your portfolio.",
    primaryCTA: {
      text: "Schedule Demo",
      href: "/demo",
    },
    secondaryCTA: {
      text: "View Pricing",
      href: "/pricing",
    },
  },
};

export const WithImage: Story = {
  args: {
    variant: "image",
    title: "Your Properties Deserve the Best",
    description: "Professional management solutions tailored to your needs.",
    backgroundImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=2000",
    primaryCTA: {
      text: "Contact Sales",
      href: "/contact",
    },
  },
};

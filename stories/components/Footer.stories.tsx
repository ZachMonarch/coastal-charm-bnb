import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router-dom";
import Footer from "@/components/Footer";

const meta: Meta<typeof Footer> = {
  title: "Complex Components/Footer",
  component: Footer,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          {/* Mock page content */}
          <div className="flex-1 container py-8">
            <h1 className="text-4xl font-bold mb-4">Page Content</h1>
            <p className="text-muted-foreground">
              Scroll down to see the footer at the bottom of the page.
            </p>
          </div>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  name: "Default Footer",
};

export const PublicView: Story = {
  name: "Public User View",
  decorators: [
    (Story) => (
      <BrowserRouter>
        {/* Mock as unauthenticated user */}
        <Story />
      </BrowserRouter>
    ),
  ],
};

export const MobileView: Story = {
  name: "Mobile View",
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const TabletView: Story = {
  name: "Tablet View",
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const WithDarkMode: Story = {
  name: "Dark Mode",
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const TokenMapping: Story = {
  name: "Token Mapping",
  render: () => (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Footer Design Token Mapping</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3 font-semibold">Element</th>
              <th className="text-left p-3 font-semibold">Token</th>
              <th className="text-left p-3 font-semibold">Value/Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">Background Gradient</td>
              <td className="p-3"><code>from-background via-accent/5 to-accent/10</code></td>
              <td className="p-3">Subtle gradient from background to accent</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Company Name</td>
              <td className="p-3"><code>from-primary to-primary-dark bg-clip-text</code></td>
              <td className="p-3">Brand gradient for company name</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Heading Text</td>
              <td className="p-3"><code>text-foreground</code></td>
              <td className="p-3">Standard foreground color</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Body Text</td>
              <td className="p-3"><code>text-muted-foreground</code></td>
              <td className="p-3">Muted text for secondary information</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Links (default)</td>
              <td className="p-3"><code>text-muted-foreground</code></td>
              <td className="p-3">Muted color for links</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Links (hover)</td>
              <td className="p-3"><code>hover:text-primary</code></td>
              <td className="p-3">Primary color on hover</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Logo Background</td>
              <td className="p-3"><code>bg-primary/10</code></td>
              <td className="p-3">Primary color with 10% opacity</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Icon Containers</td>
              <td className="p-3"><code>bg-primary/10 text-primary</code></td>
              <td className="p-3">Primary color theme for icon boxes</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Social Buttons</td>
              <td className="p-3"><code>variant="outline" hover:text-primary</code></td>
              <td className="p-3">Outline variant with primary hover</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Border (top)</td>
              <td className="p-3"><code>border-border/30</code></td>
              <td className="p-3">Subtle border for section separation</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Border (sections)</td>
              <td className="p-3"><code>border-border/20</code></td>
              <td className="p-3">Even more subtle borders for cards</td>
            </tr>
            <tr className="border-b">
              <td className="p-3">Decorative Elements</td>
              <td className="p-3"><code>neumorphic-card, glass-card, tech-glow</code></td>
              <td className="p-3">Custom design system classes for effects</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-lg mb-3">Key Features</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>Responsive Grid</strong>: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)</li>
          <li>• <strong>Conditional Sections</strong>: Shows admin links for authenticated admin users</li>
          <li>• <strong>Animated Entrance</strong>: Staggered fade-in animations for sections</li>
          <li>• <strong>Social Media</strong>: Integrated social media icon buttons</li>
          <li>• <strong>Contact Information</strong>: Address, phone, email with icon indicators</li>
          <li>• <strong>SEO Links</strong>: Privacy Policy, Terms of Service, Sitemap</li>
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-lg mb-3">Content Sections</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>Company Info</strong>: Logo, description, social media links</li>
          <li>• <strong>Quick Links</strong>: Main navigation links (Home, Properties, Services, etc.)</li>
          <li>• <strong>Property Services</strong>: Service-specific links</li>
          <li>• <strong>Admin Dashboard</strong>: Admin-only links (conditional)</li>
          <li>• <strong>Contact Info</strong>: Full contact details with icons (shown when not admin)</li>
          <li>• <strong>Bottom Bar</strong>: Copyright, legal links, company tagline</li>
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-lg mb-3">Accessibility Features</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• <strong>Semantic HTML</strong>: Uses <code>&lt;footer&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;ul&gt;</code> elements</li>
          <li>• <strong>Optimized Images</strong>: WebP format with lazy loading</li>
          <li>• <strong>Link States</strong>: Clear hover states with color/background changes</li>
          <li>• <strong>Keyboard Navigation</strong>: All links and buttons keyboard accessible</li>
          <li>• <strong>Theme Support</strong>: Full light/dark mode compatibility</li>
        </ul>
      </div>
    </div>
  ),
};

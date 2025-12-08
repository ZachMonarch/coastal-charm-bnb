import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const meta: Meta<typeof Accordion> = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Monarch Property Management?</AccordionTrigger>
        <AccordionContent>
          Monarch Property Management is a comprehensive platform designed to streamline property management operations, from tenant management to maintenance tracking.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How does pricing work?</AccordionTrigger>
        <AccordionContent>
          We offer flexible pricing plans based on the number of properties you manage. Contact our sales team for a customized quote that fits your needs.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>
          Yes! We offer a 14-day free trial with full access to all features. No credit card required to get started.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-full max-w-2xl">
      <AccordionItem value="item-1">
        <AccordionTrigger>Property Management</AccordionTrigger>
        <AccordionContent>
          Manage all your properties from a single dashboard. Track occupancy, rent collection, and property performance with ease.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Tenant Portal</AccordionTrigger>
        <AccordionContent>
          Give your tenants 24/7 access to submit maintenance requests, pay rent online, and communicate directly with property managers.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Maintenance Tracking</AccordionTrigger>
        <AccordionContent>
          Track all maintenance requests, assign vendors, and monitor work order progress in real-time with automated notifications.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger>Financial Reports</AccordionTrigger>
        <AccordionContent>
          Generate comprehensive financial reports, including profit & loss statements, cash flow analysis, and tax-ready documentation.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

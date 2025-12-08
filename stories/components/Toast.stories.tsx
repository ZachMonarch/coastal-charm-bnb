import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const meta: Meta = {
  title: "Components/Toast",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <>
      <div className="space-y-4">
        <Button
          onClick={() => {
            toast({
              title: "Success!",
              description: "Your property has been successfully listed.",
            });
          }}
        >
          Show Toast
        </Button>
      </div>
      <Toaster />
    </>
  );
};

export const Default: Story = {
  render: () => <ToastDemo />,
};

const AllVariantsDemo = () => {
  const { toast } = useToast();

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={() => {
            toast({
              title: "Property Listed",
              description: "Your property is now visible to potential tenants.",
            });
          }}
        >
          Default Toast
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to upload property images. Please try again.",
            });
          }}
        >
          Error Toast
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Application Received",
              description: "New rental application for Downtown Loft",
              action: <Button size="sm" variant="outline">View</Button>,
            });
          }}
        >
          Toast with Action
        </Button>
      </div>
      <Toaster />
    </>
  );
};

export const AllVariants: Story = {
  render: () => <AllVariantsDemo />,
};

const PropertyManagementDemo = () => {
  const { toast } = useToast();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() => {
            toast({
              title: "Booking Confirmed",
              description: "Downtown Loft - Check-in: Jan 15, 2025",
            });
          }}
        >
          Booking Confirmation
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Payment Received",
              description: "$2,500 payment from John Doe",
            });
          }}
        >
          Payment Notification
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Maintenance Request",
              description: "New request from Unit 5B - Plumbing issue",
              action: (
                <Button size="sm" variant="outline">
                  Assign Vendor
                </Button>
              ),
            });
          }}
        >
          Maintenance Alert
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Document Uploaded",
              description: "Lease agreement signed by tenant",
            });
          }}
        >
          Document Upload
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Inspection Overdue",
              description: "Annual inspection for Suburban Home is past due",
            });
          }}
        >
          Overdue Warning
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Vendor Assigned",
              description: "Mike's Plumbing assigned to maintenance request #1234",
            });
          }}
        >
          Vendor Assignment
        </Button>
      </div>
      <Toaster />
    </>
  );
};

export const PropertyManagementToasts: Story = {
  render: () => <PropertyManagementDemo />,
};

const WithActionsDemo = () => {
  const { toast } = useToast();

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={() => {
            toast({
              title: "New Application",
              description: "Jane Smith applied for Downtown Loft",
              action: (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    Decline
                  </Button>
                </div>
              ),
            });
          }}
        >
          Application with Actions
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Lease Expiring Soon",
              description: "Unit 3A lease expires in 30 days",
              action: (
                <Button size="sm" variant="outline">
                  Renew Lease
                </Button>
              ),
            });
          }}
        >
          Renewal Reminder
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Payment Failed",
              description: "Monthly rent payment declined",
              variant: "destructive",
              action: (
                <Button size="sm" variant="outline">
                  Retry
                </Button>
              ),
            });
          }}
        >
          Payment Failed with Action
        </Button>
      </div>
      <Toaster />
    </>
  );
};

export const WithActions: Story = {
  render: () => <WithActionsDemo />,
};

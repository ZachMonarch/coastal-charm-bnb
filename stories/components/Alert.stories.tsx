import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        Your property listing has been successfully updated.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Unable to process your request. Please try again later.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Your monthly subscription will renew on January 15, 2025.
        </AlertDescription>
      </Alert>

      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">Success</AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          Property verification completed successfully. Your listing is now live.
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">Warning</AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          Your payment method will expire soon. Please update your billing information.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to upload property images. Maximum file size is 5MB.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const PropertyManagementAlerts: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>New Application Received</AlertTitle>
        <AlertDescription>
          You have a new rental application for Downtown Loft. Review the application in your dashboard.
        </AlertDescription>
      </Alert>

      <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Maintenance Request Completed
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          The plumbing issue in Unit 5B has been resolved. Tenant has been notified.
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Inspection Due Soon
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          Annual property inspection for Suburban Home is scheduled for next week. Ensure all documentation is prepared.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Your session will expire in 5 minutes due to inactivity.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutIcon: Story = {
  render: () => (
    <Alert>
      <AlertTitle>System Maintenance</AlertTitle>
      <AlertDescription>
        Scheduled maintenance will occur on Saturday, January 20th from 2:00 AM to 4:00 AM EST. Services may be temporarily unavailable during this time.
      </AlertDescription>
    </Alert>
  ),
};

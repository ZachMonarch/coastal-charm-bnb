import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/design-system/components/Card/Card";
import { Separator } from "@/components/ui/separator";

const meta: Meta = {
  title: "Integration/Form Patterns",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const PropertyListingForm: Story = {
  render: () => (
    <Card variant="elevated" className="max-w-2xl">
      <form className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold">Add New Property</h2>
          <p className="text-muted-foreground">
            Fill in the details to list a new property
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-name">Property Name *</Label>
              <Input id="property-name" placeholder="Downtown Loft" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property-type">Property Type *</Label>
              <Select>
                <SelectTrigger id="property-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" placeholder="123 Main Street" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" placeholder="New York" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" placeholder="NY" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code *</Label>
              <Input id="zip" placeholder="10001" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Property Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms *</Label>
              <Input id="bedrooms" type="number" placeholder="2" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms *</Label>
              <Input id="bathrooms" type="number" placeholder="2" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sqft">Square Feet *</Label>
              <Input id="sqft" type="number" placeholder="1200" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Rent *</Label>
              <Input id="price" type="number" placeholder="2500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">Security Deposit *</Label>
              <Input id="deposit" type="number" placeholder="2500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the property..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Amenities</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="parking" />
              <Label htmlFor="parking">Parking</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="gym" />
              <Label htmlFor="gym">Gym</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="pool" />
              <Label htmlFor="pool">Pool</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="laundry" />
              <Label htmlFor="laundry">In-Unit Laundry</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="pets" />
              <Label htmlFor="pets">Pet Friendly</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="balcony" />
              <Label htmlFor="balcony">Balcony/Patio</Label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Availability</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Available Now</Label>
              <p className="text-sm text-muted-foreground">
                Mark property as immediately available
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show in Public Listings</Label>
              <p className="text-sm text-muted-foreground">
                Display property on website
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            List Property
          </Button>
          <Button type="button" variant="outline" className="flex-1">
            Save as Draft
          </Button>
        </div>
      </form>
    </Card>
  ),
};

export const TenantApplicationForm: Story = {
  render: () => (
    <Card variant="elevated" className="max-w-2xl">
      <form className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold">Rental Application</h2>
          <p className="text-muted-foreground">
            Apply for Downtown Loft - $2,500/month
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name *</Label>
              <Input id="first-name" placeholder="John" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name *</Label>
              <Input id="last-name" placeholder="Doe" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" type="tel" placeholder="(555) 123-4567" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Employment</h3>

          <div className="space-y-2">
            <Label htmlFor="employer">Current Employer *</Label>
            <Input id="employer" placeholder="Acme Corporation" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title *</Label>
              <Input id="job-title" placeholder="Software Engineer" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income">Annual Income *</Label>
              <Input id="income" type="number" placeholder="75000" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Move-in Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="move-in">Desired Move-in Date *</Label>
              <Input id="move-in" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupants">Number of Occupants *</Label>
              <Input id="occupants" type="number" placeholder="2" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="pets-app" />
            <Label htmlFor="pets-app">I have pets</Label>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">
              I agree to the terms and conditions and authorize a background check
            </Label>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Submit Application
        </Button>
      </form>
    </Card>
  ),
};

export const MaintenanceRequestForm: Story = {
  render: () => (
    <Card variant="elevated" className="max-w-lg">
      <form className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Request</h2>
          <p className="text-muted-foreground">
            Submit a maintenance issue for your unit
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="appliance">Appliance</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input id="title" placeholder="Leaking faucet in kitchen" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Access Permission</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="access" defaultChecked />
              <Label htmlFor="access" className="font-normal">
                I authorize entry to my unit for repairs
              </Label>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Submit Request
        </Button>
      </form>
    </Card>
  ),
};

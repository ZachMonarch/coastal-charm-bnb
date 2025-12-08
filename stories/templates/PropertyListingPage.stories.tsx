import type { Meta, StoryObj } from "@storybook/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Bed, Bath, Square, Heart } from "lucide-react";

const meta: Meta = {
  title: "Templates/Property Listing Page",
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

const mockProperties = [
  {
    id: 1,
    title: "Luxury Downtown Loft",
    address: "123 Main St, Denver, CO",
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    image: "/placeholder.svg",
    featured: true,
    available: "Available Now",
  },
  {
    id: 2,
    title: "Modern Studio Apartment",
    address: "456 Park Ave, Denver, CO",
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 750,
    image: "/placeholder.svg",
    featured: false,
    available: "Jan 15, 2025",
  },
  {
    id: 3,
    title: "Spacious Family Home",
    address: "789 Oak Dr, Franktown, CO",
    price: 3200,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    image: "/placeholder.svg",
    featured: true,
    available: "Available Now",
  },
  {
    id: 4,
    title: "Cozy Garden Apartment",
    address: "321 Elm St, Denver, CO",
    price: 1950,
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 900,
    image: "/placeholder.svg",
    featured: false,
    available: "Feb 1, 2025",
  },
  {
    id: 5,
    title: "Executive Penthouse",
    address: "555 Tower Blvd, Denver, CO",
    price: 4500,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2200,
    image: "/placeholder.svg",
    featured: true,
    available: "Available Now",
  },
  {
    id: 6,
    title: "Suburban Townhouse",
    address: "888 Maple Ln, Franktown, CO",
    price: 2200,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1600,
    image: "/placeholder.svg",
    featured: false,
    available: "Jan 20, 2025",
  },
];

export const FullPage: Story = {
  render: () => (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Property
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Browse our curated selection of premium rental properties
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-6 border-b bg-background sticky top-[72px] z-40 shadow-sm">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location or property name..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bedrooms</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">Under $2,000</SelectItem>
                <SelectItem value="mid">$2,000 - $3,000</SelectItem>
                <SelectItem value="high">Over $3,000</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              More Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 flex-1">
        <div className="container">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Showing <strong>{mockProperties.length}</strong> properties
            </p>
            <Select defaultValue="featured">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.map((property, index) => (
              <Card
                key={property.id}
                className="overflow-hidden hover-scale cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 bg-muted">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {property.featured && (
                    <Badge className="absolute top-2 left-2">
                      Featured
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle>{property.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {property.bedrooms} bed
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms} bath
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="h-4 w-4" />
                      {property.sqft} sqft
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        ${property.price}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{property.available}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-12">
            <Button variant="outline" disabled>Previous</Button>
            <Button variant="outline">1</Button>
            <Button variant="default">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  ),
};

export const MobileView: Story = {
  ...FullPage,
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const TabletView: Story = {
  ...FullPage,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <FullPage.render />
    </div>
  ),
};

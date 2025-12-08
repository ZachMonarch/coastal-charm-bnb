import { ArrowLeft, Shield, FileText, Scale } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen">
      <main className="p-6">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="neumorphic-inset p-3 rounded-full mr-4">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Terms of Service
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-primary" />
                  1. Agreement to Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  By accessing and using Monarch Property Management services, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-6 w-6 mr-3 text-primary" />
                  2. Use of Services
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  Our services are intended for legitimate property management and rental purposes. You agree to use our platform responsibly and in accordance with all applicable laws.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>3. Property Listings</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  All property information is provided as-is. We strive for accuracy but cannot guarantee that all listings are current or without errors.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>4. Booking and Payments</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  All bookings are subject to availability and confirmation. Payment terms and cancellation policies vary by property and will be clearly communicated during the booking process.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>5. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  Monarch Property Management shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>6. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p className="text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Email: legal@monarchpropertymmgt.com</p>
                  <p>Phone: +1 (304) 365-8349</p>
                  <p>Address: 2195 N. Highway 83 Suite 14B, Franktown, CO 80116</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <div className="neumorphic-card p-8 rounded-3xl">
              <h2 className="text-2xl font-bold mb-4">Need Legal Assistance?</h2>
              <p className="text-muted-foreground mb-6">
                For detailed legal questions or contract discussions, please contact our legal team.
              </p>
              <Link to="/contact">
                <Button className="btn-primary">
                  Contact Legal Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
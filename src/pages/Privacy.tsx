import { Shield, Eye, Lock, Database, UserCheck, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { PageHeroWithImage } from "@/components/PageHeroWithImage";

export default function Privacy() {
  return (
    <div className="min-h-screen w-full">
      <SEOHead
        title="Privacy Policy | Monarch Property Management"
        description="Learn how Monarch Property Management protects your privacy. Read our comprehensive privacy policy covering data collection, usage, and security practices."
        keywords={["privacy policy", "data protection", "personal information", "GDPR", "privacy rights"]}
        type="website"
        url="https://monarchpropertymmgt.com/privacy"
      />

      {/* Hero Section with Image */}
      <PageHeroWithImage
        title="Privacy Policy"
        subtitle={`Last updated: ${new Date().toLocaleDateString()}`}
        imageUrl="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1920&h=600&fit=crop"
      />

      <main className="p-6">
        <div className="container mx-auto max-w-4xl">

          <div className="space-y-8">
            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-6 w-6 mr-3 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                    <p>We collect information you provide directly, including name, email, phone number, and address when you create an account or make inquiries.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Usage Information</h4>
                    <p>We automatically collect information about how you use our website, including pages visited, time spent, and features used.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-6 w-6 mr-3 text-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-muted-foreground">
                  <p>• To provide and maintain our property management services</p>
                  <p>• To process bookings and handle customer inquiries</p>
                  <p>• To send important notifications about your account or bookings</p>
                  <p>• To improve our services and develop new features</p>
                  <p>• To comply with legal obligations and prevent fraud</p>
                </div>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-6 w-6 mr-3 text-primary" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Information Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who help us operate our business, under strict confidentiality agreements.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-muted-foreground">
                  <p>• Access: You can request a copy of the personal information we hold about you</p>
                  <p>• Correction: You can ask us to correct inaccurate information</p>
                  <p>• Deletion: You can request deletion of your personal information</p>
                  <p>• Portability: You can request your data in a machine-readable format</p>
                  <p>• Objection: You can object to certain processing of your information</p>
                </div>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to improve your browsing experience, analyze site usage, and assist in our marketing efforts. You can control cookie settings through your browser preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="neumorphic-card">
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy or our data practices:
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Email: privacy@monarchpropertymmgt.com</p>
                  <p>Phone: +1 (304) 365-8349 | +1 (614) 427-8576</p>
                  <p>Address: 2195 N. Highway 83 Suite 14B, Franktown, CO 80116</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <div className="neumorphic-card p-8 rounded-3xl">
              <h2 className="text-2xl font-bold mb-4">Questions About Your Privacy?</h2>
              <p className="text-muted-foreground mb-6">
                We're committed to protecting your privacy. Contact our data protection team for any concerns.
              </p>
              <Link to="/contact">
                <Button className="btn-primary">
                  Contact Privacy Team
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
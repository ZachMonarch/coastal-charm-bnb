import { Building2, Users, Award, MapPin, Phone, Mail, Shield, Target, Heart, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { PageHeroWithImage } from "@/components/PageHeroWithImage";

const TEAM_MEMBERS = [
  {
    name: "Michael Harrison",
    role: "Founder & CEO",
    description: "20+ years in property management and real estate development.",
  },
  {
    name: "Sarah Chen",
    role: "Director of Operations",
    description: "Expert in streamlining property operations and vendor management.",
  },
  {
    name: "David Martinez",
    role: "Head of Client Relations",
    description: "Dedicated to ensuring exceptional service for all property owners.",
  },
  {
    name: "Emily Thompson",
    role: "Lead Property Manager",
    description: "Specializes in luxury residential and commercial properties.",
  },
];

const VALUES = [
  {
    icon: Shield,
    title: "Integrity",
    description: "We operate with complete transparency and honesty in all our dealings.",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for the highest standards in property management services.",
  },
  {
    icon: Heart,
    title: "Care",
    description: "We treat every property as if it were our own, with genuine care and attention.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description: "We continuously adopt new technologies to improve our services.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen w-full">
      <SEOHead
        title="About Us | Monarch Property Management"
        description="Learn about Monarch Property Management - Colorado's premier property management company with 20+ years of experience serving property owners and tenants."
        keywords={["about monarch", "property management company", "Colorado property managers", "real estate management", "property services"]}
        type="website"
        url="https://monarchpropertymmgt.com/about"
      />

      {/* Hero Section with Image */}
      <PageHeroWithImage
        title="About Monarch Property Management"
        subtitle="Building trust through exceptional property management since 2003"
        imageUrl="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=800&fit=crop"
      />

      <main className="p-6 w-full">
        <div className="container mx-auto max-w-6xl">
          {/* Mission Statement */}
          <section className="py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                At Monarch Property Management, our mission is to maximize property value while 
                providing exceptional living experiences for tenants. We combine local expertise 
                with innovative technology to deliver transparent, efficient, and reliable 
                property management services throughout Colorado.
              </p>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Building2, value: "500+", label: "Properties Managed" },
                { icon: Users, value: "2,000+", label: "Happy Tenants" },
                { icon: Award, value: "20+", label: "Years Experience" },
                { icon: MapPin, value: "15+", label: "Colorado Cities" },
              ].map((stat, i) => (
                <Card key={i} className="text-center neumorphic-card">
                  <CardContent className="pt-6">
                    <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Our Values */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The principles that guide every decision we make and service we provide.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((value, i) => (
                <Card key={i} className="text-center neumorphic-card hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-clamp-3">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Our Story */}
          <section className="py-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Founded in 2003 in Franktown, Colorado, Monarch Property Management began 
                    with a simple vision: to revolutionize property management by putting 
                    property owners and tenants first.
                  </p>
                  <p>
                    Over two decades, we've grown from managing a handful of local properties 
                    to overseeing over 500 residential and commercial properties across 
                    Colorado's Front Range.
                  </p>
                  <p>
                    Our success stems from our commitment to transparency, responsive 
                    communication, and leveraging cutting-edge technology to streamline 
                    every aspect of property management.
                  </p>
                </div>
              </div>
              <div className="neumorphic-card rounded-3xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop" 
                  alt="Monarch Property Management office" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Experienced professionals dedicated to managing your property with care and expertise.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TEAM_MEMBERS.map((member, i) => (
                <Card key={i} className="neumorphic-card text-center">
                  <CardHeader>
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription className="text-primary font-medium">
                      {member.role}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-clamp-2">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="py-16">
            <Card className="neumorphic-card p-8 text-center border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Whether you're a property owner looking for expert management or a tenant 
                searching for your next home, we're here to help.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>+1 (304) 365-8349</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>info@monarchpropertymmgt.com</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Franktown, CO 80116</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button className="btn-primary">Contact Us Today</Button>
                </Link>
                <Link to="/properties">
                  <Button variant="outline" className="border-primary/30 hover:border-primary">
                    View Properties
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

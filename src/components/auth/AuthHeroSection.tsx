import { Building2, Shield, Wrench, Users, CheckCircle2, Star, Lock, Award } from "lucide-react";
import authHeroBg from "@/assets/auth-hero-bg.jpg";

interface AuthHeroSectionProps {
  activeRole?: string;
}

export function AuthHeroSection({ activeRole = "property_manager" }: AuthHeroSectionProps) {
  const roleContent = {
    property_manager: {
      title: "Manage Properties Like Royalty",
      subtitle: "Streamline your portfolio with professional tools",
      benefits: [
        "Manage unlimited properties from one dashboard",
        "RFQ system for competitive vendor bidding",
        "Real-time maintenance tracking",
        "Comprehensive financial reporting",
      ],
      stat: "500+",
      statLabel: "Properties Managed",
      icon: Building2,
    },
    vendor: {
      title: "Grow Your Business",
      subtitle: "Access premium project opportunities",
      benefits: [
        "Bid on verified RFQ opportunities",
        "Build your professional reputation",
        "Secure, timely payment processing",
        "Direct communication with managers",
      ],
      stat: "$2M+",
      statLabel: "Project Value",
      icon: Wrench,
    },
    tenant: {
      title: "Home Made Simple",
      subtitle: "Experience hassle-free property living",
      benefits: [
        "24/7 maintenance request system",
        "Online rent payments",
        "Direct messaging with management",
        "Document storage and access",
      ],
      stat: "10K+",
      statLabel: "Happy Tenants",
      icon: Users,
    },
    admin: {
      title: "Complete Control",
      subtitle: "Full platform administration capabilities",
      benefits: [
        "User and role management",
        "System-wide analytics",
        "Security monitoring",
        "Platform configuration",
      ],
      stat: "99.9%",
      statLabel: "Uptime",
      icon: Shield,
    },
  };

  const content = roleContent[activeRole as keyof typeof roleContent] || roleContent.property_manager;
  const IconComponent = content.icon;

  const testimonials = [
    {
      quote: "Monarch transformed how we manage our properties. Incredible platform!",
      author: "Sarah M.",
      role: "Property Manager",
    },
    {
      quote: "The RFQ system helped us grow our vendor business by 300%.",
      author: "Mike T.",
      role: "Licensed Contractor",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={authHeroBg} 
          alt="Professional property management"
          className="w-full h-full object-cover"
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-primary/40" />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-40 left-10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12">
        {/* Brand Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-8">
            <img 
              src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png" 
              alt="Monarch Logo"
              className="h-16 w-16 rounded-xl shadow-lg border-2 border-white/20 object-contain bg-white/10 backdrop-blur-sm"
            />
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">MONARCH</h2>
              <p className="text-primary-light text-sm font-medium">Property Management</p>
            </div>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight text-white drop-shadow-lg">
            {content.title}
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md">
            {content.subtitle}
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-4 mb-10">
          {content.benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10"
            >
              <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-white font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Stats card */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 mb-10 border border-white/20 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <IconComponent className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <div className="text-4xl font-bold text-white">{content.stat}</div>
              <div className="text-white/80 font-medium">{content.statLabel}</div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/15 shadow-lg">
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-white text-lg mb-4 italic font-medium">
            "{testimonials[0].quote}"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground shadow-md">
              {testimonials[0].author.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-white">{testimonials[0].author}</div>
              <div className="text-sm text-white/70">{testimonials[0].role}</div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-white text-sm font-medium">256-bit SSL</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-white text-sm font-medium">SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-white text-sm font-medium">GDPR Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Clock, Star, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const services = [
    {
      title: "Cleaning Services",
      image: "/src/assets/cleaning-service.jpg",
      description: "Professional cleaning for your home or office"
    },
    {
      title: "Cook Services",
      image: "/src/assets/cook-service.jpg",
      description: "Delicious home-cooked meals by expert chefs"
    },
    {
      title: "Elder Care",
      image: "/src/assets/eldercare-service.jpg",
      description: "Compassionate care for your loved ones"
    },
    {
      title: "Babysitting",
      image: "/src/assets/babysitter-service.jpg",
      description: "Trusted care for your little ones"
    },
    {
      title: "Gardening",
      image: "/src/assets/gardening-service.jpg",
      description: "Transform your outdoor space"
    }
  ];

  const trustedCompanies = [
    "/logos/google-logo.png",
    "/logos/amazon-logo.png",
    "/logos/flipkart-logo.png",
    "/logos/tata-logo.png",
    "/logos/reliance-logo.png",
    "/logos/swiggy-logo.png",
    "/logos/zomato-logo.png",
    "/logos/ola-logo.png"
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified Helpers",
      description: "All helpers are background-checked and verified"
    },
    {
      icon: Clock,
      title: "Instant Booking",
      description: "Book services in just a few clicks"
    },
    {
      icon: Star,
      title: "Quality Service",
      description: "Rated 4.8/5 by thousands of happy customers"
    },
    {
      icon: Users,
      title: "Trusted Platform",
      description: "Join 100,000+ satisfied customers"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJoc2woMjQwIDUuOSUgMTAlKSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <img 
              src="/src/assets/helperhub-logo.png" 
              alt="HelperHub" 
              className="h-16 md:h-20 mb-6 animate-fade-in"
            />
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Your Trusted Home Services
              <br />
              <span className="text-primary">At Your Fingertips</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 animate-fade-in">
              Connect with verified professionals for all your household needs. 
              From cleaning to cooking, we've got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button 
                size="lg" 
                onClick={() => navigate("/signup")}
                className="text-lg px-8 py-6 group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/login")}
                className="text-lg px-8 py-6"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose HelperHub?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Our Services
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Professional helpers for every need in your home
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Trusted By Leading Companies
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center">
            {trustedCompanies.map((logo, index) => (
              <div 
                key={index}
                className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              >
                <img 
                  src={logo} 
                  alt="Company logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust HelperHub for their home service needs
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/signup")}
            className="text-lg px-8 py-6"
          >
            Book Your First Service
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 HelperHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

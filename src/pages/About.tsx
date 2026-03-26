import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/ui/navbar';
import kristofferImage from '@/assets/team-kristoffer.avif';
import christianImage from '@/assets/team-christian.avif';
import johanImage from '@/assets/team-johan.avif';
import logoImage from '@/assets/amsupplycheck-logo.png';

const About = () => {
  const navigate = useNavigate();

  // Add Organization structured data for SEO
  useEffect(() => {
    // Update page title
    document.title = 'About Us - AMSupplyCheck | 3D Printing Supplier Platform';

    // Add hreflang tags for international SEO
    const addHreflangTag = (lang: string, url: string) => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    const baseUrl = `${window.location.origin}/about`;
    addHreflangTag('en', baseUrl);
    addHreflangTag('da', baseUrl);
    addHreflangTag('x-default', baseUrl);

    // Update meta description
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('description', 'Learn about AMSupplyCheck - A Danish company democratizing 3D printing manufacturing. Meet our team and discover our mission to help innovators, engineers, and creators find the right suppliers.');

    // Organization structured data
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AMSupplyCheck',
      url: window.location.origin,
      logo: `${window.location.origin}${logoImage}`,
      description: 'AMSupplyCheck is a Danish Company that helps people who need to have parts produced, by guiding them to the right supplier for their specific need. Simple, Transparent, Fast and for FREE.',
      foundingDate: '2024',
      inLanguage: ['en', 'da'],
      founders: [
        {
          '@type': 'Person',
          name: 'Kristoffer Ryelund Nielsen',
          jobTitle: 'Founder',
        },
        {
          '@type': 'Person',
          name: 'Christian Nymark Groth',
          jobTitle: 'CEO',
        },
        {
          '@type': 'Person',
          name: 'Johan Søberg',
          jobTitle: 'CTO',
        },
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DK',
      },
      sameAs: [
        // Add social media links here when available
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Danish'],
      },
      knowsAbout: [
        '3D Printing',
        'Additive Manufacturing',
        'Supplier Management',
        'Manufacturing Procurement',
        'Industrial Design',
      ],
    };

    // Add or update Organization structured data script
    let orgScript = document.querySelector('script[type="application/ld+json"][data-organization-schema]');
    if (!orgScript) {
      orgScript = document.createElement('script');
      orgScript.setAttribute('type', 'application/ld+json');
      orgScript.setAttribute('data-organization-schema', 'true');
      document.head.appendChild(orgScript);
    }
    orgScript.textContent = JSON.stringify(organizationData);

    // Cleanup function
    return () => {
      document.title = 'SupplyCheck - Find 3D Printing Suppliers';
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
      const script = document.querySelector('script[type="application/ld+json"][data-organization-schema]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Us - AMSupplyCheck | 3D Printing Supplier Platform</title>
        <meta name="description" content="Learn about AMSupplyCheck - the platform connecting businesses with verified 3D printing suppliers worldwide. Meet our team and discover our mission." />
        <link rel="canonical" href="https://amsupplycheck.com/about" />
        <meta property="og:title" content="About AMSupplyCheck | 3D Printing Supplier Platform" />
        <meta property="og:description" content="Connecting businesses with verified 3D printing suppliers worldwide. Meet our team and discover our mission." />
        <meta property="og:url" content="https://amsupplycheck.com/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="About AMSupplyCheck | 3D Printing Supplier Platform" />
        <meta name="twitter:description" content="Connecting businesses with verified 3D printing suppliers worldwide. Meet our team and discover our mission." />
      </Helmet>
      <Navbar />
      
      {/* Our Story Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with mechanical/industrial pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          {/* Optional: Add subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
          }} />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-12">
            Our Story
          </h1>
          
          <div className="max-w-5xl mx-auto mb-12">
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
              AMSupplyCheck is a Danish Company that wish to help the people who need to have parts 
              produced, by guiding them to the right supplier for their specific need. Simple, Transparent, 
              Fast and for FREE. We believe that all the world's innovators, engineers, designers, and 
              creators should have free and easy access to find relevant suppliers for their next project.
            </p>
            
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Our goal is to democratize manufacturing, ensuring that you are not limited to what a single 
              supplier can offer. The problems we wish to solve are: Paying overprice for 3D printed parts. 
              Dealing with long lead times on 3d printed parts. Wasting time on searching for suppliers 
              with the right capabilities. Waiting days or even weeks, to receive a simple quote.
            </p>
          </div>
          
          <Button
            size="lg"
            className="bg-primary hover:bg-primary-hover text-white text-lg px-12 py-4 rounded-lg transition-all duration-300"
            onClick={() => navigate('/search')}
          >
            Our platform
          </Button>
        </div>
      </section>

      {/* Who are we Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Who are we?
            </h2>
            <p className="text-xl text-muted-foreground">
              The team behind the solution
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Johan */}
            <div className="text-center">
              <div className="mb-6 overflow-hidden rounded-2xl shadow-card">
                <img 
                  src={kristofferImage} 
                  alt="Johan Søberg"
                  className="w-full h-80 object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Johan - CTO
              </h3>
            </div>

            {/* Christian */}
            <div className="text-center">
              <div className="mb-6 overflow-hidden rounded-2xl shadow-card">
                <img 
                  src={christianImage} 
                  alt="Christian Nymark Groth"
                  className="w-full h-80 object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Christian - CEO
              </h3>
            </div>

            {/* Kristoffer */}
            <div className="text-center">
              <div className="mb-6 overflow-hidden rounded-2xl shadow-card">
                <img 
                  src={johanImage} 
                  alt="Kristoffer Ryelund Nielsen"
                  className="w-full h-80 object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Kristoffer - Founder
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} AMSupplyCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
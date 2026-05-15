import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "About Us - AMSupplyCheck | 3D Printing Supplier Platform",
  description:
    "Learn about AMSupplyCheck - the platform connecting businesses with verified 3D printing suppliers worldwide. Meet our team and discover our mission.",
  alternates: {
    canonical: "https://amsupplycheck.com/about",
    languages: {
      en: "https://amsupplycheck.com/about",
      da: "https://amsupplycheck.com/about",
      "x-default": "https://amsupplycheck.com/about",
    },
  },
  openGraph: {
    title: "About AMSupplyCheck | 3D Printing Supplier Platform",
    description:
      "Connecting businesses with verified 3D printing suppliers worldwide. Meet our team and discover our mission.",
    url: "https://amsupplycheck.com/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About AMSupplyCheck | 3D Printing Supplier Platform",
    description:
      "Connecting businesses with verified 3D printing suppliers worldwide. Meet our team and discover our mission.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AMSupplyCheck",
  url: "https://amsupplycheck.com",
  logo: "https://amsupplycheck.com/amsupplycheck-logo-white.png",
  description:
    "AMSupplyCheck is a Danish Company that helps people who need to have parts produced, by guiding them to the right supplier for their specific need. Simple, Transparent, Fast and for FREE.",
  foundingDate: "2024",
  inLanguage: ["en", "da"],
  founders: [
    { "@type": "Person", name: "Kristoffer Ryelund Nielsen", jobTitle: "Founder" },
    { "@type": "Person", name: "Christian Nymark Groth", jobTitle: "CEO" },
    { "@type": "Person", name: "Johan Søberg", jobTitle: "CTO" },
  ],
  address: { "@type": "PostalAddress", addressCountry: "DK" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Service",
    availableLanguage: ["English", "Danish"],
  },
  knowsAbout: [
    "3D Printing",
    "Additive Manufacturing",
    "Supplier Management",
    "Manufacturing Procurement",
    "Industrial Design",
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <Navbar />

      {/* Our Story */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-12">Our Story</h1>

          <div className="max-w-5xl mx-auto mb-12">
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8">
              AMSupplyCheck is a Danish Company that wish to help the people who need to have parts produced, by guiding them to the right supplier for their specific need. Simple, Transparent, Fast and for FREE. We believe that all the world&apos;s innovators, engineers, designers, and creators should have free and easy access to find relevant suppliers for their next project.
            </p>

            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Our goal is to democratize manufacturing, ensuring that you are not limited to what a single supplier can offer. The problems we wish to solve are: Paying overprice for 3D printed parts. Dealing with long lead times on 3d printed parts. Wasting time on searching for suppliers with the right capabilities. Waiting days or even weeks, to receive a simple quote.
            </p>
          </div>

          <Link
            href="/suppliers"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-12 py-4 rounded-lg transition-all duration-300"
          >
            Our platform
          </Link>
        </div>
      </section>

      {/* Who are we */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Who are we?</h2>
            <p className="text-xl text-muted-foreground">The team behind the solution</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="mb-6 overflow-hidden rounded-2xl shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team/team-kristoffer.avif"
                  alt="Johan Søberg"
                  className="w-full h-80 object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Johan - CTO</h3>
            </div>

            <div className="text-center">
              <div className="mb-6 overflow-hidden rounded-2xl shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team/team-christian.avif"
                  alt="Christian Nymark Groth"
                  className="w-full h-80 object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Christian - CEO</h3>
            </div>

            <div className="text-center">
              <div className="mb-6 overflow-hidden rounded-2xl shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/team/team-johan.avif"
                  alt="Kristoffer Ryelund Nielsen"
                  className="w-full h-80 object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Kristoffer - Founder</h3>
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
}

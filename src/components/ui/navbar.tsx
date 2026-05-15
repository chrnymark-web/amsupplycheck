"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Grid3X3, Info, UserPlus, BookOpen, BarChart3, Cpu, FlaskConical, Globe } from "lucide-react";

interface NavbarProps {
  className?: string;
  onScrollToSection?: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ className = "", onScrollToSection }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAdminPage = pathname?.startsWith("/admin") ?? false;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAboutClick = () => {
    if (isHomePage && onScrollToSection) {
      onScrollToSection("why-choose");
    } else {
      router.push("/about");
    }
    setMobileMenuOpen(false);
  };

  const handleBecomeSupplierClick = () => {
    if (isHomePage && onScrollToSection) {
      onScrollToSection("contact");
    } else {
      router.push("/#contact");
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-36 py-1">
          <Link href="/" className="flex items-center cursor-pointer flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/amsupplycheck-logo-white.png" alt="AMSupplyCheck" className="h-32 w-auto" />
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={() => router.push("/browse")}>
              <Cpu className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
              Browse Technologies
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={() => router.push("/knowledge?tab=materials")}>
              <FlaskConical className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
              Browse Materials
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={() => router.push("/suppliers")}>
              <Globe className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
              Browse by Country
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={() => router.push("/guides")}>
              <Grid3X3 className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
              Guides
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={handleAboutClick}>
              <Info className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-125" />
              About
            </Button>
            {isAdminPage && (
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={() => router.push("/admin/seo-dashboard")}>
                <BarChart3 className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
                SEO Dashboard
              </Button>
            )}
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground group" onClick={handleBecomeSupplierClick}>
              <UserPlus className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
              Become a Supplier
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
        )}

        <div
          className={`md:hidden fixed inset-y-0 right-0 w-64 bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-semibold text-foreground">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigate("/browse")}>
                <Cpu className="h-4 w-4 mr-3" /> Browse Technologies
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigate("/knowledge?tab=materials")}>
                <FlaskConical className="h-4 w-4 mr-3" /> Browse Materials
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigate("/suppliers")}>
                <Globe className="h-4 w-4 mr-3" /> Browse by Country
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigate("/technology-guide")}>
                <BookOpen className="h-4 w-4 mr-3" /> Tech Guide
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigate("/guides")}>
                <Grid3X3 className="h-4 w-4 mr-3" /> Guides
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={handleAboutClick}>
                <Info className="h-4 w-4 mr-3" /> About
              </Button>
              {isAdminPage && (
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleNavigate("/admin/seo-dashboard")}>
                  <BarChart3 className="h-4 w-4 mr-3" /> SEO Dashboard
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={handleBecomeSupplierClick}>
                <UserPlus className="h-4 w-4 mr-3" /> Become a Supplier
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

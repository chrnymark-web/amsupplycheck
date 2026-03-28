import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RippleButton } from '@/components/ui/ripple-button';
import { Search, Menu, Sparkles, X, RefreshCw, Grid3X3, Info, UserPlus, BookOpen, Globe, BarChart3, User, LogOut, Layers, ChevronDown, Cpu, FlaskConical, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '@/assets/amsupplycheck-logo-white.png';
import SupplierFormDialog from '@/components/SupplierFormDialog';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  className?: string;
  onScrollToSection?: (sectionId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ className = "", onScrollToSection }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
  };

  const handleAboutClick = () => {
    if (isHomePage && onScrollToSection) {
      onScrollToSection('why-choose');
    } else {
      navigate('/about');
    }
    setMobileMenuOpen(false);
  };

  const handleBecomeSupplierClick = () => {
    if (isHomePage && onScrollToSection) {
      onScrollToSection('contact');
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Single row with logo left and menu items right */}
        <div className="flex items-center justify-between h-20 py-1">
          {/* Logo on left */}
          <div 
            className="flex items-center cursor-pointer flex-shrink-0 mt-2"
            onClick={() => navigate('/')}
          >
            <img
              src={logo}
              alt="AMSupplyCheck"
              className="h-16 w-auto"
            />
          </div>

          {/* All menu items on right */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Browse Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground group">
                  <Layers className="h-4 w-4 mr-1.5" />
                  Browse
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Browse by</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/browse')}>
                  <Layers className="h-4 w-4 mr-2" />
                  All Capabilities
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/knowledge?tab=technologies')}>
                  <Cpu className="h-4 w-4 mr-2" />
                  Technologies
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/knowledge?tab=materials')}>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Materials
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/suppliers')}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Countries &amp; Suppliers
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/knowledge')}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Knowledge Base
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground group"
              onClick={() => navigate('/search')}
            >
              <RefreshCw className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:animate-spin" />
              Search
            </Button>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground group"
              onClick={() => {
                if (isHomePage && onScrollToSection) {
                  onScrollToSection('supplier-map');
                } else {
                  navigate('/#supplier-map');
                }
              }}
            >
              <Globe className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:rotate-12" />
              Map
            </Button>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground group"
              onClick={() => navigate('/guides')}
            >
              <Grid3X3 className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
              Guides
            </Button>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground group"
              onClick={handleAboutClick}
            >
              <Info className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-125" />
              About
            </Button>
            {isAdminPage && (
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground group"
                onClick={() => navigate('/admin/seo-dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110" />
                SEO Dashboard
              </Button>
            )}
            {isHomePage ? (
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground group"
                onClick={handleBecomeSupplierClick}
              >
                <UserPlus className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                Become a Supplier
              </Button>
            ) : (
              <SupplierFormDialog>
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground group"
                >
                  <UserPlus className="h-4 w-4 mr-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                  Become a Supplier
                </Button>
              </SupplierFormDialog>
            )}
            {/* User account button */}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground group"
                onClick={handleSignOut}
                title={user.email}
              >
                <User className="h-4 w-4 mr-1.5" />
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/auth')}
              >
                <User className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu Backdrop - rendered first so menu appears on top */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Mobile Menu */}
        <div 
          className={`md:hidden fixed inset-y-0 right-0 w-64 bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-semibold text-foreground">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted group"
                onClick={() => {
                  if (isHomePage && onScrollToSection) {
                    onScrollToSection('supplier-map');
                  } else {
                    navigate('/#supplier-map');
                  }
                  setMobileMenuOpen(false);
                }}
              >
                <Globe className="h-4 w-4 mr-3 transition-transform duration-300 group-hover:rotate-12" />
                Global Supplier Map
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted group"
                onClick={() => handleNavigate('/search')}
              >
                <RefreshCw className="h-4 w-4 mr-3 transition-transform duration-300 group-hover:animate-spin" />
                Advanced Search
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => handleNavigate('/technology-guide')}
              >
                <BookOpen className="h-4 w-4 mr-3" />
                Tech Guide
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => handleNavigate('/guides')}
              >
                <Grid3X3 className="h-4 w-4 mr-3" />
                Guides
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={handleAboutClick}
              >
                <Info className="h-4 w-4 mr-3" />
                About
              </Button>
              {isAdminPage && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => handleNavigate('/admin/seo-dashboard')}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  SEO Dashboard
                </Button>
              )}
              {isHomePage ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={handleBecomeSupplierClick}
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  Become a Supplier
                </Button>
              ) : (
                <SupplierFormDialog>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <UserPlus className="h-4 w-4 mr-3" />
                    Become a Supplier
                  </Button>
                </SupplierFormDialog>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
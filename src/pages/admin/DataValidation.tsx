import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AutomatedValidation } from "@/components/validation/AutomatedValidation";
import { ValidationConfig } from "@/components/validation/ValidationConfig";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";

const DataValidation = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (event === "SIGNED_IN") {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      console.log("Role check:", { roles, error, userId: session.user.id });

      if (error) {
        console.error("Error fetching roles:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(roles && roles.length > 0);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You need admin privileges to access this page. Please contact an administrator to grant you access.
            </p>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Supplier Validation</h1>
              <p className="text-muted-foreground">
                Automated web scraping validation
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
                View Dashboard
              </Button>
              <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
            </div>
          </div>
          <div className="space-y-8">
            <ValidationConfig />
            <AutomatedValidation />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataValidation;
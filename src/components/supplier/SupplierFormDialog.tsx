import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { trackConversion } from '@/lib/analytics';

interface SupplierFormData {
  name: string;
  email: string;
  company: string;
  website?: string; // Honeypot field for bot detection
}

interface SupplierFormDialogProps {
  children: React.ReactNode;
}

const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<SupplierFormData>({
    defaultValues: {
      name: '',
      email: '',
      company: '',
      website: '' // Honeypot field
    }
  });

  const onSubmit = async (data: SupplierFormData) => {
    // Bot detection: if honeypot field is filled, silently reject
    if (data.website) {
      toast({
        title: "Application Submitted",
        description: "Thank you for your interest! We'll be in touch soon.",
      });
      form.reset();
      setOpen(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to database (exclude honeypot field)
      const { website, ...submitData } = data;
      const { error: dbError } = await supabase
        .from('supplier_applications')
        .insert([submitData]);

      if (dbError) throw dbError;

      // Note: Notification emails are now sent via database trigger for security
      // This ensures the endpoint cannot be abused by attackers

      // Track conversion in Google Analytics
      trackConversion('supplier_application', data.company);

      toast({
        title: "Application Submitted",
        description: "Thank you for your interest! We'll be in touch soon.",
      });
      
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Become a Supplier</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="company"
              rules={{ required: "Company name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Honeypot field - hidden from humans, visible to bots */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your website" 
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary hover:shadow-hover transition-all duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierFormDialog;
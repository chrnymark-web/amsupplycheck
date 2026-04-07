import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useInView } from '@/hooks/use-in-view';
import { Mail, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackConversion } from '@/lib/analytics';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Bot detection field
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { ref: newsletterRef, isInView: newsletterInView } = useInView({ threshold: 0.2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection: if honeypot field is filled, silently reject
    if (honeypot) {
      toast({
        title: "Subscribed!",
        description: "You are now subscribed to our newsletter.",
      });
      setEmail('');
      return;
    }
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('newsletter_signups')
        .insert([{ email }]);

      if (dbError) {
        if (dbError.code === '23505') { // Unique violation
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed to our newsletter.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        throw dbError;
      }

      // Note: Notification emails are now sent via database trigger for security
      // This ensures the endpoint cannot be abused by attackers

      // Track conversion in Google Analytics
      trackConversion('newsletter_signup', email);

      toast({
        title: "Subscribed!",
        description: "You are now subscribed to our newsletter.",
      });
      
      setEmail('');
    } catch (error) {
      console.error('Error subscribing:', error);
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
    <section ref={newsletterRef} className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-y border-border">
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${
        newsletterInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className={`inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 transition-all duration-700 delay-100 ${
          newsletterInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}>
          <Mail className="h-8 w-8 text-primary" />
        </div>
        
        <h2 className={`text-3xl sm:text-4xl font-bold mb-4 transition-all duration-700 delay-200 ${
          newsletterInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}>
          Stay Updated
        </h2>
        
        <p className={`text-lg text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-700 delay-300 ${
          newsletterInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}>
          Get the latest news about 3D printing suppliers, technologies and trends directly in your inbox
        </p>

        <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto transition-all duration-700 delay-400 ${
          newsletterInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}>
          {/* Honeypot field - hidden from humans, visible to bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="bg-gradient-primary hover:shadow-hover transition-all duration-300"
          >
            <Zap className="h-4 w-4 mr-2" />
            Subscribe
          </Button>
        </form>

        <p className={`text-xs text-muted-foreground mt-4 transition-all duration-700 delay-500 ${
          newsletterInView ? 'opacity-100' : 'opacity-0'
        }`}>
          We respect your privacy. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default NewsletterSignup;

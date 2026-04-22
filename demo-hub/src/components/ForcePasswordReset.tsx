import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound, Shield, CheckCircle } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

interface ForcePasswordResetProps {
  onComplete: () => void;
}

const ForcePasswordReset = ({ onComplete }: ForcePasswordResetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: z.infer<typeof resetSchema>) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;

      // Clear the force_password_reset flag
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').update({ force_password_reset: false, temp_password_expires_at: null }).eq('user_id', session.user.id);
      }

      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => onComplete(), 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-[hsl(var(--cognigy-cyan))]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Badge className="mb-6 px-6 py-3 text-sm font-semibold gradient-cognigy text-white border-0 shadow-xl">
              <Shield className="w-4 h-4 mr-2" /> Password Update Required
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
              <span className="text-foreground">Set New</span>
              <br />
              <span className="text-gradient-cognigy">Password</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              You must set a new password before continuing
            </p>
          </div>

          <div className="glass rounded-3xl p-8">
            {isSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Password Updated!</h2>
                <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <KeyRound className="w-8 h-8 text-primary mr-3" />
                    <h2 className="text-2xl font-bold text-foreground">New Password</h2>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                    Your administrator has set a temporary password. Please choose a new secure password to continue.
                  </div>
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">New Password</FormLabel>
                      <FormControl><Input type="password" placeholder="At least 8 characters" {...field} autoFocus className="h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Confirm Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Re-enter your password" {...field} className="h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    <KeyRound className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordReset;

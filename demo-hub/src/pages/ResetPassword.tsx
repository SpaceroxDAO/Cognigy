import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { logAuthEvent } from '@/services/authEvents';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const [isReady, setIsReady] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    console.log('[ResetPassword] Init — token present:', !!token, ', email present:', !!email);

    if (token && email) {
      // OTP-based flow: sign out any stale session first, then verify token
      console.log('[ResetPassword] Signing out any stale session before OTP verify');
      supabase.auth.signOut().then(() => {
        console.log('[ResetPassword] Verifying OTP for', email);
        return supabase.auth.verifyOtp({ email, token, type: 'recovery' });
      }).then(({ data, error }) => {
          if (error) {
            console.error('[ResetPassword] OTP verification failed:', error.message);
            setVerifyError('This link has expired or already been used. Please request a new one.');
          } else {
            console.log('[ResetPassword] OTP verified successfully, session user:', data.session?.user?.id, 'email:', data.session?.user?.email);
            setIsReady(true);
          }
        });
    } else {
      // Legacy hash-based flow (e.g. from email links)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        console.log('[ResetPassword] Auth state change:', event);
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setIsReady(true);
        }
      });
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('[ResetPassword] Existing session found for user:', session.user.id);
          setIsReady(true);
        }
      });
      const hash = window.location.hash;
      if (hash && (hash.includes('type=recovery') || hash.includes('type=signup'))) {
        setIsReady(true);
      }
      return () => subscription.unsubscribe();
    }
  }, [searchParams]);

  const onSubmit = async (values: z.infer<typeof resetSchema>) => {
    try {
      setIsSubmitting(true);
      console.log('[ResetPassword] Updating password...');
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        console.error('[ResetPassword] Password update failed:', error.message);
        throw error;
      }
      console.log('[ResetPassword] Password updated successfully');
      setIsSuccess(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[ResetPassword] Post-update session user:', session?.user?.id);

      // Clear force_password_reset flag so user isn't blocked on next login
      if (session?.user) {
        const { error: profileError } = await supabase.from('profiles').update({
          force_password_reset: false,
          temp_password_expires_at: null,
        }).eq('user_id', session.user.id);
        if (profileError) {
          console.error('[ResetPassword] Failed to clear force_password_reset:', profileError.message);
        } else {
          console.log('[ResetPassword] Cleared force_password_reset and temp_password_expires_at for user:', session.user.id);
        }
      } else {
        console.warn('[ResetPassword] No session after password update — force_password_reset NOT cleared');
      }

      logAuthEvent('password_reset_complete', session?.user?.email || '', session?.user?.id);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('[ResetPassword] Error:', error.message);
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
              <Shield className="w-4 h-4 mr-2" /> Secure Access
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
              <span className="text-foreground">Reset</span>
              <br />
              <span className="text-gradient-cognigy">Password</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Choose a new secure password for your account
            </p>
          </div>

          <div className="glass rounded-3xl p-8">
            {verifyError ? (
              <div className="text-center py-6">
                <KeyRound className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Link Expired</h2>
                <p className="text-muted-foreground mb-4">{verifyError}</p>
                <Button onClick={() => navigate('/login')} variant="outline">Back to Login</Button>
              </div>
            ) : isSuccess ? (
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
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">New Password</FormLabel>
                      <FormControl><Input type="password" placeholder="At least 8 characters" {...field} className="h-12" /></FormControl>
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
                    disabled={isSubmitting || !isReady}
                    className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  >
                    <KeyRound className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </Button>
                  {!isReady && !verifyError && (
                    <p className="text-center text-sm text-muted-foreground">
                      Verifying your reset link...
                    </p>
                  )}
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

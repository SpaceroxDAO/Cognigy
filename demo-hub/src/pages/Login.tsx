import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogIn, Shield, UserPlus, Sparkles, KeyRound, Loader2, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USER_TYPES } from '@/constants/userTypes';
import { logAuthEvent } from '@/services/authEvents';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const requestSchema = z.object({
  email: z.string().email('Invalid email address.'),
  userType: z.enum(['SE', 'AE', 'Partner', 'Other'], { required_error: 'Please select your role.' }),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

const Login = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // Security question challenge state
  const [challengeStep, setChallengeStep] = useState<'email' | 'answer'>('email');
  const [challengeEmail, setChallengeEmail] = useState('');
  const [challengeQuestion1, setChallengeQuestion1] = useState('');
  const [challengeQuestion2, setChallengeQuestion2] = useState('');
  const [challengeAnswer1, setChallengeAnswer1] = useState('');
  const [challengeAnswer2, setChallengeAnswer2] = useState('');
  const [challengeError, setChallengeError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const requestForm = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '', userType: undefined as any },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  // Step 1: Fetch security question for email
  const onResetPasswordEmailSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      setGeneratingLink(true);
      setChallengeError('');
      logAuthEvent('password_reset_request', values.email);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, sendResetIfNoQuestions: true }),
      });
      const data = await res.json();

      if (data.locked) {
        toast.error(`Account temporarily locked. Try again in ${data.minutesRemaining} minute(s).`);
        return;
      }

      if (data.hasQuestions && data.question1 && data.question2) {
        setChallengeEmail(values.email);
        setChallengeQuestion1(data.question1);
        setChallengeQuestion2(data.question2);
        setChallengeStep('answer');
      } else if (data.noQuestions) {
        // User has no security questions — they need admin help
        toast.error('No security questions configured. Please contact an administrator for a password reset.');
      } else {
        toast.error('Unable to process your request. Please contact an administrator.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to look up account');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Step 2: Verify answer and get reset link
  const onChallengeAnswerSubmit = async () => {
    if (!challengeAnswer1.trim() || !challengeAnswer2.trim()) {
      setChallengeError('Please answer both questions.');
      return;
    }
    try {
      setVerifying(true);
      setChallengeError('');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-security-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: challengeEmail, answer1: challengeAnswer1, answer2: challengeAnswer2 }),
      });
      const data = await res.json();

      if (data.locked) {
        setChallengeError(`Account locked due to too many failed attempts. Try again in ${data.minutesRemaining || 15} minute(s).`);
        return;
      }

      if (!res.ok) {
        setChallengeError(data.error || 'Verification failed');
        return;
      }

      if (data.token) {
        // Redirect directly to reset-password with the OTP token
        toast.success('Identity verified! Redirecting to set your new password...');
        navigate(`/reset-password?token=${encodeURIComponent(data.token)}&email=${encodeURIComponent(challengeEmail)}`);
      } else {
        setChallengeError('Unable to generate reset token. Please contact an administrator.');
      }
    } catch (error: any) {
      setChallengeError(error.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setErrorMessage('');
      setIsLoggingIn(true);
      console.log('[Login] Attempting sign in for:', values.email);
      const { error } = await signIn(values.email, values.password);
      if (error) {
        console.error('[Login] signIn error:', error.message, error);
        throw error;
      }
      console.log('[Login] signIn succeeded');

      // Check temp password expiry before proceeding
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Login] Session after signIn:', session?.user?.id, 'email:', session?.user?.email);
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('force_password_reset, temp_password_expires_at, force_security_setup')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('[Login] Profile data:', JSON.stringify(profile), 'error:', profileError?.message);

        if (profile?.force_password_reset && profile?.temp_password_expires_at) {
          const expiresAt = new Date(profile.temp_password_expires_at);
          console.log('[Login] Temp password expires at:', expiresAt.toISOString(), 'now:', new Date().toISOString(), 'expired:', expiresAt < new Date());
          if (expiresAt < new Date()) {
            await supabase.auth.signOut();
            setErrorMessage('Your temporary password has expired. Please contact your administrator for a new one.');
            toast.error('Temporary password expired');
            logAuthEvent('login_failure', values.email, session.user.id, { reason: 'temp_password_expired' });
            return;
          }
        }
      }

      logAuthEvent('login_success', values.email, session?.user?.id);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: any) {
      let msg: string;
      console.error('[Login] Login failed:', error.message, error);
      if (error.message?.includes('Invalid login') || error.message?.includes('invalid_credentials')) {
        msg = 'Invalid email or password. If you recently set a new password, please ensure you are using the updated password.';
      } else {
        msg = error.message || 'Login failed';
      }
      setErrorMessage(msg);
      toast.error('Login failed');
      logAuthEvent('login_failure', values.email, null, { reason: msg });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onRequestAccessSubmit = async (values: z.infer<typeof requestSchema>) => {
    try {
      setRequestSuccess('');
      setRequesting(true);
      const { error } = await supabase.from('access_requests').insert({ email: values.email, user_type: values.userType });
      if (error) {
        if (error.code === '23505') {
          throw new Error('An access request for this email is already pending. You will be notified once it is reviewed.');
        }
        throw error;
      }
      setRequestSuccess('Access request submitted! You will be notified once approved.');
      requestForm.reset();
      toast.success('Access request submitted successfully!');
    } catch (error: any) {
      requestForm.setError('email', { type: 'custom', message: error.message || 'Request failed' });
      toast.error(error.message || 'Request failed');
    } finally {
      setRequesting(false);
    }
  };

  const resetResetPasswordView = () => {
    setShowResetPassword(false);
    setChallengeStep('email');
    setChallengeEmail('');
    setChallengeQuestion1('');
    setChallengeQuestion2('');
    setChallengeAnswer1('');
    setChallengeAnswer2('');
    setChallengeError('');
    resetPasswordForm.reset();
  };

  const currentView = showResetPassword ? 'resetPassword' : showRequestAccess ? 'request' : 'login';

  const headingMain = { login: 'Welcome', resetPassword: 'Reset', request: 'Request' }[currentView];
  const headingAccent = { login: 'Back', resetPassword: 'Password', request: 'Access' }[currentView];
  const subheading = {
    login: 'Sign in to access your AI specialist dashboard',
    resetPassword: challengeStep === 'answer' ? 'Answer your security questions to verify your identity' : 'Enter your email to reset your password',
    request: 'Submit your request for platform access',
  }[currentView];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-[hsl(var(--cognigy-cyan))]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(var(--cognigy-purple))]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-6 px-6 py-3 text-sm font-semibold gradient-cognigy text-white border-0 shadow-xl">
              <Shield className="w-4 h-4 mr-2" /> Secure Access
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
              <span className="text-foreground">{headingMain}</span>
              <br />
              <span className="text-gradient-cognigy">{headingAccent}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">{subheading}</p>
          </div>

          {/* Form Card */}
          <div className="glass rounded-3xl p-8">

            {/* Reset Password with Security Question */}
            {currentView === 'resetPassword' && (
              <>
                {challengeStep === 'email' && (
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordEmailSubmit)} className="space-y-6">
                      <div className="flex items-center justify-center mb-6">
                        <KeyRound className="w-8 h-8 text-primary mr-3" />
                        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
                      </div>
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                        Enter your email address. You'll need to answer your security questions to verify your identity.
                      </div>
                      <FormField control={resetPasswordForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Email Address</FormLabel>
                          <FormControl><Input placeholder="your@email.com" {...field} autoFocus className="h-12" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex flex-col gap-3">
                        <Button type="submit" disabled={generatingLink} className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all">
                          {generatingLink ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Looking up...</> : <><KeyRound className="w-5 h-5 mr-2" /> Continue</>}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetResetPasswordView} className="w-full h-12">
                          Back to Sign In
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}

                {challengeStep === 'answer' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <HelpCircle className="w-8 h-8 text-primary mr-3" />
                      <h2 className="text-2xl font-bold text-foreground">Security Questions</h2>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
                      Answer both questions below to verify your identity.
                    </div>
                    <div className="space-y-2">
                      <label className="text-foreground font-semibold text-sm">{challengeQuestion1}</label>
                      <Input
                        placeholder="Your answer"
                        value={challengeAnswer1}
                        onChange={e => { setChallengeAnswer1(e.target.value); setChallengeError(''); }}
                        autoFocus
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-foreground font-semibold text-sm">{challengeQuestion2}</label>
                      <Input
                        placeholder="Your answer"
                        value={challengeAnswer2}
                        onChange={e => { setChallengeAnswer2(e.target.value); setChallengeError(''); }}
                        className="h-12"
                        onKeyDown={e => { if (e.key === 'Enter') onChallengeAnswerSubmit(); }}
                      />
                      <p className="text-xs text-muted-foreground">Answers are case-insensitive.</p>
                    </div>
                    {challengeError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">{challengeError}</div>
                    )}
                    <div className="flex flex-col gap-3">
                      <Button onClick={onChallengeAnswerSubmit} disabled={verifying} className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all">
                        {verifying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</> : <><Shield className="w-5 h-5 mr-2" /> Verify & Reset Password</>}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetResetPasswordView} className="w-full h-12">
                        Back to Sign In
                      </Button>
                    </div>
                  </div>
                )}



              </>
            )}

            {/* Login */}
            {currentView === 'login' && (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <LogIn className="w-8 h-8 text-primary mr-3" />
                    <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                  </div>
                  {errorMessage && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">{errorMessage}</div>
                  )}
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Email Address</FormLabel>
                      <FormControl><Input placeholder="Email" {...field} autoFocus className="h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-semibold">Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Enter your password" {...field} className="h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={isLoggingIn} className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50">
                    <LogIn className="w-5 h-5 mr-2" /> {isLoggingIn ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <div className="text-center pt-4 border-t border-border space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Forgot your password? </span>
                      <Button type="button" variant="link" className="p-0 h-auto text-primary font-semibold text-sm" onClick={() => { setShowResetPassword(true); setErrorMessage(''); }}>
                        Reset Password
                      </Button>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Don't have access? </span>
                      <Button type="button" variant="link" className="p-0 h-auto text-primary font-semibold" onClick={() => { setShowRequestAccess(true); setErrorMessage(''); setRequestSuccess(''); }}>
                        Request Access
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}

            {/* Request Access */}
            {currentView === 'request' && (
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(onRequestAccessSubmit)} className="space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <UserPlus className="w-8 h-8 text-primary mr-3" />
                    <h2 className="text-2xl font-bold text-foreground">Request Access</h2>
                  </div>
                  {requestSuccess ? (
                    <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <Sparkles className="w-6 h-6 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold text-foreground">{requestSuccess}</p>
                    </div>
                  ) : (
                    <>
                      <FormField control={requestForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Your Email</FormLabel>
                          <FormControl><Input placeholder="Email" {...field} autoFocus className="h-12" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={requestForm.control} name="userType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Your Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {USER_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </>
                  )}
                  <div className="flex flex-col gap-3">
                    {!requestSuccess && (
                      <Button type="submit" disabled={requesting} className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all">
                        <UserPlus className="w-5 h-5 mr-2" /> {requesting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={() => { setShowRequestAccess(false); setErrorMessage(''); requestForm.reset(); setRequestSuccess(''); }} className="w-full h-12">
                      {requestSuccess ? 'Back to Sign In' : 'Cancel'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Mail, ArrowLeft, CheckCircle, Shield, Loader2 } from "lucide-react";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What was the make of your first car?",
  "What street did you grow up on?",
  "What is your favorite movie?",
];

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Security question state
  const [secQuestion1, setSecQuestion1] = useState("");
  const [secAnswer1, setSecAnswer1] = useState("");
  const [secQuestion2, setSecQuestion2] = useState("");
  const [secAnswer2, setSecAnswer2] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [user, loading, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: "Incorrect current password", description: "Please check your current password and try again.", variant: "destructive" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update password.", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) return null;

  const handleSaveSecurityQuestion = async () => {
    if (!secQuestion1 || !secAnswer1.trim() || !secQuestion2 || !secAnswer2.trim()) {
      toast({ title: "Missing fields", description: "Please complete both security questions.", variant: "destructive" });
      return;
    }
    if (secQuestion1 === secQuestion2) {
      toast({ title: "Duplicate questions", description: "Please select two different questions.", variant: "destructive" });
      return;
    }
    setSavingSecurity(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await supabase.functions.invoke("set-security-question", {
        body: { question: secQuestion1, answer: secAnswer1, question2: secQuestion2, answer2: secAnswer2 },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setSecuritySuccess(true);
      setSecAnswer1("");
      setSecAnswer2("");
      toast({ title: "Security questions updated", description: "Your security questions have been saved." });
      setTimeout(() => setSecuritySuccess(false), 4000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save.", variant: "destructive" });
    } finally {
      setSavingSecurity(false);
    }
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <div className="mb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-3xl font-black text-white">{displayName.charAt(0).toUpperCase()}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">{displayName}</h1>
            <p className="text-slate-500 mt-1">{email}</p>
          </div>

          {/* Account Info */}
          <Card className="mb-6 border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <User className="w-5 h-5 text-blue-500" /> Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Display Name</Label>
                <p className="font-semibold text-slate-800 mt-1">{displayName}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <p className="font-semibold text-slate-800">{email}</p>
                </div>
              </div>
              {profile?.user_type && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">User Type</Label>
                  <p className="font-semibold text-slate-800 mt-1">{profile.user_type}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Lock className="w-5 h-5 text-blue-500" /> Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccess ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-semibold">Password updated successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="mt-1 rounded-xl"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="mt-1 rounded-xl"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="mt-1 rounded-xl"
                      placeholder="Repeat new password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg"
                  >
                    {isChangingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Security Question */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Shield className="w-5 h-5 text-blue-500" /> Security Questions
              </CardTitle>
              <CardDescription>
                Optionally update your security questions used for password resets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securitySuccess ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-semibold">Security questions updated!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Question 1</Label>
                    <Select onValueChange={setSecQuestion1} value={secQuestion1}>
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Select first question" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_QUESTIONS.filter(q => q !== secQuestion2).map(q => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={secAnswer1}
                      onChange={e => setSecAnswer1(e.target.value)}
                      placeholder="Your answer"
                      className="mt-2 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Question 2</Label>
                    <Select onValueChange={setSecQuestion2} value={secQuestion2}>
                      <SelectTrigger className="mt-1 rounded-xl">
                        <SelectValue placeholder="Select second question" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_QUESTIONS.filter(q => q !== secQuestion1).map(q => (
                          <SelectItem key={q} value={q}>{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={secAnswer2}
                      onChange={e => setSecAnswer2(e.target.value)}
                      placeholder="Your answer"
                      className="mt-2 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Answers are case-insensitive.</p>
                  </div>
                  <Button
                    onClick={handleSaveSecurityQuestion}
                    disabled={savingSecurity}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg"
                  >
                    {savingSecurity ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Update Security Questions"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;

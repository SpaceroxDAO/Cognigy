import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface SecurityQuestionSetupProps {
  onComplete: () => void;
}

const SecurityQuestionSetup = ({ onComplete }: SecurityQuestionSetupProps) => {
  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [saving, setSaving] = useState(false);

  const availableForQ1 = SECURITY_QUESTIONS.filter(q => q !== question2);
  const availableForQ2 = SECURITY_QUESTIONS.filter(q => q !== question1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question1 || !answer1.trim() || !question2 || !answer2.trim()) {
      toast.error('Please complete both security questions.');
      return;
    }
    if (answer1.trim().length < 2 || answer2.trim().length < 2) {
      toast.error('Answers must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('set-security-question', {
        body: { question: question1, answer: answer1, question2, answer2 },
      });

      if (res.error) throw new Error(res.error.message || 'Failed to save');
      if (res.data?.error) throw new Error(res.data.error);

      toast.success('Security questions saved!');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save security questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/20 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-cognigy flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">Security Setup</h1>
          <p className="text-muted-foreground">
            Set up two security questions to verify your identity for password resets.
          </p>
        </div>

        <div className="glass rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-muted-foreground">
              These questions will be used to verify your identity if you ever need to reset your password.
            </div>

            {/* Question 1 */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Question 1</Label>
              <Select onValueChange={setQuestion1} value={question1}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select first security question" />
                </SelectTrigger>
                <SelectContent>
                  {availableForQ1.map(q => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Your answer"
                value={answer1}
                onChange={e => setAnswer1(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Question 2</Label>
              <Select onValueChange={setQuestion2} value={question2}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select second security question" />
                </SelectTrigger>
                <SelectContent>
                  {availableForQ2.map(q => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Your answer"
                value={answer2}
                onChange={e => setAnswer2(e.target.value)}
                className="h-12"
              />
            </div>

            <p className="text-xs text-muted-foreground">Answers are case-insensitive.</p>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-12 gradient-cognigy text-white font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : <><Shield className="w-5 h-5 mr-2" /> Save Security Questions</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SecurityQuestionSetup;

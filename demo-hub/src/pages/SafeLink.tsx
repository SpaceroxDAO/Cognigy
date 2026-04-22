import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SafeLink = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const validation = useMemo(() => {
    const rawTarget = searchParams.get("url");

    if (!rawTarget) {
      return { target: null, error: "Missing destination link." };
    }

    try {
      const target = new URL(rawTarget);

      if (target.origin !== window.location.origin || target.pathname !== "/reset-password") {
        return { target: null, error: "Invalid or unsupported reset link." };
      }

      if (!target.searchParams.get("token") || !target.searchParams.get("email")) {
        return { target: null, error: "This reset link is missing required parameters." };
      }

      return { target: target.toString(), error: null };
    } catch {
      return { target: null, error: "The link format is invalid." };
    }
  }, [searchParams]);

  const continueToReset = () => {
    if (!validation.target) return;
    window.location.assign(validation.target);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          {validation.error ? (
            <div className="space-y-4 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
              <h1 className="text-2xl font-bold">Invalid link</h1>
              <p className="text-sm text-muted-foreground">{validation.error}</p>
              <Button variant="outline" onClick={() => navigate("/login")}>Back to Login</Button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold">Set your password</h1>
              <p className="text-sm text-muted-foreground">
                Click continue to open your one-time password setup link. This helps prevent link preview bots from consuming it.
              </p>
              <Button onClick={continueToReset} className="w-full sm:w-auto">
                <ExternalLink className="mr-2 h-4 w-4" />
                Continue to Password Setup
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default SafeLink;

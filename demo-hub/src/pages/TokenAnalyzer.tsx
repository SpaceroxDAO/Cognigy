import { useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const TokenAnalyzer = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendAuthToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'AUTH_TOKEN', token },
        window.location.origin
      );
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'REQUEST_AUTH_TOKEN') {
        sendAuthToken();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendAuthToken]);

  const handleIframeLoad = () => {
    sendAuthToken();
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navigation />

      <div className="pt-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Token Analyzer Dashboard</h1>
          </div>

          {/* Iframe container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <iframe
              ref={iframeRef}
              src="/token-analyzer-dashboard.html"
              className="w-full border-0"
              style={{ height: "calc(100vh - 180px)" }}
              title="Token Analyzer Dashboard"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              onLoad={handleIframeLoad}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenAnalyzer;

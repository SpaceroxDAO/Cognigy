import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import AgentCarousel from "@/components/AgentCarousel";
import WebRTCDemo from "@/components/WebRTCDemo";
import { useFlows } from "@/contexts/FlowContext";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/ui/loading";

interface AgentPageProps {
  botName: string;
  theme?: string;
  subtitle: string;
  description: string;
  features?: string[];
  gradient: string;
  icon: ReactNode;
  bgGradient: string;
  bgRadialGradient: string;
  textGradient: string;
  capabilities?: string[];
  onLogout?: () => void;
}

const AgentPage = ({
  botName,
  theme = "default",
  subtitle,
  description,
  gradient,
  icon,
  bgGradient,
  bgRadialGradient,
  textGradient,
  onLogout,
}: AgentPageProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { loading: flowsLoading, getFlowByPath, getVisibleFlows } = useFlows();

  const path = window.location.pathname;
  const flow = getFlowByPath(path);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (authLoading || flowsLoading) {
    return (
      <div className={`min-h-screen ${bgGradient}`}>
        <Navigation theme={theme} />
        <div className="flex items-center justify-center min-h-screen">
          <Loading variant="fullscreen" size="xl" text={`Loading ${botName}...`} />
        </div>
      </div>
    );
  }

  const flowName = flow?.name || botName;
  const flowDescription = flow?.description || description;
  const flowGradient = flow?.gradient || gradient;

  // Build capabilities for WebRTCDemo
  const capabilities = flow?.capabilities as any[] | null;
  const enabledCapabilities = capabilities?.filter((c) => c.enabled !== false) ?? [];
  const webrtcCapabilities = enabledCapabilities.map((cap: any) => ({
    title: cap.title,
    desc: cap.description,
    iconName: cap.icon || 'CheckCircle',
  }));

  // Agents for carousel
  const visibleFlows = getVisibleFlows() || [];
  const agents = visibleFlows.map((f) => ({
    id: f.id,
    title: f.name,
    description: f.description,
    icon: icon,
    path: f.path,
    gradient: f.gradient,
    color: f.color,
    avatar: f.avatar || "/avatar-placeholder.png",
    fallback: f.fallback,
    comingSoon: f.coming_soon,
  }));

  // Derive color from flow for background
  const flowColor = flow?.color || 'blue';
  const bgColors: Record<string, string> = {
    red: 'bg-gradient-to-br from-red-50 via-pink-50/50 to-white',
    blue: 'bg-gradient-to-br from-blue-50 via-cyan-50/50 to-white',
    indigo: 'bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white',
    orange: 'bg-gradient-to-br from-orange-50 via-amber-50/50 to-white',
    green: 'bg-gradient-to-br from-green-50 via-emerald-50/50 to-white',
    purple: 'bg-gradient-to-br from-purple-50 via-violet-50/50 to-white',
    sky: 'bg-gradient-to-br from-sky-50 via-blue-50/50 to-white',
  };
  const resolvedBg = bgColors[flowColor] || bgGradient;

  return (
    <>
      <Navigation theme={theme} />
      <section className={`relative pt-32 md:pt-40 pb-10 px-4 ${resolvedBg} overflow-hidden min-h-screen`}
        style={{ background: bgRadialGradient }}>
        <div className="container mx-auto relative z-10 max-w-7xl">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />Back to Specialist Hub
          </Button>

          <div className="space-y-16">
          <WebRTCDemo
              key="webrtc-demo"
              botName={flowName}
              description={flowDescription}
              capabilities={webrtcCapabilities}
              themeColor={flowColor}
              webrtcUrl={flow?.webrtc_url ?? undefined}
            />

            {/* Agent Selector Carousel */}
            <div className="mt-20">
              <h3 className="text-3xl font-black text-slate-900 text-center mb-12 tracking-tight">
                Try Other <span className={`text-transparent ${textGradient} bg-clip-text`}>AI Specialists</span>
              </h3>
              <AgentCarousel agents={agents} currentAgent={theme} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AgentPage;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AgentCarousel from "@/components/AgentCarousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Zap, Users, Shield } from "lucide-react";
import { useFlows } from "@/contexts/FlowContext";
import { getIconComponent } from "@/utils/iconUtils";
import Loading from "@/components/ui/loading";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { getVisibleFlows, getEnabledFlows, loading, error } = useFlows();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <Loading variant="fullscreen" size="xl" text="Loading..." />
      </div>
    );
  }

  if (!user) return null;


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loading variant="fullscreen" size="xl" text="Loading AI specialists..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-2xl mx-auto p-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Unable to Load AI Specialists</h1>
            <p className="text-lg text-slate-600 mb-8">Please try refreshing the page or contact support if the problem persists.</p>
            <Button onClick={() => window.location.reload()} size="lg">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const visibleFlows = getVisibleFlows() || [];
  const agents = visibleFlows.map(flow => ({
    id: flow.id,
    title: flow.name,
    description: flow.description,
    icon: getIconComponent(flow.icon),
    path: flow.path,
    gradient: flow.gradient,
    color: flow.color,
    avatar: flow.avatar || "/placeholder.svg",
    fallback: flow.fallback,
    comingSoon: flow.coming_soon
  }));

  const enabledFlows = getEnabledFlows() || [];
  const stats = [
    { value: enabledFlows.length.toString(), label: "AI Specialists", icon: <Bot className="w-6 h-6" /> },
    { value: "99.9%", label: "Uptime", icon: <Zap className="w-6 h-6" /> },
    { value: "Enterprise", label: "Security", icon: <Shield className="w-6 h-6" /> },
    { value: "24/7", label: "Available", icon: <Users className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navigation />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-400/5 to-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="relative z-10 pt-32 md:pt-40 pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <Badge className="mb-8 px-6 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <Sparkles className="w-4 h-4 mr-2" />
              Built for What's Next
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                AI Specialist
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Hub
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-600 max-w-5xl mx-auto mb-16 leading-relaxed font-light">
              Experience the future of conversational AI with our 
              <span className="font-semibold text-blue-600"> industry-specialized agents</span>
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-20">
              {stats.map((stat, index) => (
                <div key={index} className="group bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-slate-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-500">
                  <div className="flex items-center justify-center mb-4 text-blue-600 group-hover:text-purple-600 transition-colors duration-300">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Carousel Section */}
          <section className="mb-20">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-8 px-6 py-3 text-purple-700 bg-purple-100 border-purple-200 text-lg font-semibold">
                <Bot className="w-5 h-5 mr-2" />
                Choose Your Demo Experience
              </Badge>
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
                Meet Your <span className="text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">AI Specialists</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto font-light leading-relaxed">
                Each specialist is expertly trained for specific industries, delivering 
                <span className="font-semibold text-purple-600"> precise, compliant, and intelligent conversations</span>
              </p>
            </div>

            <AgentCarousel agents={agents} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;

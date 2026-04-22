import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Play, Sparkles, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Agent {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
  color: string;
  avatar: string;
  fallback: string;
  comingSoon?: boolean;
}

interface AgentCarouselProps {
  agents: Agent[];
  currentAgent?: string;
}

const Skeleton = () => (
  <div className="w-full h-full bg-slate-200 animate-pulse rounded-3xl" />
);

const AgentCarousel = ({ agents, currentAgent }: AgentCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const filteredAgents = useMemo(() => {
    return currentAgent
      ? agents.filter(agent => agent.id !== currentAgent && agent.title !== currentAgent)
      : agents;
  }, [agents, currentAgent]);

  // Eagerly preload all agent avatars to eliminate loading delay
  useEffect(() => {
    filteredAgents.forEach(agent => {
      if (agent.avatar) {
        const img = new Image();
        img.src = agent.avatar;
      }
    });
  }, [filteredAgents]);

  if (filteredAgents.length === 0) {
    return (
      <div className="text-center text-lg text-slate-500 py-12">
        No other AI Specialists available.
      </div>
    );
  }
  const activeAgent = filteredAgents[activeIndex];

  const nextAgent = () => {
    setActiveIndex((prev) => (prev + 1) % filteredAgents.length);
  };

  const prevAgent = () => {
    setActiveIndex((prev) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
  };

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Main Agent Display */}
      <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-xl border-2 border-slate-200/30 shadow-2xl p-12 ${activeAgent.comingSoon ? 'opacity-90' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br opacity-5" style={{
          background: `linear-gradient(135deg, ${activeAgent.color}22, ${activeAgent.color}11)`
        }} />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Agent Info */}
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 ${activeAgent.gradient} rounded-3xl flex items-center justify-center shadow-2xl ${activeAgent.comingSoon ? 'opacity-80' : ''}`}>
                {activeAgent.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">{activeAgent.title}</h2>
                </div>
                <Badge className={`px-4 py-2 bg-blue-100/80 text-blue-700 border-blue-200/50 ${activeAgent.comingSoon ? 'opacity-80' : ''}`}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Specialist
                </Badge>
              </div>
            </div>
            
            <p className={`text-xl text-slate-600 leading-relaxed font-light ${activeAgent.comingSoon ? 'opacity-80' : ''}`}>
              {activeAgent.description}
            </p>
            
            <Button 
              asChild={!activeAgent.comingSoon}
              size="lg"
              className={`w-full lg:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${activeAgent.comingSoon ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
              disabled={!!activeAgent.comingSoon}
            >
              {activeAgent.comingSoon ? (
                <div className="flex items-center justify-center gap-3">
                  <Clock className="w-5 h-5" />
                  Coming Soon
                </div>
              ) : (
                <Link 
                  to={activeAgent.path} 
                  className="flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" />
                  Start {activeAgent.title} Demo
                </Link>
              )}
            </Button>
          </div>

          {/* Agent Avatar */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
              <Avatar className={`w-72 h-72 bg-transparent border-4 border-white/50 shadow-2xl group-hover:scale-105 transition-transform duration-500 ${activeAgent.comingSoon ? 'opacity-80' : ''}`}>
                <AvatarImageWithSkeleton src={activeAgent.avatar} alt={activeAgent.title} />
              </Avatar>
              
              {activeAgent.comingSoon && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-xl shadow-xl border-2 border-white text-xs font-bold">
                  Coming Soon
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={prevAgent}
          className="group bg-white/90 backdrop-blur-md border-2 border-slate-200/50 hover:border-blue-400/50 rounded-2xl shadow-lg hover:shadow-xl"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="ml-2 font-semibold">Previous</span>
        </Button>

        {/* Agent Indicators */}
        <div className="flex gap-4">
          {filteredAgents.map((agent, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 relative ${
                index === activeIndex 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 scale-125 shadow-lg' 
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            >
              {agent.comingSoon && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="lg"
          onClick={nextAgent}
          className="group bg-white/90 backdrop-blur-md border-2 border-slate-200/50 hover:border-blue-400/50 rounded-2xl shadow-lg hover:shadow-xl"
        >
          <span className="mr-2 font-semibold">Next</span>
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>
    </div>
  );
};

function AvatarImageWithSkeleton({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <Skeleton />}
      <AvatarImage
        src={src}
        alt={alt}
        className={`object-contain w-full h-full rounded-3xl transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
}

export default AgentCarousel;

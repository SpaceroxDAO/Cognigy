import AgentPage from "@/components/AgentPage";
import { Home } from "lucide-react";

interface CogniHomeProps {
  onLogout?: () => void;
}

const CogniHome = ({ onLogout }: CogniHomeProps) => {
  return (
    <AgentPage
      botName="CogniHome"
      theme="cognihome"
      subtitle="Home Services Specialist"
      description="AI-powered home services assistant for HVAC, plumbing, and maintenance solutions"
      features={[]} // Will be generated from flow management
      gradient="bg-gradient-to-br from-orange-500 to-amber-500"
      icon={<Home className="w-10 h-10 text-white" />}
      bgGradient="bg-gradient-to-br from-orange-50 via-amber-50/50 to-white"
      bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(255, 237, 213, 0.4) 0%, rgba(254, 243, 199, 0.2) 100%)"
      textGradient="bg-gradient-to-r from-orange-600 to-amber-600"
      capabilities={[]} // Will be generated from flow management
      onLogout={onLogout}
    />
  );
};

export default CogniHome;

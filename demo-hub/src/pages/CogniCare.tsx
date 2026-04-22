import AgentPage from "@/components/AgentPage";
import { Heart } from "lucide-react";

interface CogniCareProps {
  onLogout?: () => void;
}

const CogniCare = ({ onLogout }: CogniCareProps) => {
  return (
    <AgentPage
      botName="CogniCare"
      theme="cognicare"
      subtitle="Healthcare Assistant"
      description="Advanced AI healthcare specialist providing HIPAA-compliant patient support and medical assistance"
      features={[]} // Will be generated from flow management
      gradient="bg-gradient-to-br from-red-500 to-pink-600"
      icon={<Heart className="w-10 h-10 text-white" />}
      bgGradient="bg-gradient-to-br from-red-50 via-pink-50/50 to-white"
      bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(254, 226, 226, 0.4) 0%, rgba(240, 253, 250, 0.2) 100%)"
      textGradient="bg-gradient-to-r from-red-600 to-pink-600"
      capabilities={[]} // Will be generated from flow management
      onLogout={onLogout}
    />
  );
};

export default CogniCare;

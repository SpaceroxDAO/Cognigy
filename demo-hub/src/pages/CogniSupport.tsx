import AgentPage from "@/components/AgentPage";
import { Headphones } from "lucide-react";

interface CogniSupportProps {
  onLogout?: () => void;
}

const CogniSupport = ({ onLogout }: CogniSupportProps) => {
  return (
    <AgentPage
      botName="CogniSupport"
      theme="cognisupport"
      subtitle="IT Support Specialist"
      description="Expert technical support AI providing comprehensive system administration and enterprise solutions"
      features={[]} // Will be generated from flow management
      gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
      icon={<Headphones className="w-10 h-10 text-white" />}
      bgGradient="bg-gradient-to-br from-blue-50 via-cyan-50/50 to-white"
      bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(224, 242, 254, 0.4) 0%, rgba(240, 253, 250, 0.2) 100%)"
      textGradient="bg-gradient-to-r from-blue-600 to-cyan-600"
      capabilities={[]} // Will be generated from flow management
      onLogout={onLogout}
    />
  );
};

export default CogniSupport;

import AgentPage from "@/components/AgentPage";
import { Shield } from "lucide-react";

interface CogniInsureProps {
  onLogout?: () => void;
}

const CogniInsure = ({ onLogout }: CogniInsureProps) => {
  return (
    <AgentPage
      botName="CogniInsure"
      theme="cogniinsure"
      subtitle="Insurance Specialist"
      description="Professional insurance AI providing comprehensive policy management and regulatory compliance"
      features={[]} // Will be generated from flow management
      gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
      icon={<Shield className="w-10 h-10 text-white" />}
      bgGradient="bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white"
      bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(237, 233, 254, 0.4) 0%, rgba(240, 253, 250, 0.2) 100%)"
      textGradient="bg-gradient-to-r from-indigo-600 to-purple-600"
      capabilities={[]} // Will be generated from flow management
      onLogout={onLogout}
    />
  );
};

export default CogniInsure;
 
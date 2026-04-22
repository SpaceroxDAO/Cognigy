import AgentPage from "@/components/AgentPage";
import { DollarSign } from "lucide-react";

interface CogniFinanceProps {
  onLogout?: () => void;
}

const CogniFinance = ({ onLogout }: CogniFinanceProps) => {
  return (
    <AgentPage
      botName="CogniFinance"
      theme="cognifinance"
      subtitle="Financial Advisor"
      description="Intelligent financial AI delivering personalized investment guidance and comprehensive market insights"
      features={[]} // Will be generated from flow management
      gradient="bg-gradient-to-br from-orange-500 to-red-600"
      icon={<DollarSign className="w-10 h-10 text-white" />}
      bgGradient="bg-gradient-to-br from-orange-50 via-red-50/50 to-white"
      bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(255, 247, 237, 0.4) 0%, rgba(240, 253, 250, 0.2) 100%)"
      textGradient="bg-gradient-to-r from-orange-600 to-red-600"
      capabilities={[]} // Will be generated from flow management
      onLogout={onLogout}
    />
  );
};

export default CogniFinance;
 
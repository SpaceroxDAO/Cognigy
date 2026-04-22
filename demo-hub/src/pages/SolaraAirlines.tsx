import AgentPage from "@/components/AgentPage";
import { Plane } from "lucide-react";

interface SolaraAirlinesProps {
  onLogout?: () => void;
}

const SolaraAirlines = ({ onLogout }: SolaraAirlinesProps) => {
  return (
    <AgentPage
      botName="Solara Airlines"
      theme="solaraairlines"
      subtitle="Travel Assistant"
      description="Advanced travel AI providing seamless flight booking, assistance, and customer service"
      features={[]} // Will be generated from flow management
      gradient="bg-gradient-to-br from-sky-500 to-blue-400"
      icon={<Plane className="w-10 h-10 text-white" />}
      bgGradient="bg-gradient-to-br from-sky-50 via-blue-50/50 to-white"
      bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(224, 242, 254, 0.4) 0%, rgba(240, 253, 250, 0.2) 100%)"
      textGradient="bg-gradient-to-r from-blue-600 to-cyan-600"
      capabilities={[]} // Will be generated from flow management
      onLogout={onLogout}
    />
  );
};

export default SolaraAirlines; 
import { Bot } from "lucide-react";
import AgentPage from "@/components/AgentPage";

// Catch-all demo page: renders any flow registered in the Supabase flows table.
// The flow config (name, description, webrtc_url, capabilities, color) is loaded
// from the DB via FlowContext by matching window.location.pathname to flow.path.
const DynamicDemo = () => (
  <AgentPage
    botName=""
    subtitle="AI Specialist"
    description=""
    gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
    icon={<Bot className="w-10 h-10 text-white" />}
    bgGradient="bg-gradient-to-br from-blue-50 via-cyan-50/50 to-white"
    bgRadialGradient="radial-gradient(ellipse at 50% 0%, rgba(219,234,254,0.4) 0%, rgba(240,253,250,0.2) 100%)"
    textGradient="bg-gradient-to-r from-blue-600 to-cyan-600"
  />
);

export default DynamicDemo;

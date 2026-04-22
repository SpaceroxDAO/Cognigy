import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FlowProvider } from "@/contexts/FlowContext";
import SecurityQuestionSetup from "@/components/SecurityQuestionSetup";
import ForcePasswordReset from "@/components/ForcePasswordReset";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import TokenAnalyzer from "./pages/TokenAnalyzer";
import ResetPassword from "./pages/ResetPassword";
import SafeLink from "./pages/SafeLink";
import CogniCare from "./pages/CogniCare";
import CogniSupport from "./pages/CogniSupport";
import CogniInsure from "./pages/CogniInsure";
import CogniFinance from "./pages/CogniFinance";
import CogniHome from "./pages/CogniHome";
import SolaraAirlines from "./pages/SolaraAirlines";
import Admin from "./pages/Admin";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import DynamicDemo from "./pages/DynamicDemo";

const queryClient = new QueryClient();

const SecurityGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, needsSecuritySetup, needsPasswordReset, clearSecuritySetup, clearPasswordReset } = useAuth();
  
  if (loading || !user) return <>{children}</>;

  // Force password reset takes priority
  if (needsPasswordReset) {
    return <ForcePasswordReset onComplete={clearPasswordReset} />;
  }
  
  if (needsSecuritySetup) {
    return <SecurityQuestionSetup onComplete={clearSecuritySetup} />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FlowProvider>
            <SecurityGate>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/token-analyzer" element={<TokenAnalyzer />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/safe-link" element={<SafeLink />} />
                <Route path="/cognicare" element={<CogniCare />} />
                <Route path="/cognisupport" element={<CogniSupport />} />
                <Route path="/cogniinsure" element={<CogniInsure />} />
                <Route path="/cognifinance" element={<CogniFinance />} />
                <Route path="/cognihome" element={<CogniHome />} />
                <Route path="/solaraairlines" element={<SolaraAirlines />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                {/* Dynamic catch-all: any path registered in the flows table works automatically */}
                <Route path="/:flowPath" element={<DynamicDemo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SecurityGate>
          </FlowProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

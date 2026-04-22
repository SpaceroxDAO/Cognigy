import React, { useMemo } from "react";
import { Users, UserPlus, Key, Settings, MessageSquare, Shield, FileText, Bell, BookOpen, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type TabKey = "manage" | "add" | "requests" | "flows" | "feedback" | "roles" | "audit" | "access-logs" | "guide";

export interface AdminTabsProps {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  pendingCount: number;
  feedbackCount?: number;
}

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

const tabConfigs: TabConfig[] = [
  { key: "manage", label: "Manage Users", icon: Users },
  { key: "add", label: "Add User", icon: UserPlus },
  { key: "requests", label: "Access Requests", icon: Key },
  { key: "flows", label: "Flow Management", icon: Settings },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
  { key: "roles", label: "Role Management", icon: Shield },
  { key: "audit", label: "Demo Audit Logs", icon: FileText },
  { key: "access-logs", label: "Access Logs", icon: ShieldCheck },
  { key: "guide", label: "Guide", icon: BookOpen },
];

export const AdminTabs: React.FC<AdminTabsProps> = ({ tab, setTab, pendingCount, feedbackCount = 0 }) => {
  const { isAdmin, hasRole } = useAuth();

  const accessibleTabs = useMemo<TabKey[]>(() => {
    if (isAdmin) return tabConfigs.map(t => t.key);
    const tabs: TabKey[] = [];
    if (hasRole('user-manager')) tabs.push('manage', 'add', 'audit', 'access-logs');
    if (hasRole('flow-manager')) tabs.push('flows');
    if (hasRole('feedback-manager')) tabs.push('feedback');
    tabs.push('guide'); // Guide is available to all admin roles
    return tabs;
  }, [isAdmin, hasRole]);

  const visibleTabs = tabConfigs.filter(t => accessibleTabs.includes(t.key));

  if (visibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Access</h3>
          <p className="text-gray-600">You don't have permission to access any admin features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 border-b-2 border-slate-200/50 pb-4 mb-8">
      {visibleTabs.map((tabConfig) => {
        const Icon = tabConfig.icon;
        const isActive = tab === tabConfig.key;
        return (
          <button
            key={tabConfig.key}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 font-semibold border-b-2 transition-all duration-300 text-sm rounded-t-lg relative",
              isActive
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
            onClick={() => setTab(tabConfig.key)}
          >
            <Icon size={16} />
            {tabConfig.label}
            {tabConfig.key === "requests" && pendingCount > 0 && (
              <span className="ml-1 flex items-center gap-1">
                <Bell size={14} className="animate-pulse text-red-500" />
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              </span>
            )}
            {tabConfig.key === "feedback" && feedbackCount > 0 && (
              <span className="ml-1 bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{feedbackCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

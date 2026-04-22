// Agent name mapping
const AGENT_NAMES: Record<string, string> = {
  CogniCare: 'Nia',
  CogniSupport: 'Sora',
  CogniInsure: 'Sam',
  CogniFinance: 'Taya',
  CogniHome: 'Max',
  'Solara Airlines': 'Sky',
};

const AGENT_ROLES: Record<string, string> = {
  CogniCare: 'AI Healthcare Specialist',
  CogniSupport: 'AI IT Support Specialist',
  CogniInsure: 'AI Insurance Specialist',
  CogniFinance: 'AI Financial Advisor',
  CogniHome: 'AI Home Services Specialist',
  'Solara Airlines': 'AI Travel Assistant',
};

const AGENT_AVATARS: Record<string, string> = {
  CogniCare: '/cognicare-avatar.png',
  CogniSupport: '/cognisupport-avatar.png',
  CogniInsure: '/cogniinsure-avatar.png',
  CogniFinance: '/cognifinance-avatar.png',
  CogniHome: '/cognihome-avatar.png',
  'Solara Airlines': '/sky-avatar.png',
};

// Sub-agent avatars for agent switching (e.g., Nimbus for Solara)
const SUB_AGENT_AVATARS: Record<string, string> = {
  nimbus: '/nimbus-avatar.png',
};

export const getAgentName = (botName: string, agentId?: string): string => {
  return AGENT_NAMES[botName] || botName;
};

export const getAgentRole = (botName: string, agentId?: string): string => {
  return AGENT_ROLES[botName] || 'AI Specialist';
};

export const getAgentAvatar = (botName: string, agentId?: string): string => {
  if (agentId && SUB_AGENT_AVATARS[agentId]) {
    return SUB_AGENT_AVATARS[agentId];
  }
  return AGENT_AVATARS[botName] || '/cognicare-avatar.png';
};

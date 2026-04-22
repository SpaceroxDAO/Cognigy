// WebRTC Status Management Types
export interface WebRTCStatus {
  callStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'ended';
  sipStatus: number;
  sipReason: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  sessionId?: string;
  callId?: string;
  userId?: string;
  urlToken?: string;
  sipConnected: boolean;
  sipUserId?: string;
  accountSid?: string;
  applicationSid?: string;
  callerName?: string;
  callSid?: string;
  traceId?: string;
  originatingSipIp?: string;
  localSipAddress?: string;
  callStartTime?: Date;
  lastActivityTime?: Date;
  lastError?: { code: string; message: string; timestamp: Date; };
}

export interface CognigySIPEvent {
  event: 'CALL_CREATED' | 'CALL_ANSWERED' | 'CALL_ENDED' | 'CALL_FAILED';
  data: { payload: any };
  sessionId: string;
  userId: string;
  URLToken: string;
}

export type WebRTCStatusAction =
  | { type: 'SET_CALL_STATUS'; payload: WebRTCStatus['callStatus'] }
  | { type: 'SET_SIP_STATUS'; payload: { status: number; reason: string } }
  | { type: 'SET_CONNECTION_QUALITY'; payload: WebRTCStatus['connectionQuality'] }
  | { type: 'SET_SESSION_INFO'; payload: { sessionId?: string; callId?: string; userId?: string; urlToken?: string } }
  | { type: 'SET_SIP_CONNECTION'; payload: { connected: boolean; userId?: string } }
  | { type: 'SET_CALL_METADATA'; payload: { callerName?: string; callSid?: string; traceId?: string } }
  | { type: 'SET_NETWORK_INFO'; payload: { originatingIp?: string; localAddress?: string } }
  | { type: 'SET_ERROR'; payload: { code: string; message: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATUS' };

export const SIP_STATUS_MESSAGES: Record<number, string> = {
  100: 'Trying', 180: 'Ringing', 200: 'OK', 486: 'Busy Here',
  487: 'Request Terminated', 488: 'Not Acceptable Here',
  500: 'Internal Server Error', 503: 'Service Unavailable',
  603: 'Decline', 604: 'Does Not Exist Anywhere', 606: 'Not Acceptable'
};

export const CALL_STATUS_DISPLAY: Record<WebRTCStatus['callStatus'], { label: string; color: string; icon: string }> = {
  idle: { label: 'Ready to Call', color: 'text-gray-600', icon: 'phone' },
  connecting: { label: 'Connecting...', color: 'text-blue-600', icon: 'phone-call' },
  connected: { label: 'Connected', color: 'text-green-600', icon: 'phone-call' },
  disconnected: { label: 'Disconnected', color: 'text-red-600', icon: 'phone-off' },
  failed: { label: 'Call Failed', color: 'text-red-600', icon: 'phone-off' },
  ended: { label: 'Call Ended', color: 'text-gray-600', icon: 'phone-off' }
};

export const CONNECTION_QUALITY_DISPLAY: Record<WebRTCStatus['connectionQuality'], { label: string; color: string; bgColor: string }> = {
  excellent: { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' },
  good: { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  poor: { label: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' },
  disconnected: { label: 'Disconnected', color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

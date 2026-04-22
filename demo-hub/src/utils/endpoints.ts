export const COGNIGY_BASE_URL = 'https://endpoint-trial-us.cognigy.ai';

// Legacy named-endpoint fallback map. Flows added via the Supabase flows table use
// webrtc_url directly and don't need entries here. Add a fallback entry only if a
// flow was created before the DB-driven approach.
export const COGNIGY_ENDPOINTS: Record<string, string> = {};

// Primary path: use the full URL from flows.webrtc_url (passed as fullUrl).
// Fallback: construct from COGNIGY_ENDPOINTS map by botName.
export const getCognigyWebRTCEndpoint = (botName: string, _userEmail?: string, fullUrl?: string): string => {
  if (fullUrl) return fullUrl;
  const token = COGNIGY_ENDPOINTS[botName];
  return token ? `${COGNIGY_BASE_URL}/${token}` : '';
};

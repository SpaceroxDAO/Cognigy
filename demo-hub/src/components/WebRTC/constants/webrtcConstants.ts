export const WEBRTC_CONFIG = {
  TIMEOUTS: {
    CONNECTION_TIMEOUT: 30000,
    CALL_ESTABLISHMENT: 15000,
    SIP_RESPONSE: 10000,
  },
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const SIP_MESSAGE_TYPES = {
  INVITE: 'INVITE',
  BYE: 'BYE',
  INFO: 'INFO',
  REGISTER: 'REGISTER',
  OK_200: 'SIP/2.0 200',
  RINGING_180: 'SIP/2.0 180',
  BUSY_486: 'SIP/2.0 486',
  TERMINATED_487: 'SIP/2.0 487',
};

export const CONNECTION_QUALITY = {
  EXCELLENT: 'excellent' as const,
  GOOD: 'good' as const,
  POOR: 'poor' as const,
};

export const INTERFACE_TYPES = {
  DEFAULT: 'default' as const,
  APPOINTMENTS: 'appointments' as const,
  FORM: 'form' as const,
  CONFIRMATION: 'confirmation' as const,
  XAPP: 'xapp' as const,
};

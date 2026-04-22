// Sanitize SIP messages by removing sensitive headers
export const sanitizeSIPMessage = (message: string): string => {
  const sensitiveHeaders = [
    'Authorization:', 'Proxy-Authorization:', 'WWW-Authenticate:',
    'Proxy-Authenticate:', 'X-Auth-Token:', 'X-API-Key:'
  ];
  let sanitized = message;
  sensitiveHeaders.forEach(header => {
    const regex = new RegExp(`${header}[^\\r\\n]*`, 'gi');
    sanitized = sanitized.replace(regex, `${header} [REDACTED]`);
  });
  return sanitized;
};

// Parse SIP INFO message body
export const parseSIPInfoMessage = (message: string): { headers: Record<string, string>; body: any } | null => {
  try {
    // SIP messages use real CRLF (\r\n) — try both real CRLF and escaped variants
    const separator = message.includes('\r\n\r\n') ? '\r\n\r\n' : '\\r\\n\\r\\n';
    const lineSep = message.includes('\r\n') ? '\r\n' : '\\r\\n';

    const parts = message.split(separator);
    if (parts.length < 2) return null;
    
    const headerSection = parts[0];
    const bodySection = parts.slice(1).join(separator);
    
    const headers: Record<string, string> = {};
    headerSection.split(lineSep).forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    });
    
    let body: any = bodySection.trim();
    try {
      body = JSON.parse(bodySection.trim());
    } catch {
      // Keep as string if not valid JSON
    }
    
    return { headers, body };
  } catch {
    return null;
  }
};

// Mask sensitive URL tokens
export const maskUrlTokens = (url: string): string => {
  return url.replace(/\/([a-f0-9]{40,})/gi, '/[TOKEN]');
};

// Extract Call-ID from SIP message
export const extractCallId = (message: string): string | null => {
  const match = message.match(/Call-ID:\\s*([^\r\n]+)/i);
  return match ? match[1].trim() : null;
};

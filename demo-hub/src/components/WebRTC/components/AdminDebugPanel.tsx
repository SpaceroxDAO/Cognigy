import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, Phone, Wifi, Activity, X, Clock, Signal } from 'lucide-react';
import { WebRTCStatus } from '../types';

interface AdminDebugPanelProps {
  isActive?: boolean;
  isWidgetInitialized?: boolean;
  isStartingCall?: boolean;
  metadata?: any;
  sessionInfo?: {
    sessionId?: string;
    userId?: string;
    urlToken?: string;
    callId?: string;
  };
  connectionQuality?: 'excellent' | 'good' | 'poor';
  sipConnected?: boolean;
  sipUserId?: string;
  sipInfoMessages?: Array<{ direction: 'incoming' | 'outgoing'; timestamp: Date; message: string; parsed?: any }>;
  webrtcStatus?: WebRTCStatus;
  onRefresh?: () => void;
  isEnabled?: boolean;
}

const AdminDebugPanel: React.FC<AdminDebugPanelProps> = ({
  isActive, isWidgetInitialized, isStartingCall, metadata, sessionInfo,
  connectionQuality, sipConnected, sipUserId, sipInfoMessages = [],
  webrtcStatus, onRefresh, isEnabled = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showRaw, setShowRaw] = useState(false);

  if (!isEnabled || !isVisible) return null;

  const qualityColor = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-yellow-600 bg-yellow-50',
    poor: 'text-red-600 bg-red-50',
  }[connectionQuality || 'good'] || 'text-gray-600 bg-gray-50';

  return (
    <Card className="border border-orange-200 bg-orange-50/50 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-orange-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Admin Debug Panel
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} className="h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="text-xs">
            <div className="font-medium text-gray-600">Call Active</div>
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs mt-1">
              {isActive ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="text-xs">
            <div className="font-medium text-gray-600">Widget Init</div>
            <Badge variant={isWidgetInitialized ? "default" : "secondary"} className="text-xs mt-1">
              {isWidgetInitialized ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="text-xs">
            <div className="font-medium text-gray-600">SIP Connected</div>
            <Badge variant={sipConnected ? "default" : "secondary"} className="text-xs mt-1">
              {sipConnected ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="text-xs">
            <div className="font-medium text-gray-600">Quality</div>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${qualityColor}`}>
              {connectionQuality || 'N/A'}
            </span>
          </div>
        </div>

        {sessionInfo && (
          <div className="text-xs bg-white rounded p-2 mb-2 font-mono">
            <div className="font-semibold text-gray-700 mb-1">Session Info</div>
            {sessionInfo.sessionId && <div>Session: {sessionInfo.sessionId.substring(0, 20)}...</div>}
            {sessionInfo.callId && <div>Call ID: {sessionInfo.callId.substring(0, 20)}...</div>}
            {sipUserId && <div>SIP User: {sipUserId}</div>}
          </div>
        )}

        {sipInfoMessages.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Signal className="w-3 h-3" />
              SIP Messages ({sipInfoMessages.length})
            </div>
            <ScrollArea className="h-24">
              {sipInfoMessages.slice(-10).map((msg, i) => (
                <div key={i} className="text-xs py-1 border-b border-gray-100 last:border-0">
                  <span className={`font-medium ${msg.direction === 'incoming' ? 'text-blue-600' : 'text-green-600'}`}>
                    [{msg.direction.toUpperCase()}]
                  </span>
                  <span className="text-gray-500 ml-1">{msg.timestamp.toLocaleTimeString()}</span>
                  <div className="text-gray-600 truncate">{msg.message.substring(0, 60)}...</div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2 text-xs h-6">
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export { AdminDebugPanel };

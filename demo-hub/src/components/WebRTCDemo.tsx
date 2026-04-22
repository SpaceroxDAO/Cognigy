import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Play, Video, Mic, MicOff, VideoOff, Settings, Users, Activity, Check, AlertCircle, Calendar, Clock, X, Shield, Wifi, Signal, ExternalLink } from "lucide-react";
import { icons } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Loading from '@/components/ui/loading';
import { AdminDebugPanel } from './WebRTC/components/AdminDebugPanel';
import { InterfaceOverlay } from './WebRTC/components/InterfaceOverlay';
import { getAgentName, getAgentRole, getAgentAvatar } from './WebRTC/utils/agentUtils';
import { getCognigyWebRTCEndpoint } from '../utils/endpoints';
import { sanitizeSIPMessage, parseSIPInfoMessage, maskUrlTokens } from './WebRTC/utils/sipUtils';
import { WEBRTC_CONFIG, SIP_MESSAGE_TYPES, CONNECTION_QUALITY, INTERFACE_TYPES } from './WebRTC/constants/webrtcConstants';
import { useWebRTCOptimization } from './WebRTC/hooks/useWebRTCOptimization';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoLogger } from '@/hooks/useDemoLogger';

// Extend window for WebRTC widget
declare global {
  interface Window {
    initWebRTCWidget?: (endpoint: string, options?: any) => any;
    cognigyWebRTCWidget?: any;
  }
}

interface WebRTCDemoProps {
  botName: string;
  description: string;
  capabilities: { title: string; desc: string; iconName: string }[];
  themeColor?: string;
  webrtcUrl?: string;
}

// Inject CSS to hide widget UI without breaking functionality
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (!document.getElementById('webrtc-widget-hide-style')) {
    const style = document.createElement('style');
    style.id = 'webrtc-widget-hide-style';
    style.textContent = `
      .webrtc_widget_container {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        position: fixed !important;
        top: -9999px !important;
        left: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        opacity: 0 !important;
        z-index: -1000 !important;
      }
      .webrtc_widget_container * {
        visibility: hidden !important;
        opacity: 0 !important;
      }
      .webrtc_widget_container [role="button"],
      .webrtc_widget_container button,
      .webrtc_widget_container input,
      .webrtc_widget_container audio,
      .webrtc_widget_container video {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const WebRTCDemo = ({ botName, description, capabilities, themeColor = 'blue', webrtcUrl }: WebRTCDemoProps) => {
  const { user, isAdmin } = useAuth();
  const { startLog, endLog } = useDemoLogger(botName);
  const [isActive, setIsActive] = useState(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [isWidgetInitialized, setIsWidgetInitialized] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [symptoms, setSymptoms] = useState<Array<{ id: string; text: string; checked: boolean }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [currentInterface, setCurrentInterface] = useState<'default' | 'appointments' | 'form' | 'confirmation' | 'xapp'>('default');
  const [appointments, setAppointments] = useState<Array<{ id: string; date: string; time: string; type: string; available: boolean }>>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [xappURL, setXappURL] = useState<string | null>(null);
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [sipConnected, setSipConnected] = useState(false);
  const [sipUserId, setSipUserId] = useState('');
  const [sipInfoMessages, setSipInfoMessages] = useState<Array<{ direction: 'incoming' | 'outgoing'; timestamp: Date; message: string; parsed?: any }>>([]);
  const [callStartTime, setCallStartTime] = useState<Date | undefined>(undefined);
  const [sipStatus, setSipStatus] = useState<number>(0);
  const [sipReason, setSipReason] = useState<string>('');
  const [isXAppOpen, setIsXAppOpen] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(undefined);

  const webrtcContainerRef = useRef<HTMLDivElement>(null);
  const widgetRefRef = useRef<any>(null);
  const currentSessionRef = useRef<any>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const isEndingCallRef = useRef<boolean>(false);

  const { state: webrtcOptimization, createOptimizedPeerConnection, getOptimizedUserMedia, cleanup: cleanupOptimization } = useWebRTCOptimization();

  const userEmail = user?.email || null;
  const COGNIGY_ENDPOINT = getCognigyWebRTCEndpoint(botName, userEmail || undefined, webrtcUrl);

  // XApp state debug
  useEffect(() => {
    console.log('🎯 XApp state changed:', { isXAppOpen, xappURL, currentInterface });
  }, [isXAppOpen, xappURL, currentInterface]);

  // Reset on bot change
  useEffect(() => {
    const previousBotName = localStorage.getItem('current-bot-name');
    if (previousBotName && previousBotName !== botName) {
      if (isActive && currentSessionRef.current) {
        try {
          if (currentSessionRef.current.isEstablished?.()) {
            currentSessionRef.current.terminate();
          }
        } catch {}
        currentSessionRef.current = null;
      }
      updateCallState({ isActive: false, isStartingCall: false, isMuted: false });
      setIsWidgetInitialized(false);
      setIsCameraOn(false);
      setMetadata({});
      setSymptoms([]);
      setTasks([]);
      setCurrentInterface('default');
      setSelectedAppointment(null);
      setFormData({});
      setXappURL(null);
      setIsXAppOpen(false);
      document.querySelectorAll('.webrtc_widget_container').forEach(w => w.remove());
    }
    localStorage.setItem('current-bot-name', botName);
  }, [botName]);

  // XApp submission detection via console interception
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;

    const checkForSubmissionCompleted = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('XApp closed') || message.includes('submissionClicked') ||
          message.includes('AppPageSDK.submit') || message.includes('[ShellPageSDK] Accepted App submission') ||
          message.includes('got ack for submit!')) {
        setIsXAppOpen(false);
        setXappURL(null);
        setCurrentInterface('default');
      }
    };

    console.log = (...args) => { originalConsoleLog.apply(console, args); checkForSubmissionCompleted(...args); };
    console.info = (...args) => { originalConsoleInfo.apply(console, args); checkForSubmissionCompleted(...args); };
    console.warn = (...args) => { originalConsoleWarn.apply(console, args); checkForSubmissionCompleted(...args); };

    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'muteStateChanged') updateCallState({ isMuted: event.data.muted });
        if (event.data.type === 'callStateChanged') {
          if (event.data.state === 'connected') updateCallState({ isActive: true, isStartingCall: false });
          else if (event.data.state === 'disconnected') updateCallState({ isActive: false, isStartingCall: false });
        }
        if (event.data.type === 'cameraStateChanged') setIsCameraOn(event.data.enabled);
      }
      if (event.data && typeof event.data === 'object' && (
        event.data.type === 'submissionClicked' || event.data.type === 'x-app-submit' || event.data.type === 'xappSubmit'
      )) {
        setIsXAppOpen(false);
        setXappURL(null);
        setCurrentInterface('default');
      }
      if (event.data && typeof event.data === 'object' && event.data.xapp === 'close') {
        setIsXAppOpen(false);
        setXappURL(null);
        setCurrentInterface('default');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      console.log = originalConsoleLog;
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(t => t.stop());
        microphoneStreamRef.current = null;
      }
      cleanupOptimization();
    };
  }, []);

  // Camera container
  useEffect(() => {
    if (isCameraOn && isActive && userVideoRef.current) {
      setTimeout(() => {
        const container = document.querySelector('.camera-container') as HTMLElement;
        if (container && userVideoRef.current && !userVideoRef.current.parentElement) {
          const existing = container.querySelector('video');
          if (existing) existing.remove();
          container.appendChild(userVideoRef.current);
        }
      }, 10);
    }
  }, [isCameraOn, isActive]);

  // Iframe message listener
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'muteState' || event.data.muted !== undefined) {
          setIsMuted(event.data.muted || event.data.audioMuted);
        }
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Network interception
  const setupSafeNetworkInterception = () => {
    const windowObj = window as any;
    if (!windowObj.rtcPeerConnections) windowObj.rtcPeerConnections = [];

    const originalWebSocket = window.WebSocket;
    (window as any).WebSocket = function (url: string, protocols?: string | string[]) {
      const isSIPConnection = url.includes('sip') || url.includes('webrtc') || url.includes('cognigy');
      const ws = new originalWebSocket(url, protocols);

      if (isSIPConnection) {
        const originalSend = ws.send;
        ws.send = function (data: any) {
          try {
            const message = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
            if (message.includes('SIP/2.0') || message.includes('INVITE') || message.includes('BYE')) {
              handleSIPMessage('outgoing', message);
            }
          } catch {}
          return originalSend.call(this, data);
        };

        ws.addEventListener('message', (event: MessageEvent) => {
          try {
            const message = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
            if (message.includes('SIP/2.0') || message.includes('INVITE') || message.includes('BYE') || message.includes('INFO')) {
              handleSIPMessage('incoming', message);
            }
          } catch {}
        });

        ws.addEventListener('open', () => { setSipConnected(true); setConnectionQuality('excellent'); });
        ws.addEventListener('close', () => { setSipConnected(false); setConnectionQuality('poor'); });
        ws.addEventListener('error', () => {
          setSipConnected(false);
          setConnectionQuality('poor');
          setTimeout(() => updateCallState({ isStartingCall: false }), 3000);
        });
      }

      return ws;
    };
  };

  const handleCallEnd = (reason: string = 'Call ended') => {
    if (isEndingCallRef.current) return;
    isEndingCallRef.current = true;

    setIsActive(false);
    setIsStartingCall(false);
    setIsMuted(false);
    setIsCameraOn(false);
    setSipConnected(false);
    setConnectionQuality('good');
    setCallStartTime(undefined);
    setSipStatus(0);
    setSipReason('');
    setIsXAppOpen(false);

    if (currentSessionRef.current) {
      try {
        if (currentSessionRef.current.isEstablished?.()) currentSessionRef.current.terminate();
      } catch {}
      currentSessionRef.current = null;
    }

    setMetadata({});
    setSymptoms([]);
    setTasks([]);
    setCurrentInterface('default');
    setSelectedAppointment(null);
    setFormData({});
    setXappURL(null);

    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(t => t.stop());
      microphoneStreamRef.current = null;
    }

    setTimeout(() => { isEndingCallRef.current = false; }, 1000);
  };

  const updateCallState = (newState: { isActive?: boolean; isStartingCall?: boolean; isMuted?: boolean }) => {
    if (newState.isActive !== undefined) setIsActive(newState.isActive);
    if (newState.isStartingCall !== undefined) setIsStartingCall(newState.isStartingCall);
    if (newState.isMuted !== undefined) setIsMuted(newState.isMuted);
  };
  (updateCallState as any).lastUpdate = 0;
  (updateCallState as any).fallbackTimeout = null;

  const handleSIPMessage = (direction: 'incoming' | 'outgoing', message: string) => {
    try {
      const lines = message.split('\r\n');
      const firstLine = lines[0];

      if (firstLine.includes('INVITE')) {
        updateCallState({ isStartingCall: true });
      } else if (firstLine.includes('SIP/2.0 200')) {
        const cseqLine = lines.find(l => l.startsWith('CSeq:'));
        if (cseqLine?.includes('INVITE')) {
          updateCallState({ isStartingCall: false, isActive: true });
          setSipConnected(true);
          setConnectionQuality('excellent');
          setCallStartTime(new Date());
          setSipStatus(200);
          setSipReason('OK');
        }
      } else if (firstLine.includes('SIP/2.0 180')) {
        updateCallState({ isStartingCall: true });
      } else if (firstLine.includes('SIP/2.0 486') || firstLine.includes('SIP/2.0 487')) {
        updateCallState({ isActive: false, isStartingCall: false });
        setSipConnected(false);
      } else if (firstLine.includes('BYE') && direction === 'incoming') {
        handleCallEnd('Remote SIP BYE received');
      } else if (firstLine.includes('INFO')) {
        const infoMessage = { direction, timestamp: new Date(), message, parsed: parseSIPInfoMessage(message) };
        setSipInfoMessages(prev => [...prev, infoMessage]);
        try {
          const parsedInfo = parseSIPInfoMessage(message);
          if (parsedInfo?.body) {
            let jsonData: any = parsedInfo.body;
            if (typeof parsedInfo.body === 'string') {
              try { jsonData = JSON.parse(parsedInfo.body); } catch {
                if (parsedInfo.body.includes('xappURL')) {
                  const urlMatch = parsedInfo.body.match(/"xappURL":\s*"([^"]+)"/);
                  if (urlMatch?.[1]) { setIsXAppOpen(true); setXappURL(urlMatch[1]); setCurrentInterface('xapp'); }
                }
                return;
              }
            }
            if (jsonData?.xappURL) { setIsXAppOpen(true); setXappURL(jsonData.xappURL); setCurrentInterface('xapp'); }
            if (jsonData?.clearXappURL) { setIsXAppOpen(false); setXappURL(null); setCurrentInterface('default'); }
            if (jsonData?.agentId !== undefined) setCurrentAgentId(jsonData.agentId === null ? undefined : jsonData.agentId);
          }
        } catch {}
      }
    } catch {}
  };

  const handleMetadataUpdate = (data: any) => {
    setMetadata(prev => ({ ...prev, ...data }));
    if (data.symptoms) {
      const newSymptoms = (Array.isArray(data.symptoms) ? data.symptoms : [data.symptoms]).map((s: string, i: number) => ({
        id: `symptom-${Date.now()}-${i}`, text: s, checked: false
      }));
      setSymptoms(prev => [...prev, ...newSymptoms]);
    }
    if (data.tasks) {
      const newTasks = (Array.isArray(data.tasks) ? data.tasks : [data.tasks]).map((t: string, i: number) => ({
        id: `task-${Date.now()}-${i}`, text: t, completed: false
      }));
      setTasks(prev => [...prev, ...newTasks]);
    }
    if (data.appointments) { setAppointments(data.appointments); setCurrentInterface('appointments'); }
    if (data.xappURL) { setIsXAppOpen(true); setXappURL(data.xappURL); setCurrentInterface('xapp'); }
    if (data.clearXappURL) { setIsXAppOpen(false); setXappURL(null); setCurrentInterface('default'); }
  };

  const moveWidgetToContainer = () => {
    const widgetElement = document.querySelector('.webrtc_widget_container') as HTMLElement;
    if (widgetElement && webrtcContainerRef.current) {
      widgetElement.style.position = 'absolute';
      widgetElement.style.top = '-9999px';
      widgetElement.style.left = '-9999px';
      webrtcContainerRef.current.appendChild(widgetElement);
    }
  };

  const startCallWithRetry = (widgetElement: Element, attempts = 0, maxAttempts = 5) => {
    const callButton = widgetElement.querySelector('[data-testid="cognigy-call-button"]') ||
      widgetElement.querySelector('.webrtc_widget_call_button') ||
      widgetElement.querySelector('[aria-label*="call" i]') ||
      widgetElement.querySelector('[aria-label*="Call" i]');

    if (callButton) {
      (callButton as HTMLElement).click();
      (updateCallState as any).fallbackTimeout = setTimeout(() => {
        if (isStartingCall && !isActive) updateCallState({ isStartingCall: false });
      }, 5000);
    } else if (attempts < maxAttempts) {
      setTimeout(() => startCallWithRetry(widgetElement, attempts + 1, maxAttempts), 500);
    } else {
      const altButton = widgetElement.querySelector('button') as HTMLElement;
      if (altButton) {
        altButton.click();
      } else {
        updateCallState({ isStartingCall: false });
      }
    }
  };

  const initializeWebRTCWidget = async () => {
    // Use window.initWebRTCWidget directly — avoids stale isWidgetLoaded closure
    if (!window.initWebRTCWidget) return;

    try {
      // Polyfills for Safari
      (() => {
        const PC: any = (window as any).RTCPeerConnection;
        if (PC?.prototype) {
          const proto: any = PC.prototype;
          if (typeof proto.getLocalStreams !== 'function') {
            proto.getLocalStreams = function () {
              const senders = this.getSenders?.() || [];
              const stream = new MediaStream();
              senders.map((s: any) => s?.track).filter(Boolean).forEach((t: MediaStreamTrack) => stream.addTrack(t));
              return stream.getTracks().length ? [stream] : [];
            };
          }
          if (typeof proto.getRemoteStreams !== 'function') {
            proto.getRemoteStreams = function () {
              const receivers = this.getReceivers?.() || [];
              const stream = new MediaStream();
              receivers.map((r: any) => r?.track).filter(Boolean).forEach((t: MediaStreamTrack) => stream.addTrack(t));
              return stream.getTracks().length ? [stream] : [];
            };
          }
        }
      })();

      // Microphone was already requested directly in the click handler (handleToggleDemo)
      // to preserve browser gesture context. Stop pre-granted tracks now so the widget
      // can acquire its own mic session cleanly.
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(t => t.stop());
        microphoneStreamRef.current = null;
      }

      const userId = userEmail ? userEmail.split('@')[0] : undefined;
      const widgetOptions = userId ? { userId, user: userId, userid: userId } : undefined;

      let widgetRef;
      try {
        // The widget expects just the endpoint token/URL — pass COGNIGY_ENDPOINT directly
        widgetRef = window.initWebRTCWidget(COGNIGY_ENDPOINT, widgetOptions);
        widgetRefRef.current = widgetRef;
        setIsWidgetInitialized(true);
      } catch (err) {
        console.warn('Widget init error:', err);
        updateCallState({ isStartingCall: false });
        return;
      }

      // After widget renders, move it to our hidden container and trigger the call button
      setTimeout(() => {
        moveWidgetToContainer();
        // Find and click the widget's call button to actually start the call
        const widgetEl = document.querySelector('.webrtc_widget_container');
        if (widgetEl) {
          startCallWithRetry(widgetEl);
        }
      }, 1500);

      if (widgetRef) {
        widgetRef.on?.("newRTCSession", (session: any) => {
          currentSessionRef.current = session;
          if (session?.isEstablished?.()) updateCallState({ isStartingCall: false, isActive: true });

          session?.on("accepted", () => {
            updateCallState({ isStartingCall: false, isActive: true });
            setTimeout(() => checkWidgetMuteState(), 500);
          });

          (updateCallState as any).fallbackTimeout = setTimeout(() => {
            if (isStartingCall && !isActive) updateCallState({ isStartingCall: false, isActive: true });
          }, 8000);

          session?.on("ended", () => {
            updateCallState({ isActive: false, isStartingCall: false, isMuted: false });
            currentSessionRef.current = null;
          });

          session?.on("newInfo", (info: any) => {
            try {
              // JsSIP newInfo event provides { originator, request }
              const body = info?.request?.body || info?.body;
              if (body) {
                let parsed = typeof body === 'string' ? JSON.parse(body) : body;
                console.log('📩 newInfo body parsed:', parsed);
                handleMetadataUpdate(parsed);
              } else if (info && typeof info === 'object') {
                handleMetadataUpdate(info);
              }
            } catch (e) {
              console.warn('newInfo parse error:', e);
              if (info && typeof info === 'object') handleMetadataUpdate(info);
            }
          });
          session?.on("muted", (data: any) => { if (data?.audio) updateCallState({ isMuted: true }); });
          session?.on("unmuted", (data: any) => { if (data?.audio) updateCallState({ isMuted: false }); });
        });
      }
    } catch (error: any) {
      console.error('Failed to initialize WebRTC widget:', error);
      updateCallState({ isStartingCall: false });
    }
  };

  // Load WebRTC widget script
  useEffect(() => {
    setupSafeNetworkInterception();

    const handleError = (event: ErrorEvent) => {
      if (event.error === null || event.message === 'Script error.' || event.message?.includes('Non-Error promise rejection')) return;
      console.error('WebRTC error:', event.error);
    };
    window.addEventListener('error', handleError);

    const loadScript = () => {
      if (window.initWebRTCWidget) { setIsWidgetLoaded(true); return; }

      const script = document.createElement('script');
      script.src = 'https://emeaazurestorageaccount.blob.core.windows.net/starkiller/webRTCWidget.js';
      script.async = true;
      script.onload = () => {
        let attempts = 0;
        const check = () => {
          if (window.initWebRTCWidget) { setIsWidgetLoaded(true); }
          else if (++attempts < 50) setTimeout(check, 100);
        };
        check();
      };
      script.onerror = () => console.error('Failed to load WebRTC widget script');
      document.head.appendChild(script);
    };

    loadScript();
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleToggleDemo = async () => {
    if (!isActive) {
      updateCallState({ isActive: true, isStartingCall: true });
      currentSessionRef.current = null;
      startLog();

      // CRITICAL: Request microphone HERE, directly in the click handler,
      // before any async/setTimeout operations so the browser gesture context is preserved.
      let micStream: MediaStream | null = null;
      try {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const audioConstraints = isSafari
          ? { echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 };
        micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        microphoneStreamRef.current = micStream;
      } catch (err: any) {
        console.warn('Microphone access denied or unavailable:', err);
        // Continue anyway — widget may still work without explicit pre-grant
      }

      // Use window.initWebRTCWidget directly to avoid stale closure on isWidgetLoaded state
      if (window.initWebRTCWidget) {
        if (isWidgetInitialized && widgetRefRef.current) {
          const existingWidget = document.querySelector('.webrtc_widget_container');
          if (existingWidget) {
            startCallWithRetry(existingWidget);
            return;
          }
        }
        await initializeWebRTCWidget();
      } else {
        // Widget script not yet loaded — poll until ready (mic already granted above)
        const waitForWidget = () => {
          if (window.initWebRTCWidget) {
            setIsWidgetLoaded(true);
            initializeWebRTCWidget();
          } else {
            setTimeout(waitForWidget, 200);
          }
        };
        waitForWidget();
      }
    } else {
      if (currentSessionRef.current) {
        try {
          if (currentSessionRef.current.isEstablished?.()) currentSessionRef.current.terminate();
          else if (currentSessionRef.current.terminate) currentSessionRef.current.terminate();
          currentSessionRef.current = null;
        } catch {}
      }

      const widgetEl = document.querySelector('.webrtc_widget_container');
      if (widgetEl) {
        const endBtn = widgetEl.querySelector('.webrtc_widget_content_end_button, button[class*="end"]') as HTMLElement;
        endBtn?.click();
        widgetEl.remove();
      }

      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(t => t.stop());
        microphoneStreamRef.current = null;
      }

      endLog();
      updateCallState({ isActive: false, isStartingCall: false, isMuted: false });
      setIsWidgetInitialized(false);
      setIsCameraOn(false);
      setMetadata({});
      setSymptoms([]);
      setTasks([]);
      setCurrentInterface('default');
      setSelectedAppointment(null);
      setFormData({});
      setXappURL(null);
      cleanupOptimization();

      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const getAgentImage = () => getAgentAvatar(botName, currentAgentId);

  const getAgentInitials = () => {
    const initials: Record<string, string> = {
      CogniCare: 'CC', CogniSupport: 'CS', CogniInsure: 'CI',
      CogniFinance: 'CF', CogniHome: 'CH', 'Solara Airlines': 'SA',
    };
    return initials[botName] || 'AI';
  };

  const sendIframeCommand = (command: string, data?: any) => {
    const iframe = webrtcContainerRef.current?.querySelector('iframe');
    if (iframe?.contentWindow) {
      try { iframe.contentWindow.postMessage({ type: command, ...data }, '*'); return true; } catch {}
    }
    return false;
  };

  const toggleMicrophone = async () => {
    const muteButton = document.querySelector('[data-testid="cognigy-mute-unmute-button"]') ||
      document.querySelector('.webrtc_widget_mute_unmute_button') ||
      document.querySelector('[aria-label*="mute" i]');
    if (muteButton) { (muteButton as HTMLElement).click(); updateCallState({ isMuted: !isMuted }); return; }
    if (sendIframeCommand('mute', { action: !isMuted ? 'mute' : 'unmute', audio: true, video: false })) {
      updateCallState({ isMuted: !isMuted });
    }
  };

  const toggleCamera = async () => {
    const cameraButton = document.querySelector('[data-testid="cognigy-camera-button"]') ||
      document.querySelector('.webrtc_widget_camera_button') ||
      document.querySelector('[aria-label*="camera" i]');
    if (cameraButton) { (cameraButton as HTMLElement).click(); setIsCameraOn(!isCameraOn); return; }
    if (sendIframeCommand('camera', { action: !isCameraOn ? 'enable' : 'disable', video: true, audio: false })) {
      setIsCameraOn(!isCameraOn);
    }
  };

  const checkWidgetMuteState = () => {
    const muteButton = document.querySelector('[data-testid="cognigy-mute-unmute-button"]') ||
      document.querySelector('.webrtc_widget_mute_unmute_button');
    if (muteButton) {
      const muted = muteButton.querySelector('[data-testid="MicOffIcon"]') !== null ||
        muteButton.getAttribute('aria-label')?.toLowerCase().includes('unmute');
      setIsMuted(muted);
    }
  };

  const handleAppointmentSelect = (id: string) => setSelectedAppointment(id);
  const handleFormSubmit = (data: Record<string, any>) => { setFormData(data); setCurrentInterface('confirmation'); };
  const closeInterface = () => setCurrentInterface('default');
  const toggleDebugPanel = () => setIsDebugPanelVisible(!isDebugPanelVisible);

  const getXAppTransform = () => isXAppOpen ? 'scale-[0.4] translate-x-[90px] translate-y-[-35px]' : '';

  // ─── Render Interfaces ────────────────────────────────────────────────────

  const renderAppointmentInterface = () => (
    <InterfaceOverlay
      title={<div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Available Appointments</div>}
      onClose={closeInterface}
    >
      <div className="space-y-3">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAppointment === apt.id ? 'border-primary bg-primary/5' : apt.available ? 'border-border hover:border-primary/50 hover:bg-muted/50' : 'border-border/50 bg-muted/30 opacity-50 cursor-not-allowed'}`}
            onClick={() => apt.available && handleAppointmentSelect(apt.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{apt.type}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />{apt.date}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{apt.time}
                </div>
              </div>
              <Badge variant={apt.available ? 'default' : 'secondary'}>{apt.available ? 'Available' : 'Booked'}</Badge>
            </div>
          </div>
        ))}
      </div>
      {selectedAppointment && (
        <div className="mt-6 pt-4 border-t">
          <Button onClick={() => handleFormSubmit({ selectedAppointment })} className="w-full">Book Selected Appointment</Button>
        </div>
      )}
    </InterfaceOverlay>
  );

  const renderFormInterface = () => (
    <InterfaceOverlay
      title={<div className="flex items-center gap-2"><span>Additional Information</span></div>}
      onClose={closeInterface}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Reason for Visit</label>
          <textarea className="w-full p-3 border rounded-lg resize-none" rows={3}
            placeholder="Please describe your reason..." onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preferred Contact Method</label>
          <select className="w-full p-3 border rounded-lg" onChange={(e) => setFormData(p => ({ ...p, contact: e.target.value }))}>
            <option value="">Select contact method</option>
            <option value="phone">Phone Call</option>
            <option value="email">Email</option>
            <option value="sms">Text Message</option>
          </select>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={closeInterface} className="flex-1">Cancel</Button>
          <Button onClick={() => handleFormSubmit(formData)} className="flex-1">Submit</Button>
        </div>
      </div>
    </InterfaceOverlay>
  );

  const renderConfirmationInterface = () => (
    <InterfaceOverlay title="Appointment Confirmed!" onClose={closeInterface} showCloseButton={false}>
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Appointment Confirmed!</h3>
        <p className="text-muted-foreground mb-6">Your appointment has been successfully scheduled.</p>
        <Button onClick={closeInterface} className="w-full">Continue Conversation</Button>
      </div>
    </InterfaceOverlay>
  );

  const renderXappInterface = () => (
    <InterfaceOverlay
      title={<div className="flex items-center gap-2"><ExternalLink className="w-5 h-5 text-primary" /> External Application</div>}
      onClose={closeInterface}
    >
      <div className="w-full h-full flex flex-col">
        {xappURL ? (
          <div className="flex-1 relative">
            <iframe src={xappURL} className="w-full h-full border-0 rounded-lg" title="External Application"
              allow="camera; microphone; geolocation; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
            <div className="absolute top-4 right-4 z-20">
              <div className="relative">
                <div className="absolute -inset-2 rounded-full border border-call-primary/15 animate-ping opacity-50"></div>
                <span className={`flex shrink-0 overflow-hidden rounded-full w-14 h-14 relative border-2 border-white/80 shadow-lg transition-all duration-1000 ease-out hover:scale-110 ${getXAppTransform()}`}>
                  <img className="aspect-square h-full w-full object-cover object-top" alt={`${botName} Agent`} src={getAgentImage()} />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ExternalLink className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No application URL provided</p>
            </div>
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={closeInterface} className="flex-1">Close Application</Button>
          {xappURL && <Button onClick={() => window.open(xappURL, '_blank')} className="flex-1">Open in New Tab</Button>}
        </div>
      </div>
    </InterfaceOverlay>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 px-2 sm:px-4">
      {/* Agent Introduction Card */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mx-auto max-w-full sm:max-w-2xl md:max-w-3xl p-4 sm:p-8 bg-card/95 backdrop-blur-sm rounded-3xl shadow-lg border border-border/50 mb-4 md:mb-6 transition-all duration-300 hover:shadow-xl overflow-hidden relative">
        {/* Avatar */}
        <div className="relative group mb-4 md:mb-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Avatar className={`webrtc-demo-avatar relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 border-4 border-background shadow-2xl transition-all duration-1000 ease-out ${isXAppOpen ? 'scale-[0.4] translate-x-[90px] translate-y-[-35px] shadow-lg' : 'group-hover:scale-105'}`}>
            <AvatarImage src={getAgentImage()} alt={`${botName} Agent`} className="object-cover object-top" />
            <AvatarFallback className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-primary/20 to-primary/40">
              {getAgentInitials()}
            </AvatarFallback>
          </Avatar>
          {(isActive || isXAppOpen) && (
            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-background shadow-lg transition-all duration-1000 ease-out ${isXAppOpen ? 'scale-[0.7] translate-x-[70px] translate-y-[-25px] shadow-md bg-call-success' : isActive ? 'bg-call-success' : 'bg-muted-foreground'}`}>
              <div className="w-full h-full rounded-full animate-ping opacity-75"></div>
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[#19194B] to-[#2D2D6D] bg-clip-text text-transparent">
            {getAgentName(botName, currentAgentId)}
          </h2>
          <Badge variant="secondary" className="mb-2 sm:mb-3 px-3 py-1 text-xs sm:text-sm font-medium">
            {getAgentRole(botName, currentAgentId)}
          </Badge>
          <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base md:text-lg leading-relaxed">{description}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            <Badge variant={isActive ? "default" : "secondary"} className="px-2 sm:px-3 py-1.5 transition-all duration-300 hover:scale-105">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-400'} mr-2`} />
              {isActive ? "Online" : "Offline"}
            </Badge>
            <Badge variant="outline" className="px-2 sm:px-3 py-1.5 transition-all duration-300 hover:scale-105 hover:bg-primary/5">
              <Users className="w-4 h-4 mr-2" />Available 24/7
            </Badge>
            <Badge variant="outline" className="px-2 sm:px-3 py-1.5 transition-all duration-300 hover:scale-105 hover:bg-primary/5">
              <Clock className="w-4 h-4 mr-2" />Real-time Support
            </Badge>
          </div>
        </div>
      </div>

      {/* Capabilities badges */}
      {capabilities.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full sm:max-w-2xl md:max-w-3xl mx-auto">
          {(() => {
            const iconColorMap: Record<string, string> = {
              red: '#dc2626',
              blue: '#2563eb',
              indigo: '#4f46e5',
              orange: '#ea580c',
              green: '#16a34a',
              purple: '#9333ea',
              sky: '#0284c7',
            };
            const iconColor = iconColorMap[themeColor] || '#2563eb';
            return capabilities.map((cap, idx) => {
              const LucideIcon = icons[cap.iconName as keyof typeof icons];
              return (
                <Badge key={idx} variant="outline" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium bg-card/80 backdrop-blur-sm hover:bg-primary/5 transition-all duration-300 hover:scale-105 flex items-center gap-2 text-foreground">
                  {LucideIcon
                    ? <LucideIcon size={18} color={iconColor} />
                    : <Check size={18} color={iconColor} />}
                  {cap.title}
                </Badge>
              );
            });
          })()}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            No demo capabilities configured.<br />
            <span className="text-xs">Admins can configure capabilities in the Flow Management panel.</span>
          </p>
        </div>
      )}

      {/* Demo Controls Card */}
      <Card className="border-0 shadow-xl mb-12 bg-card/70 backdrop-blur-lg rounded-3xl transition-all duration-500 hover:shadow-2xl">
        <CardHeader className="pb-6 text-center">
          <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-3 tracking-tight drop-shadow-sm">
            <span className="animate-gradient-x"><Video className="w-7 h-7 text-primary" /></span>
            Live Demo Controls
          </CardTitle>
          <CardDescription className="text-lg mt-3 text-muted-foreground font-light">
            Start your interactive session with <span className="font-semibold text-primary/90">{getAgentName(botName, currentAgentId)}</span> – the call will begin automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 mb-2 justify-center">
            <Button
              onClick={handleToggleDemo}
              size="lg"
              disabled={!isWidgetLoaded}
              className={`rounded-2xl px-7 py-3 font-semibold shadow-xl transition-all duration-300 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary'} text-white scale-100 hover:scale-105 active:scale-95`}
            >
              {isActive
                ? <span className="flex items-center"><X className="w-5 h-5 mr-2 animate-pulse" /> End Call</span>
                : <span className="flex items-center"><Play className="w-5 h-5 mr-2 animate-pulse" /> Start Call</span>
              }
            </Button>
            <Button variant={isMuted ? "destructive" : "outline"} size="lg"
              className="rounded-2xl px-7 py-3 font-semibold shadow-md transition-all duration-300 flex items-center scale-100 hover:scale-105 active:scale-95"
              onClick={toggleMicrophone} disabled={!isActive}>
              {isMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
            <Button variant={isCameraOn ? "default" : "outline"} size="lg"
              className="rounded-2xl px-7 py-3 font-semibold shadow-md transition-all duration-300 flex items-center scale-100 hover:scale-105 active:scale-95"
              onClick={toggleCamera} disabled={!isActive}>
              {isCameraOn ? <Video className="w-5 h-5 mr-2" /> : <VideoOff className="w-5 h-5 mr-2" />}
              {isCameraOn ? "Camera On" : "Camera Off"}
            </Button>

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="lg"
                  className="rounded-2xl px-7 py-3 font-semibold shadow-md transition-all duration-300 flex items-center scale-100 hover:scale-105 active:scale-95 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                  <Settings className="w-5 h-5 mr-2" />Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 bg-card/95 backdrop-blur-lg border shadow-xl rounded-xl">
                <Tabs defaultValue="settings" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-none rounded-t-xl">
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>
                  <TabsContent value="settings" className="mt-0">
                    <ScrollArea className="h-80 px-4 py-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3">Call Settings</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="microphone" className="text-sm">Microphone</Label>
                              <Switch id="microphone" checked={!isMuted} onCheckedChange={toggleMicrophone} disabled={!isActive} />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="camera" className="text-sm">Camera</Label>
                              <Switch id="camera" checked={isCameraOn} onCheckedChange={toggleCamera} disabled={!isActive} />
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-blue-600" />Connection Quality
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Status</span>
                            <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30">
                              <Wifi className="h-3 w-3 mr-1" />Excellent
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="tools" className="mt-0">
                    <ScrollArea className="h-80 px-4 py-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Signal className="h-4 w-4 text-green-600" />Audio Features
                          </h4>
                          <div className="space-y-2 text-sm">
                            {['Noise Suppression', 'Echo Cancellation', 'Auto Gain Control'].map((f) => (
                              <div key={f} className="flex items-center justify-between">
                                <span>{f}</span>
                                <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Active</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        {isAdmin && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-600" />Admin Tools
                              </h4>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="debug-mode" className="text-sm">Debug Panel</Label>
                                <Switch id="debug-mode" checked={isDebugPanelVisible} onCheckedChange={toggleDebugPanel} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Show SIP traffic and connection details</p>
                            </div>
                          </>
                        )}
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-3">Feedback</h4>
                          <FeedbackDialog
                            trigger={<Button variant="outline" size="sm" className="w-full">Send Feedback</Button>}
                          />
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* WebRTC Container */}
      {(isActive || isStartingCall) && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg flex items-center justify-center relative transition-all duration-500 ${isXAppOpen ? 'min-h-[600px] h-[70vh]' : 'aspect-video'}`}>
              <div ref={webrtcContainerRef} className="absolute inset-0 flex items-center justify-center">
                {/* User camera PiP */}
                {isCameraOn && isActive && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="relative group hover:scale-105 transition-transform duration-200 camera-container" style={{ width: '128px', height: '96px' }}>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm z-10"></div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium z-10">You</div>
                    </div>
                  </div>
                )}

                {/* Starting state */}
                {isStartingCall && (
                  <div className="text-center p-12 z-0">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto border-4 border-green-200 animate-pulse">
                        <Activity className="w-12 h-12 text-green-600 animate-spin" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-green-600">Starting Call...</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto text-lg">
                      Connecting you to {botName}. Please wait while we establish the voice connection.
                    </p>
                    <Badge variant="outline" className="px-4 py-2 text-sm bg-green-50">Initializing Voice Call</Badge>
                  </div>
                )}

                {/* Active call state */}
                {isActive && !isStartingCall && (
                  <div className="text-center p-12 z-10 relative" style={{ pointerEvents: currentInterface === 'xapp' ? 'none' : 'auto' }}>
                    <div className="relative mb-6">
                      <div className="relative mx-auto w-fit">
                        <Avatar className={`webrtc-demo-avatar w-32 h-32 border-4 border-call-primary shadow-2xl ring-4 ring-call-primary/20 transition-all duration-1000 ease-out ${isXAppOpen ? 'scale-[0.4] translate-x-[90px] translate-y-[-35px] shadow-lg ring-2 ring-call-primary/30' : 'hover:scale-105'}`}>
                          <AvatarImage src={getAgentImage()} alt={`${botName} Agent`} className="object-cover object-top" />
                          <AvatarFallback className="text-3xl font-bold bg-gradient-to-r from-call-primary to-call-secondary text-white">
                            {getAgentInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-background bg-call-success shadow-lg transition-all duration-1000 ease-out ${isXAppOpen ? 'scale-[0.7] translate-x-[70px] translate-y-[-25px]' : ''}`}>
                          <div className="absolute inset-1 w-6 h-6 bg-call-success rounded-full flex items-center justify-center">
                            <Activity className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className={`absolute inset-0 rounded-full border-2 border-call-primary/30 transition-all duration-1000 ${!isXAppOpen ? 'animate-pulse opacity-60' : 'scale-80 opacity-30'}`}></div>
                        <div className={`absolute -inset-2 rounded-full border border-call-primary/20 transition-all duration-1500 ${!isXAppOpen ? 'animate-pulse opacity-40' : 'opacity-20'}`}></div>
                      </div>
                    </div>

                    <h3 className={`text-3xl font-bold mb-2 text-call-primary transition-all duration-700 ease-out ${currentInterface === 'xapp' ? 'opacity-0 scale-90 -translate-y-2 absolute -left-full' : 'opacity-100'}`}>
                      Connected to {botName}
                    </h3>
                    <p className={`text-call-text-secondary mb-4 text-lg transition-all duration-700 ease-out ${currentInterface === 'xapp' ? 'opacity-0 scale-90 absolute -left-full' : 'opacity-100'}`}>
                      Your AI specialist is ready to help
                    </p>
                    <div className={`flex items-center justify-center gap-2 mb-4 transition-all duration-700 ease-out ${currentInterface === 'xapp' ? 'opacity-0 absolute -left-full' : 'opacity-100'}`}>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${isMuted ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-call-primary/10 text-call-primary border-call-border'}`}>
                        {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        <span className="text-sm font-medium">{isMuted ? 'Muted' : 'Audio'}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${isCameraOn ? 'bg-call-success/10 text-call-success border-call-border' : 'bg-muted/50 text-muted-foreground border-border'}`}>
                        {isCameraOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                        <span className="text-sm font-medium">{isCameraOn ? 'Video' : 'No Video'}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`px-4 py-2 text-sm bg-call-surface border-call-border text-call-text-primary transition-all duration-700 ease-out ${currentInterface === 'xapp' ? 'opacity-0 absolute -left-full' : 'opacity-100'}`}>
                      Voice Call Active
                    </Badge>
                  </div>
                )}

                {/* Floating avatar in XApp corner */}
                {isActive && !isStartingCall && isXAppOpen && (
                  <div className="absolute top-4 right-4 z-50 animate-scale-in">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full border border-call-primary/15 animate-ping opacity-50"></div>
                      <span className="flex shrink-0 overflow-hidden rounded-full w-16 h-16 relative border-2 border-background shadow-lg hover:scale-110 transition-all duration-1000">
                        <img className="aspect-square h-full w-full object-cover object-top" alt={`${botName} Agent`} src={getAgentImage()} />
                      </span>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-sm">
                        <div className="w-full h-full rounded-full animate-ping opacity-75"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* XApp iframe */}
                {isActive && !isStartingCall && isXAppOpen && xappURL && (
                  <div className="absolute inset-0 z-20 animate-fade-in">
                    <div className="w-full h-full bg-card/95 backdrop-blur-sm rounded-xl border shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 flex items-center justify-center">
                        <Loading variant="minimal" size="md" text="Loading application..." />
                      </div>
                      <iframe src={xappURL} className="w-full h-full border-0 bg-transparent relative z-10"
                        title="External Application" allow="camera; microphone; geolocation; encrypted-media"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
                    </div>
                  </div>
                )}

                {/* Dynamic metadata panel */}
                {isActive && (symptoms.length > 0 || tasks.length > 0) && currentInterface !== 'xapp' && (
                  <div className="absolute top-4 left-4 z-20 max-w-xs">
                    <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg border p-4">
                      {symptoms.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-orange-500" />Symptoms Discussed
                          </h4>
                          <div className="space-y-1">
                            {symptoms.map((s) => (
                              <div key={s.id} className={`flex items-center gap-2 text-sm p-2 rounded ${s.checked ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${s.checked ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`}>
                                  {s.checked && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className={s.checked ? 'line-through' : ''}>{s.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {tasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                            <Activity className="w-4 h-4 text-blue-500" />Action Items
                          </h4>
                          <div className="space-y-1">
                            {tasks.map((t) => (
                              <div key={t.id} className={`flex items-center gap-2 text-sm p-2 rounded ${t.completed ? 'bg-blue-50 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${t.completed ? 'bg-blue-500 border-blue-500' : 'border-muted-foreground/30'}`}>
                                  {t.completed && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className={t.completed ? 'line-through' : ''}>{t.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interface overlays */}
      {currentInterface === 'appointments' && renderAppointmentInterface()}
      {currentInterface === 'form' && renderFormInterface()}
      {currentInterface === 'confirmation' && renderConfirmationInterface()}

      {/* Capabilities grid */}
      {capabilities.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Try These Demo Capabilities</h3>
          <p className="text-muted-foreground mb-4">Sample requests you can make during your conversation with {botName}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities.map((cap, idx) => {
              const LucideIcon = icons[cap.iconName as keyof typeof icons];
              return (
                <div key={idx} className="flex items-center gap-2 p-3 bg-card/80 rounded-lg shadow-sm border">
                  {LucideIcon ? <LucideIcon size={18} /> : <Check size={18} />}
                  <div>
                    <div className="font-medium">{cap.title}</div>
                    <div className="text-sm text-muted-foreground">{cap.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-8">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-dashed">
            <h3 className="text-lg font-semibold mb-2">Demo Capabilities</h3>
            <p className="text-muted-foreground text-sm mb-3">No demo capabilities are currently configured for this AI specialist.</p>
            <p className="text-xs text-muted-foreground">Administrators can add and configure capabilities through the Flow Management panel.</p>
          </div>
        </div>
      )}

      {/* Admin Debug Panel */}
      {isAdmin && isDebugPanelVisible && (
        <AdminDebugPanel
          isActive={isActive}
          isWidgetInitialized={isWidgetInitialized}
          isStartingCall={isStartingCall}
          metadata={metadata}
          sessionInfo={{ sessionId: currentSessionRef.current?.id }}
          connectionQuality={connectionQuality}
          sipConnected={sipConnected}
          sipUserId={sipUserId}
          sipInfoMessages={sipInfoMessages}
          isEnabled={isDebugPanelVisible}
        />
      )}
    </div>
  );
};

export default WebRTCDemo;

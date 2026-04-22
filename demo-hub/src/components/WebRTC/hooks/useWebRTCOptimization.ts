import { useState, useCallback } from 'react';

interface WebRTCOptimizationState {
  isOptimized: boolean;
  latency: number | null;
  packetsLost: number;
}

export const useWebRTCOptimization = () => {
  const [state, setState] = useState<WebRTCOptimizationState>({
    isOptimized: false,
    latency: null,
    packetsLost: 0,
  });

  const createOptimizedPeerConnection = useCallback((configuration?: RTCConfiguration) => {
    const optimizedConfig: RTCConfiguration = {
      ...configuration,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
    return new RTCPeerConnection(optimizedConfig);
  }, []);

  const getOptimizedUserMedia = useCallback(async (constraints?: MediaStreamConstraints) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const audioConstraints = isSafari
      ? { echoCancellation: true, noiseSuppression: true }
      : { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 };

    return navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: false,
      ...constraints,
    });
  }, []);

  const cleanup = useCallback(() => {
    setState({ isOptimized: false, latency: null, packetsLost: 0 });
  }, []);

  return { state, createOptimizedPeerConnection, getOptimizedUserMedia, cleanup };
};

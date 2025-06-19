
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebRTCService } from '@/services/webRTCService';
import { useToast } from '@/hooks/use-toast';

interface UseWebRTCProps {
  debateId: string;
  userId: string;
  isInitiator?: boolean;
}

export const useWebRTC = ({ debateId, userId, isInitiator = false }: UseWebRTCProps) => {
  const [connectionState, setConnectionState] = useState<string>('new');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const webRTCServiceRef = useRef<WebRTCService | null>(null);
  const signalingChannelRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const { toast } = useToast();

  const initializeWebRTC = useCallback(async () => {
    if (webRTCServiceRef.current || isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      // Create signaling channel
      const channelName = `webrtc-debate-${debateId}`;
      const channel = supabase.channel(channelName);
      signalingChannelRef.current = channel;
      
      // Create WebRTC service
      webRTCServiceRef.current = new WebRTCService(
        debateId,
        userId,
        channel,
        {
          onConnectionStateChange: (state: string) => {
            setConnectionState(state);
            console.log('WebRTC connection state:', state);
            
            if (state === 'connected') {
              toast({
                title: "🎥 Video Connected!",
                description: "Real-time video connection established successfully.",
              });
            } else if (state === 'failed' || state === 'disconnected') {
              toast({
                title: "⚠️ Connection Issue",
                description: "Video connection lost. Attempting to reconnect...",
                variant: "destructive"
              });
            }
          },
          onRemoteStreamReceived: (stream: MediaStream) => {
            setRemoteStream(stream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          }
        }
      );
      
      // Subscribe to channel
      await channel.subscribe();
      
      // Initialize connection
      await webRTCServiceRef.current.initializeConnection(isInitiator);
      
      // Set local stream
      const stream = webRTCServiceRef.current.getLocalStream();
      setLocalStream(stream);
      
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera and microphone access to join the video debate.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [debateId, userId, isInitiator, toast]);

  const toggleMicrophone = useCallback(async () => {
    if (webRTCServiceRef.current) {
      const enabled = await webRTCServiceRef.current.toggleMicrophone();
      setIsAudioEnabled(enabled);
      return enabled;
    }
    return false;
  }, []);

  const toggleCamera = useCallback(async () => {
    if (webRTCServiceRef.current) {
      const enabled = await webRTCServiceRef.current.toggleCamera();
      setIsVideoEnabled(enabled);
      return enabled;
    }
    return false;
  }, []);

  const setLocalVideoElement = useCallback((element: HTMLVideoElement) => {
    localVideoRef.current = element;
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.setLocalVideoElement(element);
    }
  }, []);

  const setRemoteVideoElement = useCallback((element: HTMLVideoElement) => {
    remoteVideoRef.current = element;
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.setRemoteVideoElement(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.cleanup();
        webRTCServiceRef.current = null;
      }
      
      if (signalingChannelRef.current) {
        supabase.removeChannel(signalingChannelRef.current);
        signalingChannelRef.current = null;
      }
    };
  }, []);

  return {
    connectionState,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isConnecting,
    initializeWebRTC,
    toggleMicrophone,
    toggleCamera,
    setLocalVideoElement,
    setRemoteVideoElement
  };
};

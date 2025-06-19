
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private localVideoElement: HTMLVideoElement | null = null;
  private remoteVideoElement: HTMLVideoElement | null = null;
  private signalingChannel: any = null;
  private isInitiator = false;
  private debateId: string;
  private userId: string;
  private onConnectionStateChange?: (state: string) => void;
  private onRemoteStreamReceived?: (stream: MediaStream) => void;

  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  constructor(
    debateId: string, 
    userId: string, 
    signalingChannel: any,
    callbacks?: {
      onConnectionStateChange?: (state: string) => void;
      onRemoteStreamReceived?: (stream: MediaStream) => void;
    }
  ) {
    this.debateId = debateId;
    this.userId = userId;
    this.signalingChannel = signalingChannel;
    this.onConnectionStateChange = callbacks?.onConnectionStateChange;
    this.onRemoteStreamReceived = callbacks?.onRemoteStreamReceived;
  }

  async initializeConnection(isInitiator: boolean = false): Promise<void> {
    this.isInitiator = isInitiator;
    
    try {
      // Get user media first
      await this.getUserMedia();
      
      // Create peer connection
      this.createPeerConnection();
      
      // Set up signaling
      this.setupSignaling();
      
      // Add local stream to peer connection
      if (this.localStream && this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }
      
      // If initiator, create offer
      if (isInitiator) {
        await this.createOffer();
      }
    } catch (error) {
      console.error('Failed to initialize WebRTC connection:', error);
      throw error;
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Local media stream obtained');
    } catch (error) {
      console.error('Error accessing user media:', error);
      throw new Error('Unable to access camera and microphone. Please check permissions.');
    }
  }

  private createPeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(this.configuration);
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'unknown';
      console.log('Connection state:', state);
      this.onConnectionStateChange?.(state);
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          from: this.userId
        });
      }
    };
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      this.onRemoteStreamReceived?.(this.remoteStream);
      
      if (this.remoteVideoElement) {
        this.remoteVideoElement.srcObject = this.remoteStream;
      }
    };
  }

  private setupSignaling(): void {
    this.signalingChannel.on('broadcast', { event: 'webrtc-signal' }, (payload: any) => {
      const { type, data, from } = payload.payload;
      
      // Ignore messages from self
      if (from === this.userId) return;
      
      this.handleSignalingMessage({ type, ...data, from });
    });
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      switch (message.type) {
        case 'offer':
          await this.handleOffer(message.offer, message.from);
          break;
        case 'answer':
          await this.handleAnswer(message.answer);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message.candidate);
          break;
        default:
          console.log('Unknown signaling message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        offer: offer,
        from: this.userId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit, from: string): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.sendSignalingMessage({
        type: 'answer',
        answer: answer,
        from: this.userId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private sendSignalingMessage(message: any): void {
    this.signalingChannel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload: {
        type: message.type,
        data: message,
        from: this.userId,
        debateId: this.debateId
      }
    });
  }

  setLocalVideoElement(element: HTMLVideoElement): void {
    this.localVideoElement = element;
    if (this.localStream) {
      element.srcObject = this.localStream;
    }
  }

  setRemoteVideoElement(element: HTMLVideoElement): void {
    this.remoteVideoElement = element;
    if (this.remoteStream) {
      element.srcObject = this.remoteStream;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'closed';
  }

  async toggleMicrophone(): Promise<boolean> {
    if (!this.localStream) return false;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  async toggleCamera(): Promise<boolean> {
    if (!this.localStream) return false;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Clear video elements
    if (this.localVideoElement) {
      this.localVideoElement.srcObject = null;
    }
    if (this.remoteVideoElement) {
      this.remoteVideoElement.srcObject = null;
    }
    
    this.remoteStream = null;
  }
}

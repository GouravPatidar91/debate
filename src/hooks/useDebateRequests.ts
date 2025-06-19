
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DebateRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  topic: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  sender_profile?: {
    username: string;
    display_name: string;
  };
  receiver_profile?: {
    username: string;
    display_name: string;
  };
}

export const useDebateRequests = () => {
  const [requests, setRequests] = useState<DebateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  const fetchRequests = async () => {
    if (!user) return;

    // First get debate requests
    const { data: requestsData, error } = await supabase
      .from('debate_requests')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
      return;
    }

    if (!requestsData || requestsData.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs for profiles
    const userIds = Array.from(new Set([
      ...requestsData.map(r => r.sender_id),
      ...requestsData.map(r => r.receiver_id)
    ]));

    // Fetch profiles separately
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    // Combine requests with profile data
    const formattedRequests = requestsData.map(request => {
      const senderProfile = profilesData?.find(p => p.id === request.sender_id);
      const receiverProfile = profilesData?.find(p => p.id === request.receiver_id);
      
      return {
        ...request,
        status: request.status as 'pending' | 'accepted' | 'declined' | 'expired',
        sender_profile: senderProfile ? {
          username: senderProfile.username || '',
          display_name: senderProfile.display_name || ''
        } : undefined,
        receiver_profile: receiverProfile ? {
          username: receiverProfile.username || '',
          display_name: receiverProfile.display_name || ''
        } : undefined
      };
    });

    setRequests(formattedRequests);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    if (!user) return;

    // Clean up any existing channel completely
    const cleanupChannel = async () => {
      if (channelRef.current) {
        try {
          await channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
      }
    };

    cleanupChannel().then(() => {
      // Create unique channel name
      const channelName = `debate-requests-${user.id}-${Math.random().toString(36).substring(7)}`;

      // Subscribe to debate request changes
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'debate_requests'
          },
          (payload) => {
            fetchRequests();
            
            // Show toast for new requests
            if (payload.eventType === 'INSERT' && payload.new.receiver_id === user.id) {
              toast({
                title: "New Debate Request",
                description: `You received a debate request about "${payload.new.topic}"`,
              });
            }
            
            // Show toast when request is accepted
            if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted') {
              if (payload.new.sender_id === user.id) {
                toast({
                  title: "Challenge Accepted! 🎯",
                  description: "Your debate request was accepted. Get ready to debate!",
                });
              }
            }
          }
        );

      channelRef.current = channel;
      channel.subscribe();
    });

    return () => {
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
      }
    };
  }, [user, toast]);

  const sendRequest = async (receiverId: string, topic: string, message?: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('debate_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        topic,
        message
      });

    if (!error) {
      toast({
        title: "Request Sent",
        description: "Your debate request has been sent successfully!",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: "Failed to send debate request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('debate_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) {
      toast({
        title: status === 'accepted' ? "Request Accepted" : "Request Declined",
        description: `You have ${status} the debate request.`,
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: "Failed to respond to request. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    requests,
    loading,
    sendRequest,
    respondToRequest,
    refreshRequests: fetchRequests
  };
};


import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DebateSession {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  topic: string;
  status: string;
  started_at: string;
  winner_id?: string;
  debate_data?: any;
}

export const useDebateSession = (sessionId?: string) => {
  const [session, setSession] = useState<DebateSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('active_debates')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!error && data) {
        setSession(data as DebateSession);
      }
      setLoading(false);
    };

    fetchSession();

    // Subscribe to session updates
    const channelName = `debate-session-${sessionId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_debates',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            setSession(payload.new as DebateSession);
          }
        }
      );

    channelRef.current = channel;
    channel.subscribe();

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
  }, [sessionId, user]);

  const updateSession = async (updates: Partial<DebateSession>) => {
    if (!sessionId) return false;

    const { error } = await supabase
      .from('active_debates')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update debate session.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  return {
    session,
    loading,
    updateSession
  };
};

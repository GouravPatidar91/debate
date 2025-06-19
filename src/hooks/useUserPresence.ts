
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  status: 'available' | 'busy' | 'in_debate';
  username?: string;
  display_name?: string;
}

export const useUserPresence = () => {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Update current user's presence to online
    const updatePresence = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString(),
          status: 'available'
        });
    };

    updatePresence();

    // Fetch users' presence
    const fetchUsersPresence = async () => {
      // First get presence data
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('*')
        .neq('user_id', user.id)
        .order('is_online', { ascending: false })
        .order('last_seen', { ascending: false });

      if (presenceError) {
        console.error('Error fetching presence:', presenceError);
        setLoading(false);
        return;
      }

      if (!presenceData || presenceData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Get user profiles separately
      const userIds = presenceData.map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      // Combine presence and profile data
      const formattedUsers = presenceData.map(presence => {
        const profile = profilesData?.find(p => p.id === presence.user_id);
        return {
          ...presence,
          status: presence.status as 'available' | 'busy' | 'in_debate',
          username: profile?.username,
          display_name: profile?.display_name
        };
      });

      setUsers(formattedUsers);
      setLoading(false);
    };

    fetchUsersPresence();

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
      // Create a unique channel name
      const channelName = `user-presence-${user.id}-${Math.random().toString(36).substring(7)}`;
      
      // Create and subscribe to the channel
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_presence'
          },
          () => {
            fetchUsersPresence();
          }
        );

      channelRef.current = channel;
      channel.subscribe();
    });

    // Update presence periodically
    const presenceInterval = setInterval(updatePresence, 30000);

    // Handle tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        supabase
          .from('user_presence')
          .update({ is_online: false, last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(presenceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up channel
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          // Ignore cleanup errors
        }
        channelRef.current = null;
      }
      
      // Set user offline on cleanup
      supabase
        .from('user_presence')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    };
  }, [user]);

  return { users, loading };
};

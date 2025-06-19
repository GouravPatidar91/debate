
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DebateResultsData {
  duration: number;
  transcript: string;
  score: number;
  metrics: {
    argumentStrength: number;
    clarity: number;
    engagement: number;
    fillerWords: number;
    topicRelevance: number;
    emotionalTone: string;
    structure: {
      hasOpening: boolean;
      hasArgument: boolean;
      hasRebuttal: boolean;
      hasConclusion: boolean;
    };
  };
  comparison: {
    aiScore: number;
    averageUserScore: number;
    percentileRank: number;
  };
  improvements: string[];
}

export const useDebateResults = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const saveDebateResult = async (resultData: DebateResultsData, topic?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your debate results.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      // First ensure user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const displayName = user.email?.split('@')[0] || 'Anonymous User';
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: displayName,
            display_name: displayName
          });
      }

      const { data, error } = await supabase
        .from('debate_results')
        .insert({
          user_id: user.id,
          score: resultData.score,
          duration: resultData.duration,
          metrics: resultData.metrics,
          comparison: resultData.comparison,
          improvements: resultData.improvements,
          topic: topic || 'General Debate',
          is_shared: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Results Saved",
        description: "Your debate results have been saved successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error saving debate result:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your debate results. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const shareDebateResult = async (resultId: string, score: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to share your results.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('debate_results')
        .update({ is_shared: true })
        .eq('id', resultId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Results Shared! 🎉",
        description: "Your results have been shared to the leaderboard!",
      });

      // Try to use Web Share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My Debate Results - Debatrix AI',
            text: `I just scored ${score} points in my debate! Check out the live leaderboard.`,
            url: window.location.href
          });
        } catch (shareError) {
          // User cancelled sharing, that's ok
          console.log('Share cancelled');
        }
      }

      return true;
    } catch (error) {
      console.error('Error sharing debate result:', error);
      toast({
        title: "Share Failed",
        description: "Failed to share your results. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveDebateResult,
    shareDebateResult,
    isLoading
  };
};

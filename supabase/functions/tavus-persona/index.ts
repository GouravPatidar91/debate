
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY');
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const { action, personaId = 'p8494ff3054c', conversationData } = await req.json();

    let url = '';
    let options: RequestInit = {
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json',
      },
    };

    switch (action) {
      case 'getPersona':
        url = `https://tavusapi.com/v2/personas/${personaId}`;
        options.method = 'GET';
        break;
      
      case 'createConversation':
        url = 'https://tavusapi.com/v2/conversations';
        options.method = 'POST';
        options.body = JSON.stringify({
          persona_id: personaId,
          callback_url: `${req.headers.get('origin')}/api/tavus-callback`,
          properties: {
            max_call_duration: 600, // 10 minutes
            participant_left_timeout: 30,
          }
        });
        break;
      
      case 'sendMessage':
        if (!conversationData?.conversationId) {
          throw new Error('conversationId required for sendMessage');
        }
        url = `https://tavusapi.com/v2/conversations/${conversationData.conversationId}/speak`;
        options.method = 'POST';
        options.body = JSON.stringify({
          text: conversationData.message,
        });
        break;
      
      default:
        throw new Error('Invalid action');
    }

    console.log(`Making Tavus API call: ${action} to ${url}`);
    
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('Tavus API error:', data);
      throw new Error(data.error || 'Tavus API request failed');
    }

    console.log('Tavus API response:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tavus-persona function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check edge function logs for more information' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

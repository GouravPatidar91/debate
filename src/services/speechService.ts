import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

interface SpeechTranscription {
  userId: string;
  debateId: string;
  timestamp: string;
  text: string;
  confidence: number;
}

interface DebateAnalysis {
  argumentStrength: number;
  clarity: number;
  engagement: number;
  fillerWords: number;
  speakingTime: number;
  overallScore: number;
  keyPoints: string[];
  suggestions: string[];
}

export class SpeechService {
  private readonly recognition: SpeechRecognition;
  private readonly supabase: any;

  constructor() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    this.setupRecognition();
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  async startTranscription(debateId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        const confidence = event.results[0][0].confidence;
        
        if (transcript.trim() && confidence > 0.7) {
          await this.saveTranscription({
            userId,
            debateId,
            timestamp: new Date().toISOString(),
            text: transcript,
            confidence
          });
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        resolve();
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  async stopTranscription(): Promise<void> {
    this.recognition.stop();
  }

  private async saveTranscription(transcription: SpeechTranscription): Promise<void> {
    await this.supabase
      .from('speech_transcriptions')
      .insert([transcription]);
  }

  async analyzeDebate(debateId: string): Promise<DebateAnalysis> {
    const { data: transcriptions } = await this.supabase
      .from('speech_transcriptions')
      .select('*')
      .eq('debate_id', debateId);

    // Analyze the transcriptions
    const analysis = await this.analyzeTranscriptions(transcriptions);
    
    // Save analysis results
    await this.supabase
      .from('debate_analysis')
      .insert([{
        debate_id: debateId,
        analysis: analysis
      }]);

    return analysis;
  }

  private async analyzeTranscriptions(transcriptions: any[]): Promise<DebateAnalysis> {
    // Basic analysis implementation - can be enhanced with more sophisticated AI
    const analysis: DebateAnalysis = {
      argumentStrength: 0,
      clarity: 0,
      engagement: 0,
      fillerWords: 0,
      speakingTime: 0,
      overallScore: 0,
      keyPoints: [],
      suggestions: []
    };

    // Calculate speaking time
    const startTime = new Date(transcriptions[0]?.timestamp || Date.now());
    const endTime = new Date(transcriptions[transcriptions.length - 1]?.timestamp || Date.now());
    analysis.speakingTime = (endTime.getTime() - startTime.getTime()) / 1000;

    // Basic analysis of transcriptions
    transcriptions.forEach(transcription => {
      const text = transcription.text.toLowerCase();
      
      // Count filler words
      const fillerWords = ['um', 'uh', 'like', 'so', 'you know'];
      fillerWords.forEach(word => {
        const matches = text.match(new RegExp(word, 'g')) || [];
        analysis.fillerWords += matches.length;
      });

      // Basic argument strength analysis
      const strongWords = ['therefore', 'consequently', 'thus', 'hence'];
      strongWords.forEach(word => {
        if (text.includes(word)) {
          analysis.argumentStrength += 1;
        }
      });

      // Basic clarity analysis
      const complexWords = ['however', 'nevertheless', 'moreover', 'furthermore'];
      complexWords.forEach(word => {
        if (text.includes(word)) {
          analysis.clarity += 1;
        }
      });
    });

    // Calculate overall score
    analysis.overallScore = Math.round(
      (analysis.argumentStrength * 0.4 + 
       analysis.clarity * 0.3 + 
       analysis.engagement * 0.3) * 100
    );

    // Generate key points
    analysis.keyPoints = transcriptions
      .map(t => t.text)
      .filter(t => t.length > 10)
      .slice(0, 5);

    // Generate suggestions
    analysis.suggestions = [
      `Reduce filler words (${analysis.fillerWords} detected)`,
      `Improve argument strength (Current: ${analysis.argumentStrength})`,
      `Enhance clarity (Current: ${analysis.clarity})`
    ];

    return analysis;
  }
}

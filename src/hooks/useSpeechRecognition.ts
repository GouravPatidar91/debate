
import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechAnalysis {
  fillerWords: string[];
  pauseCount: number;
  averagePauseLength: number;
  wordsPerMinute: number;
  totalWords: number;
  clarity: number;
  hesitationCount: number;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  analysis: SpeechAnalysis;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  confidence: number;
}

const FILLER_WORDS = ['um', 'uh', 'ah', 'er', 'like', 'you know', 'basically', 'actually', 'literally'];

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [analysis, setAnalysis] = useState<SpeechAnalysis>({
    fillerWords: [],
    pauseCount: 0,
    averagePauseLength: 0,
    wordsPerMinute: 0,
    totalWords: 0,
    clarity: 100,
    hesitationCount: 0,
  });

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const pauseTimesRef = useRef<number[]>([]);

  const analyzeText = useCallback((text: string) => {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const fillerWords = words.filter(word => FILLER_WORDS.includes(word));
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTimeRef.current) / 60000;
    const wordsPerMinute = elapsedMinutes > 0 ? words.length / elapsedMinutes : 0;

    // Calculate clarity based on filler words and repetition
    const uniqueWords = new Set(words);
    const repetitionRatio = words.length > 0 ? uniqueWords.size / words.length : 1;
    const fillerRatio = words.length > 0 ? fillerWords.length / words.length : 0;
    const clarity = Math.max(0, (repetitionRatio * 100) - (fillerRatio * 50));

    setAnalysis({
      fillerWords,
      pauseCount: pauseTimesRef.current.length,
      averagePauseLength: pauseTimesRef.current.length > 0 
        ? pauseTimesRef.current.reduce((a, b) => a + b, 0) / pauseTimesRef.current.length 
        : 0,
      wordsPerMinute: Math.round(wordsPerMinute),
      totalWords: words.length,
      clarity: Math.round(clarity),
      hesitationCount: fillerWords.length,
    });
  }, []);

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      startTimeRef.current = Date.now();
      lastSpeechTimeRef.current = Date.now();

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence || 0);
            
            // Track pauses
            const currentTime = Date.now();
            const pauseLength = currentTime - lastSpeechTimeRef.current;
            if (pauseLength > 1000) { // More than 1 second pause
              pauseTimesRef.current.push(pauseLength);
            }
            lastSpeechTimeRef.current = currentTime;
          } else {
            interim += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => {
            const newTranscript = prev + finalTranscript;
            analyzeText(newTranscript);
            return newTranscript;
          });
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } else {
      console.error('Speech recognition not supported');
    }
  }, [analyzeText]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    pauseTimesRef.current = [];
    setAnalysis({
      fillerWords: [],
      pauseCount: 0,
      averagePauseLength: 0,
      wordsPerMinute: 0,
      totalWords: 0,
      clarity: 100,
      hesitationCount: 0,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    analysis,
    startListening,
    stopListening,
    resetTranscript,
    confidence,
  };
};

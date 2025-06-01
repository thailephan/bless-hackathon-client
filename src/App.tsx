import { useState, useRef, useEffect, useCallback } from 'react';
import type { LanguageCode } from '@/lib/constants';
import { LANGUAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LanguagePanel } from '@/components/translation/LanguagePanel';
import { LanguageSelector } from '@/components/translation/LanguageSelector';
import { EnhanceCard } from '@/components/translation/EnhanceCard';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { ShortcutModal } from '@/components/shortcut/ShortcutModal';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { setWordDetails } from '@/store/slices/wordDetailsSlice';

interface TranslateTextOutput {
  translatedText: string;
}

interface TextToSpeechApiResponse {
  audioDataUri: string;
}

interface SpeechToTextOutput {
  transcription: string;
}
interface GetWordDetailsOutput {
  definedWord: string;
  type: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
  ipaPronunciation?: string;
}


import { Loader2, ArrowLeftRight, ArrowRight, Languages, Sun, Moon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const THROTTLE_DURATION = 2000;
const WORD_LIMIT = 500;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';


export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>('en');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('vi');
  const [sourceWordCount, setSourceWordCount] = useState(0);
  const [enhanceCardResetKey, setEnhanceCardResetKey] = useState(0);

  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoadingSourceTTS, setIsLoadingSourceTTS] = useState(false);
  const [isLoadingTargetTTS, setIsLoadingTargetTTS] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark'));
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);

  const [activeWordForDefinition, setActiveWordForDefinition] = useState<string | null>(null);
  const [currentWordDetails, setCurrentWordDetails] = useState<GetWordDetailsOutput | null>(null);
  const [isWordDetailLoading, setIsWordDetailLoading] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);

  const { toast } = useToast();
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const throttleTimeoutRef = useRef<number | null>(null); // Fix for setTimeout ref type in browser

  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const wordDetailsCache = useSelector((state: RootState) => state.wordDetails.cache);

  useEffect(() => {
    audioPlayerRef.current = new Audio();
    const currentAudioElement = audioPlayerRef.current;

    return () => {
      if (currentAudioElement) {
        currentAudioElement.pause();
      }
      audioPlayerRef.current = null;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);


  const handleTranslateText = useCallback(async (
    options: {
      text?: string;
      srcLang?: LanguageCode;
      tgtLang?: LanguageCode;
    } = {}
  ) => {
    const textForTranslation = options.text !== undefined ? options.text : sourceText;
    const effectiveSourceLang = options.srcLang !== undefined ? options.srcLang : sourceLanguage;
    const effectiveTargetLang = options.tgtLang !== undefined ? options.tgtLang : targetLanguage;

    if (effectiveSourceLang === effectiveTargetLang) {
      if (textForTranslation.trim()) {
        setTranslatedText(textForTranslation);
      } else {
        setTranslatedText('');
      }
      return;
    }

    if (!textForTranslation.trim()) {
      setTranslatedText('');
      return;
    }

    if (isThrottled) {
      toast({ title: 'Please wait', description: 'Translation request throttled. Try again shortly.', variant: 'default' });
      return;
    }
    if (isTranslating) return;

    setIsTranslating(true);
    setIsThrottled(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textForTranslation,
          sourceLanguage: effectiveSourceLang,
          targetLanguage: effectiveTargetLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Translation API request failed: ${response.statusText} (${response.status})` }));
        throw new Error(errorData.error || `Translation API request failed: ${response.statusText} (${response.status})`);
      }
      
      const result: TranslateTextOutput = await response.json();
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      let description = 'An unexpected error occurred during translation.';
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        description = `Failed to connect to the translation service. Ensure the API server at ${API_BASE_URL} is running, accessible, and CORS is configured.`;
      } else if (error instanceof Error) {
        description = `Translation error: ${error.message}. Check console and API server logs.`;
      }
      toast({ title: 'Translation Failed', description, variant: 'destructive' });
      setTranslatedText('');
    } finally {
      setIsTranslating(false);
      throttleTimeoutRef.current = setTimeout(() => {
        setIsThrottled(false);
      }, THROTTLE_DURATION);
    }
  }, [sourceText, sourceLanguage, targetLanguage, toast, isThrottled, isTranslating]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        if (sourceText.trim() && !isTranslating && !isThrottled) {
           handleTranslateText();
        }
      }
      if (event.ctrlKey && (event.key === '/' || event.key === '?')) {
        event.preventDefault();
        setIsShortcutModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTranslateText, sourceText, isTranslating, isThrottled]);

  const playAudio = useCallback(
    (audioSrc: string, onLoadingChange: (loading: boolean) => void) => {
      if (!audioSrc) {
        onLoadingChange(false); // Ensure loading stops if src is empty
        return;
      }

      onLoadingChange(true);

      // Handle raw PCM base64: audio/L16
      if (audioSrc.startsWith("data:audio/L16")) {
        const parts = audioSrc.split(';');
        const base64Part = parts.find(part => part.startsWith('base64,'));
        if (!base64Part) {
          console.error("Invalid L16 data URI: missing base64 part");
          toast({ title: 'PCM Playback Error', description: 'Invalid L16 audio data format.', variant: 'destructive' });
          onLoadingChange(false);
          return;
        }
        const base64 = base64Part.substring('base64,'.length);
        
        let sampleRate = 24000; // Default
        const ratePart = parts.find(part => part.startsWith('rate='));
        if (ratePart) {
            const rateVal = parseInt(ratePart.split('=')[1]);
            if (!isNaN(rateVal)) sampleRate = rateVal;
        }
        

        const playRawPCM = async () => {
          const AudioContextClass = window.AudioContext || (typeof window !== 'undefined' && (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext);
          if (!AudioContextClass) {
            toast({ title: 'Playback Error', description: 'Web Audio API not supported by this browser.', variant: 'destructive' });
            onLoadingChange(false);
            return;
          }
          const audioContext = new AudioContextClass();

          try {
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            // L16 means 16-bit linear PCM, 2 bytes per sample
            if (len % 2 !== 0) {
                console.error("PCM data length is not a multiple of 2, indicating malformed 16-bit audio.");
                toast({ title: 'PCM Playback Error', description: 'Malformed L16 audio data (odd length).', variant: 'destructive' });
                onLoadingChange(false);
                audioContext.close();
                return;
            }
            const numSamples = len / 2; 
            const buffer = audioContext.createBuffer(1, numSamples, sampleRate); // 1 channel (mono)
            const channelData = buffer.getChannelData(0);

            for (let i = 0; i < numSamples; i++) {
              // Assuming little-endian 16-bit signed PCM
              const sample = (bytes[i * 2 + 1] << 8) | bytes[i * 2]; // LSB first
              // Convert to signed 16-bit
              const signedSample = sample > 32767 ? sample - 65536 : sample;
              // Normalize to [-1.0, 1.0]
              channelData[i] = signedSample / 32768.0;
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);

            source.onended = () => {
                onLoadingChange(false);
                audioContext.close(); // Clean up AudioContext
            };
            source.start();
          } catch (err) {
            console.error("Error playing raw PCM:", err);
            toast({
              title: 'PCM Playback Error',
              description: `Failed to decode and play PCM audio. ${err instanceof Error ? err.message : ''}`.trim(),
              variant: 'destructive'
            });
            onLoadingChange(false);
            audioContext.close(); // Clean up AudioContext
          }
        };

        playRawPCM();
      }
      // Handle regular audio sources (e.g. data URI for MP3/WAV, or blob URL)
      else if (audioPlayerRef.current) {
        const currentAudioElement = audioPlayerRef.current;
        
        // If the new src is the same as the old one and it's playing, pause and restart
        // (or just play if paused)
        if (currentAudioElement.src === audioSrc && !currentAudioElement.paused) {
            currentAudioElement.pause();
            currentAudioElement.currentTime = 0;
        } else if (currentAudioElement.src === audioSrc && currentAudioElement.paused) {
            // Already loaded, just play
        } else {
            // New src or different src
            currentAudioElement.src = audioSrc;
            currentAudioElement.load(); 
        }
        
        currentAudioElement.play()
          .then(() => {
             // onLoadingChange(false); // Handled by onplaying or other events
          })
          .catch(err => {
            console.error("Error playing audio:", err);
            toast({
              title: 'Playback Error',
              description: `Could not play audio. Ensure API serves valid audio and check browser console. Source (first 50 chars): ${audioSrc.substring(0,50)}...`,
              variant: 'destructive'
            });
            onLoadingChange(false);
          });

        currentAudioElement.onended = () => {
          onLoadingChange(false);
        };
        currentAudioElement.onplaying = () => { 
          onLoadingChange(false);
        };
        currentAudioElement.onerror = (e) => {
          console.error("Audio element error for src:", audioSrc, e);
          const error = currentAudioElement.error;
          let message = 'The audio element encountered an error.';
          if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_ABORTED: message = 'Audio playback aborted by the user.'; break;
                case MediaError.MEDIA_ERR_NETWORK: message = 'A network error caused audio download to fail.'; break;
                case MediaError.MEDIA_ERR_DECODE: message = 'Audio playback aborted due to a decoding problem.'; break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: message = 'The audio format is not supported.'; break;
                default: message = 'An unknown audio error occurred.';
            }
          }
          toast({
              title: 'Audio Element Error',
              description: message,
              variant: 'destructive'
          });
          onLoadingChange(false);
        };
      } else {
        onLoadingChange(false); // Fallback if audioPlayerRef.current is null
      }
    },
    [toast]
  );

  const handleTextToSpeech = useCallback(async (
    text: string,
    language: LanguageCode,
    isLoadingSetter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!text.trim()) {
      isLoadingSetter(false);
      return;
    }
    isLoadingSetter(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `TTS API request failed: ${response.statusText} (${response.status})` }));
        // Instead of throwing, just show toast and return
        toast({ title: 'Text-to-Speech Failed', description: errorData.error || `TTS API request failed: ${response.statusText} (${response.status})`, variant: 'destructive' });
        isLoadingSetter(false);
        return;
      }
      
      const result: TextToSpeechApiResponse = await response.json();

      if (!result.audioDataUri || !(result.audioDataUri.startsWith('data:audio') || result.audioDataUri.startsWith('blob:'))) {
        console.error("Received invalid audioDataUri from server:", result.audioDataUri);
        toast({ title: 'Text-to-Speech Failed', description: "Received invalid or missing audio data URI from server.", variant: 'destructive' });
        isLoadingSetter(false);
        return;
      }
      playAudio(result.audioDataUri, isLoadingSetter);

    } catch (error) {
      console.error('Text-to-speech error:', error);
      let description = 'An unexpected error occurred during text-to-speech.';
      
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        description = `Failed to connect to the TTS service. Ensure API server at ${API_BASE_URL} is running, accessible, and CORS is configured.`;
      } else if (error instanceof Error) {
        if (error.message.includes("GoogleGenerativeAI Error") && error.message.includes("500 Internal Server Error")) {
          description = "The AI text-to-speech service encountered an internal error. This might be temporary. Please try again in a few moments.";
        } else if (error.message.toLowerCase().includes('failed to connect to the tts service')) {
           description = `Failed to connect to the TTS service. Ensure API server at ${API_BASE_URL} is running, serving audio, and CORS is configured.`;
        } else {
          description = `Text-to-speech error: ${error.message}. Check console and API server logs.`;
        }
      }
      toast({ title: 'Text-to-Speech Failed', description, variant: 'destructive' });
      isLoadingSetter(false);
    }
  }, [playAudio, toast]);

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const sttSourceLanguage = sourceLanguage; 
        const sttTargetLanguage = targetLanguage; 

        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = async () => {
          setIsProcessingAudio(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const audioDataUri = reader.result as string;
            try {
              const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioDataUri, sourceLanguage: sttSourceLanguage, targetLanguage: sttTargetLanguage }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `STT API request failed: ${response.statusText} (${response.status})` }));
                throw new Error(errorData.error || `STT API request failed: ${response.statusText} (${response.status})`);
              }
              const result: SpeechToTextOutput = await response.json();
              const words = result.transcription.trim() === '' ? [] : result.transcription.trim().split(/\s+/);
              let currentWordCount = words.length;
              let textToSet = result.transcription;
              if (currentWordCount > WORD_LIMIT) {
                textToSet = words.slice(0, WORD_LIMIT).join(' ');
                currentWordCount = WORD_LIMIT;
                toast({ title: "Word limit reached from speech", description: `Transcribed text limited to ${WORD_LIMIT} words.`, variant: "default" });
              }
              setSourceText(textToSet);
              setSourceWordCount(currentWordCount);
              setEnhanceCardResetKey(prev => prev + 1);
              setTranslatedText(''); 

              toast({ title: 'Speech Recognized', description: 'Text updated from your speech.'});
            } catch (error) {
              console.error('Speech-to-text error:', error);
              let description = 'An unexpected error occurred during speech recognition.';
              if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
                description = `Failed to connect to the speech recognition service. Ensure API server at ${API_BASE_URL} is running, accessible, and CORS is configured.`;
              } else if (error instanceof Error) {
                description = `Speech recognition error: ${error.message}. Check console and API server logs.`;
              }
              toast({ title: 'Speech Recognition Failed', description, variant: 'destructive' });
            } finally {
              setIsProcessingAudio(false);
              stream.getTracks().forEach(track => track.stop());
            }
          };
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: 'Recording Started', description: 'Speak into your microphone.'});
      } catch (err) {
        console.error('Microphone access error:', err);
        toast({ title: 'Microphone Error', description: 'Could not access microphone. Please check permissions.', variant: 'destructive' });
      }
    } else toast({ title: 'Unsupported Browser', description: 'Speech recording is not supported.', variant: 'destructive' });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleToggleRecording = () => isRecording ? stopRecording() : startRecording();

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: 'Copied!', description: 'Text copied to clipboard.' }))
      .catch(err => {
        console.error('Copy failed:', err);
        toast({ title: 'Copy Failed', description: 'Could not copy text.', variant: 'destructive' });
      });
  };

  const handleSwapLanguages = () => {
    const textBeforeSwapTarget = translatedText;
    const langBeforeSwapSource = sourceLanguage;
    const langBeforeSwapTarget = targetLanguage;

    const newSourceLang = langBeforeSwapTarget;
    const newTargetLang = langBeforeSwapSource;

    setSourceLanguage(newSourceLang);
    setTargetLanguage(newTargetLang);

    const words = textBeforeSwapTarget.trim() === '' ? [] : textBeforeSwapTarget.trim().split(/\s+/);
    let currentWordCount = words.length;
    let textToSetAsSource = textBeforeSwapTarget;

    if (currentWordCount > WORD_LIMIT) {
      textToSetAsSource = words.slice(0, WORD_LIMIT).join(' ');
      currentWordCount = WORD_LIMIT;
      toast({ title: "Word limit applied on swap", description: `Text limited to ${WORD_LIMIT} words.`, variant: "default" });
    }

    setSourceText(textToSetAsSource);
    setSourceWordCount(currentWordCount);
    setEnhanceCardResetKey(prev => prev + 1);

    if (textToSetAsSource.trim() && newSourceLang !== newTargetLang) {
        handleTranslateText({
            text: textToSetAsSource,
            srcLang: newSourceLang,
            tgtLang: newTargetLang
        });
    } else if (textToSetAsSource.trim() && newSourceLang === newTargetLang) {
        setTranslatedText(textToSetAsSource);
    } else {
        setTranslatedText('');
    }
  };

  const handleWordDefinition = useCallback(async (word: string, language: LanguageCode) => {
    if (!word.trim()) return;
    const cleanedWord = word.replace(/[.,!?;:"“”（）]/g, "").trim().toLowerCase();
    if (!cleanedWord) return;
    const cacheKey = `${cleanedWord}_${language}`;
    setActiveWordForDefinition(word);
    setIsWordDetailLoading(true);
    setCurrentWordDetails(null);
    // Check cache first
    if (wordDetailsCache[cacheKey]) {
      setCurrentWordDetails(wordDetailsCache[cacheKey]);
      setIsWordDetailLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-word-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanedWord, language }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Word details API request failed: ${response.statusText} (${response.status})` }));
        throw new Error(errorData.error || `Word details API request failed: ${response.statusText} (${response.status})`);
      }
      const result: GetWordDetailsOutput = await response.json();
      if (result.ipaPronunciation === undefined) {
        result.ipaPronunciation = '';
      }
      setCurrentWordDetails(result);
      dispatch(setWordDetails({ key: cacheKey, details: result }));
    } catch (error) {
      console.error('Word definition error:', error);
      let description = `An unexpected error occurred while fetching details for "${cleanedWord}".`;
      if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
        description = `Failed to connect to the word definition service. Ensure API server at ${API_BASE_URL} is running, accessible, and CORS is configured.`;
      } else if (error instanceof Error) {
        description = `Word definition error for "${cleanedWord}": ${error.message}. Check console and API server logs.`;
      }
      setCurrentWordDetails({ 
        definedWord: cleanedWord, 
        type: '', 
        meaning: `Could not fetch details for "${cleanedWord}". ${description}`, 
        synonyms: [], 
        antonyms: [],
        ipaPronunciation: '',
      });
      toast({ title: 'Definition Error', description, variant: 'destructive' });
    } finally {
      setIsWordDetailLoading(false);
    }
  }, [toast, wordDetailsCache, dispatch]);

  const handleWordPopoverClose = useCallback(() => {
    // setActiveWordForDefinition(null); // Optionally clear active word when popover closes
  }, []);


  const handleToggleDarkMode = () => {
    const body = document.body;
    body.classList.toggle('dark');
    setIsDarkMode(body.classList.contains('dark'));
  };

  const handleSourceTextChange = (newText: string) => {
    const words = newText.trim() === '' ? [] : newText.trim().split(/\s+/);
    let currentWordCount = words.length;
    let textToUpdate = newText;
    if (currentWordCount > WORD_LIMIT) {
      const previousWordCount = sourceText.trim() === '' ? 0 : sourceText.trim().split(/\s+/).length;
      textToUpdate = words.slice(0, WORD_LIMIT).join(' ');
      currentWordCount = WORD_LIMIT;
      if (newText.length > sourceText.length || previousWordCount < WORD_LIMIT) {
         toast({ title: "Word limit reached", description: `Source text limited to ${WORD_LIMIT} words.`, variant: "default" });
      }
    }
    setSourceText(textToUpdate);
    setSourceWordCount(currentWordCount);
    setEnhanceCardResetKey(prev => prev + 1); 

    if (!textToUpdate.trim()) {
      setTranslatedText('');
    } else if (sourceLanguage === targetLanguage) {
      setTranslatedText(textToUpdate);
    }
  };

  const handleApplyEnhancedText = (newText: string) => {
    setTranslatedText(newText);
  };

  const handleSourceLanguageChange = (lang: LanguageCode) => {
    setSourceLanguage(lang);
    setEnhanceCardResetKey(prev => prev + 1);

    if (sourceText.trim()) {
      handleTranslateText({
        text: sourceText,
        srcLang: lang,
        tgtLang: targetLanguage,
      });
    } else {
      setTranslatedText('');
    }
  };

  const handleTargetLanguageChange = (lang: LanguageCode) => {
    setTargetLanguage(lang);
    setEnhanceCardResetKey(prev => prev + 1);

    if (sourceText.trim()) {
      handleTranslateText({
        text: sourceText,
        srcLang: sourceLanguage,
        tgtLang: lang,
      });
    } else {
      setTranslatedText('');
    }
  };

  const sharedPanelLoadingState = isProcessingAudio;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen flex flex-col p-2 sm:p-3 md:p-4 lg:p-6 bg-background text-foreground font-sans">
        <NavigationBar />

        <main className="flex-grow flex flex-col items-center w-full mt-4">
          <Card className="w-full max-w-4xl shadow-lg rounded-xl border-slate-300 dark:border-slate-700">
            <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-row items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground/90 mr-4">Source</h3>
                  <LanguageSelector value={sourceLanguage} onChange={handleSourceLanguageChange} languages={LANGUAGES} disabled={sharedPanelLoadingState || isRecording} />
                </div>
                <LanguagePanel
                  id="source-text-area"
                  text={sourceText}
                  onTextChange={handleSourceTextChange}
                  currentLanguageForTTS={sourceLanguage}
                  onSpeak={() => handleTextToSpeech(sourceText, sourceLanguage, setIsLoadingSourceTTS)}
                  onClear={() => { setSourceText(''); setTranslatedText(''); setSourceWordCount(0); setEnhanceCardResetKey(prev => prev + 1);}}
                  placeholder="Enter text or use microphone..."
                  isLoadingSpeak={isLoadingSourceTTS}
                  showSpeakButton={true}
                  showClearButton={true}
                  showRecordButton={true}
                  onToggleRecording={handleToggleRecording}
                  isRecording={isRecording}
                  isProcessingAudio={isProcessingAudio}
                  isWordDefinitionEnabled={false}
                  wordCount={sourceWordCount}
                  wordLimit={WORD_LIMIT}
                 />
              </div>

              <div className="flex flex-col items-center justify-center my-3 md:my-0 md:mx-2 md:self-center">
                <div className="flex flex-col items-center gap-2 md:gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button
                              size="icon"
                              onClick={() => handleTranslateText()}
                              disabled={isTranslating || sharedPanelLoadingState || isRecording || isThrottled || !sourceText.trim() }
                              className="rounded-md p-2 shadow-sm hover:shadow-md transition-all"
                              aria-label="Translate text"
                          >
                            <div className="flex items-center justify-center">
                                {isMobile ? <Languages className="h-5 w-5 text-primary-foreground" /> : <ArrowRight className="h-5 w-5 text-primary-foreground" />}
                            </div>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Translate (Ctrl+Enter)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSwapLanguages}
                            disabled={isTranslating || sharedPanelLoadingState || isRecording || isThrottled }
                            className="rounded-md p-2 shadow-sm hover:bg-accent hover:shadow-md transition-all"
                            aria-label="Swap languages and text"
                        >
                            <ArrowLeftRight className={cn("h-5 w-5", isMobile && "rotate-90")} />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Swap Languages & Text</p></TooltipContent>
                    </Tooltip>
                </div>
              </div>


              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-foreground/90 mr-4">Translation</h3>
                    {isTranslating && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>
                  <LanguageSelector value={targetLanguage} onChange={handleTargetLanguageChange} languages={LANGUAGES} disabled={sharedPanelLoadingState || isRecording || isTranslating} />
                </div>
                <LanguagePanel
                  id="translated-text-area"
                  text={translatedText}
                  currentLanguageForTTS={targetLanguage}
                  onSpeak={() => handleTextToSpeech(translatedText, targetLanguage, setIsLoadingTargetTTS)}
                  onCopy={() => handleCopy(translatedText)}
                  isReadOnly={true}
                  placeholder="Translation appears here..."
                  isLoadingSpeak={isLoadingTargetTTS}
                  isLoadingText={isTranslating} 
                  showCopyButton={true}
                  showSpeakButton={true}
                  showClearButton={false} 
                  showRecordButton={false}
                  isWordDefinitionEnabled={true}
                  onWordClick={handleWordDefinition}
                  activeWordForDefinition={activeWordForDefinition}
                  wordDetails={currentWordDetails}
                  isWordDetailLoading={isWordDetailLoading}
                  onWordPopoverClose={handleWordPopoverClose}
                />
              </div>
            </CardContent>
          </Card>

          {translatedText.trim() && (
             <EnhanceCard
              key={enhanceCardResetKey}
              className="mt-4 md:mt-6 w-full max-w-4xl"
              originalSourceText={sourceText}
              currentTranslatedText={translatedText} 
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              onApplyText={handleApplyEnhancedText}
              apiBaseUrl={API_BASE_URL}
            />
          )}
        </main>

        <ShortcutModal isOpen={isShortcutModalOpen} onOpenChange={setIsShortcutModalOpen} />

        <footer className="text-center mt-6 md:mt-10 py-3 text-xs md:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} LinguaCraft. AI-Powered Translation.</p>
          <p className="text-xs">Click on a word in the translated text to see its details. Source text limited to {WORD_LIMIT} words.</p>
          <p className="text-xs">Press Ctrl + ? to view keyboard shortcuts. Press Ctrl + Enter to translate.</p>
        </footer>

        {/* Dark Mode Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleDarkMode}
              className="fixed bottom-4 left-4 rounded-full p-2 shadow-lg hover:bg-accent transition-all"
              aria-label="Toggle dark mode"
            >{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
          </TooltipTrigger>
          <TooltipContent side="right"><p>Toggle Dark Mode</p></TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
}


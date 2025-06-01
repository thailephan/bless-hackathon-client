
/**
 * @fileOverview LanguagePanel.tsx - A component that provides a text area for input or display
 * of text, along with controls for actions like speaking, copying, clearing, recording,
 * and displaying word definitions or suggestions.
 */
import type { LanguageCode } from '@/lib/constants'; // Ensure type import
// GetWordDetailsOutput type is now defined in page.tsx and passed as prop
// import type { GetWordDetailsOutput } from '@/ai/flows/get-word-details'; // Removed direct import
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, Copy, XCircle, Loader2, Mic, StopCircle } from 'lucide-react'; // Added LanguagesIcon
import { cn } from '@/lib/utils';

// Define GetWordDetailsOutput locally to match page.tsx or receive as a generic
interface GetWordDetailsOutput {
  definedWord: string;
  type: string;
  meaning: string;
  synonyms: string[];
  antonyms: string[];
  ipaPronunciation?: string;
}

interface LanguagePanelProps {
  /** Unique identifier for the panel and its textarea. */
  id: string;
  /** The text content of the panel. */
  text: string;
  /** Callback function when the text changes (for editable panels). */
  onTextChange?: (text: string) => void;
  /** The language code of the text for TTS purposes. */
  currentLanguageForTTS: LanguageCode;
  /** Callback function to trigger text-to-speech. */
  onSpeak?: () => void;
  /** Callback function to copy text to clipboard. */
  onCopy?: () => void;
  /** Callback function to clear the text. */
  onClear?: () => void;
  /** If true, the textarea is read-only. Defaults to false. */
  isReadOnly?: boolean;
  /** Placeholder text for the textarea. */
  placeholder: string;
  /** If true, displays a loading spinner on the speak button. */
  isLoadingSpeak?: boolean;
  /** If true, indicates that the text content itself is loading (e.g., during translation). */
  isLoadingText?: boolean; 
  /** If true, shows the copy button. Defaults to false. */
  showCopyButton?: boolean;
  /** If true, shows the clear button. Defaults to true. */
  showClearButton?: boolean;
  /** If true, shows the speak button. Defaults to true. */
  showSpeakButton?: boolean;
  /** If true, shows the record button. Defaults to false. */
  showRecordButton?: boolean;
  /** Callback function to toggle audio recording. */
  onToggleRecording?: () => void;
  /** If true, indicates audio is currently being recorded. */
  isRecording?: boolean;
  /** If true, indicates recorded audio is being processed. */
  isProcessingAudio?: boolean;
  /** If true, enables clicking on words to get definitions. */
  isWordDefinitionEnabled?: boolean;
  /** Callback when a word is clicked (if `isWordDefinitionEnabled` is true). */
  onWordClick?: (word: string, language: LanguageCode) => void;
  /** The currently active word for which definition is shown or loading. */
  activeWordForDefinition?: string | null;
  /** The fetched details for the active word. */
  wordDetails?: GetWordDetailsOutput | null; // Use the local or passed generic type
  /** If true, indicates that word details are being loaded. */
  isWordDetailLoading?: boolean;
  /** Callback when the word definition popover closes. */
  onWordPopoverClose?: () => void;
  /** The current word count of the text. */
  wordCount?: number;
  /** The maximum allowed word limit. */
  wordLimit?: number;
}

/**
 * LanguagePanel provides a UI for text input/display along with associated controls
 * like TTS, copy, clear, record, and word/suggestion features.
 * @param {LanguagePanelProps} props - The props for the LanguagePanel component.
 */
export function LanguagePanel({
  id,
  text,
  onTextChange,
  currentLanguageForTTS,
  onSpeak,
  onCopy,
  onClear,
  isReadOnly = false,
  placeholder,
  isLoadingSpeak = false,
  isLoadingText = false,
  showCopyButton = false,
  showClearButton = true,
  showSpeakButton = true,
  showRecordButton = false,
  onToggleRecording,
  isRecording = false,
  isProcessingAudio = false,
  isWordDefinitionEnabled = false,
  onWordClick,
  activeWordForDefinition,
  wordDetails,
  isWordDetailLoading,
  onWordPopoverClose,
  wordCount,
  wordLimit,
}: LanguagePanelProps) {
  const panelActionLoading = isLoadingSpeak || isProcessingAudio;

  const renderTextWithClickableWords = () => {
    if (!text && isReadOnly) return <span className="text-muted-foreground">{placeholder}</span>;
    if (!text) return null;
    
    const parts = text.split(/([\s.,!?;:"“”（）]+)/g).filter(part => part.length > 0);

    return parts.map((part, index) => {
      const isWord = !/[\s.,!?;:"“”（）]+/.test(part) && part.trim().length > 0;
      if (isWord && onWordClick && isWordDefinitionEnabled) { 
        const currentWord = part;
        return (
          <Popover
            key={`${id}-word-${index}-${currentWord}`}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                onWordClick(currentWord, currentLanguageForTTS);
              } else {
                onWordPopoverClose?.();
              }
            }}
          >
            <PopoverTrigger asChild>
              <span className="cursor-pointer hover:bg-accent rounded-[2px] px-[1px] -mx-[1px] py-[1px] -my-[1px]">
                {currentWord}
              </span>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto max-w-xs sm:max-w-sm md:max-w-md p-4 shadow-xl rounded-lg z-50"
              onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
            >
              {isWordDetailLoading && activeWordForDefinition === currentWord ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading details for "{currentWord}"...</span>
                </div>
              ) : wordDetails && activeWordForDefinition === currentWord ? (
                <div>
                  <h4 className="font-semibold text-lg mb-1">{wordDetails.definedWord}</h4>
                  {wordDetails.ipaPronunciation && (
                    <p className="text-sm text-primary mb-1 font-mono">[{wordDetails.ipaPronunciation}]</p>
                  )}
                  {wordDetails.type && <p className="text-sm text-muted-foreground mb-1"><em>{wordDetails.type}</em></p>}
                  {wordDetails.meaning && <p className="mb-2 text-sm">{wordDetails.meaning}</p>}
                  
                  {wordDetails.synonyms && wordDetails.synonyms.length > 0 && (
                    <div className="mb-2">
                      <strong className="text-xs font-medium">Synonyms:</strong>
                      <p className="text-xs text-muted-foreground">{wordDetails.synonyms.join(', ')}</p>
                    </div>
                  )}
                  {wordDetails.antonyms && wordDetails.antonyms.length > 0 && (
                    <div>
                      <strong className="text-xs font-medium">Antonyms:</strong>
                      <p className="text-xs text-muted-foreground">{wordDetails.antonyms.join(', ')}</p>
                    </div>
                  )}
                  {!wordDetails.meaning && (!wordDetails.synonyms || wordDetails.synonyms.length === 0) && (!wordDetails.antonyms || wordDetails.antonyms.length === 0) && !isWordDetailLoading && (
                    <p className="text-sm text-muted-foreground">No specific details found for "{currentWord}".</p>
                  )}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground">Click to load details for "{currentWord}".</p>
              )}
            </PopoverContent>
          </Popover>
        );
      }
      return <span key={`${id}-space-${index}`}>{part}</span>;
    });
  };


  return (
    <div className="flex flex-col flex-grow">
      <div className="relative border border-input rounded-md bg-background p-3 flex-grow flex flex-col">
        {isWordDefinitionEnabled && isReadOnly ? (
          <div
            id={`${id}-clickable`}
            className={cn(
              "flex-grow whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed rounded-md min-h-[150px] sm:min-h-[180px] md:min-h-[200px] border-0 bg-transparent focus-visible:outline-none",
              (panelActionLoading || (id === 'translated-text-area' && isLoadingText)) ? "opacity-70 cursor-default" : ""
            )}
            aria-label={`${id} text content`}
          >
            {renderTextWithClickableWords()}
          </div>
        ) : (
          <Textarea
            id={id}
            value={text}
            onChange={(e) => onTextChange?.(e.target.value)}
            readOnly={isReadOnly || panelActionLoading}
            placeholder={placeholder}
            className={cn(
              "flex-grow resize-none text-sm md:text-base leading-relaxed rounded-md min-h-[150px] sm:min-h-[180px] md:min-h-[200px] border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none", 
              (isReadOnly || panelActionLoading) ? "opacity-70 cursor-default" : ""
            )}
            aria-label={`${id} text area`}
          />
        )}
        
        {!isReadOnly && (
            <div className="w-full text-xs text-muted-foreground mt-auto pt-2">
                <div className="flex justify-between items-end">
                    <div className="text-left space-y-0.5 flex-1"></div>
                    <div className="text-right">
                        {typeof wordCount === 'number' && typeof wordLimit === 'number' && (
                            <>
                            <span className={cn(wordCount >= wordLimit && "text-destructive font-medium")}>
                                {wordCount}
                            </span>
                            <span> / {wordLimit}</span>
                            </>
                        )}
                    </div>
                </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 flex items-center space-x-2 flex-wrap">
        {showRecordButton && onToggleRecording && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleRecording}
                disabled={panelActionLoading || (isReadOnly && !onTextChange) || (id === 'translated-text-area' && isLoadingText)} 
                aria-label={isProcessingAudio ? "Processing audio..." : isRecording ? "Stop recording" : "Start recording"}
                className={cn(
                  "rounded-md",
                  isRecording ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-primary hover:bg-accent"
                )}
              >
                {isProcessingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isProcessingAudio ? "Processing audio..." : isRecording ? "Stop recording" : "Start recording"}</p></TooltipContent>
          </Tooltip>
        )}
        {showSpeakButton && onSpeak && (
           <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSpeak}
                disabled={!text || panelActionLoading || (id === 'translated-text-area' && isLoadingText)}
                aria-label={`Speak text`}
                className="rounded-md text-muted-foreground hover:text-primary hover:bg-accent"
              >
                {isLoadingSpeak ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Speak Text</p></TooltipContent>
          </Tooltip>
        )}
        {showCopyButton && onCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCopy}
                disabled={!text || isLoadingText || isRecording || isProcessingAudio}
                aria-label={`Copy text to clipboard`}
                className="rounded-md text-muted-foreground hover:text-primary hover:bg-accent"
              >
                <Copy className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Copy Text</p></TooltipContent>
          </Tooltip>
        )}
        {showClearButton && onClear && (
          <Tooltip>
            <TooltipTrigger asChild>
               <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                disabled={(!text && !isReadOnly && !onTextChange) || panelActionLoading || (id === 'translated-text-area' && isLoadingText)}
                aria-label={`Clear text`}
                className="rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Clear Text</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

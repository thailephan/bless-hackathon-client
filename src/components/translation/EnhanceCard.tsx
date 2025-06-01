
/**
 * @fileOverview EnhanceCard.tsx - A component that provides tools for enhancing translated text.
 * It allows users to apply various AI-powered enhancements (like summarization, style changes)
 * to the current translated text by calling an external API.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Check, Info, Settings2, WandSparkles } from 'lucide-react';
import type { LanguageCode } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EnhanceTextOutput {
  enhancedText: string;
}


interface EnhanceCardProps {
  className?: string;
  originalSourceText: string; 
  currentTranslatedText: string;
  sourceLanguage: LanguageCode; 
  targetLanguage: LanguageCode;
  onApplyText: (text: string) => void;
  apiBaseUrl: string; 
}

const enhancementChipOptions: { label: string; instruction: string; description: string }[] = [
  { label: 'Summarize', instruction: 'Summarize the provided text concisely.', description: 'Get a concise summary.' },
  { label: 'Make Formal', instruction: 'Rewrite the provided text in a more professional and formal style.', description: 'More professional style.' },
  { label: 'Make Casual', instruction: 'Rewrite the provided text in a more relaxed and conversational style.', description: 'More relaxed style.' },
  { label: 'Highlight Keywords', instruction: 'Identify the key concepts or terms in the provided text and emphasize them using Markdown bold syntax (e.g., **keyword**). Return the full text with keywords bolded.', description: 'Bold important terms.' },
  { label: 'Bullet Points', instruction: 'Convert the main points of the provided text into a bulleted list using Markdown syntax (e.g., "- Point 1"). If the text is a single idea, create a concise bullet point for it. Return only the bullet points.', description: 'List main ideas.' },
  { label: 'Explain Simply (ELI5)', instruction: 'Explain the provided text in very simple terms, as if explaining to a 5-year-old.', description: 'Explain very simply.' },
  { label: 'Paraphrase', instruction: 'Paraphrase the provided text, providing a few different variations.', description: 'Get different ways to rephrase.' },
];

export function EnhanceCard({
  className,
  originalSourceText, 
  currentTranslatedText,
  sourceLanguage, 
  targetLanguage,
  onApplyText,
  apiBaseUrl,
}: EnhanceCardProps) {
  const [enhancementFeaturesEnabled, setEnhancementFeaturesEnabled] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isLoadingEnhancement, setIsLoadingEnhancement] = useState(false);
  const [processedEnhancedText, setProcessedEnhancedText] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  const { toast } = useToast();

  const generateEnhancementRequestIdRef = useRef(0);

  const [enabledEnhancements, setEnabledEnhancements] = useState<{[key: string]: boolean}>(() => {
    const initialPreferences: {[key: string]: boolean} = {};
    enhancementChipOptions.forEach(opt => {
      initialPreferences[opt.label] = true;
    });

    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('enhancementPreferences');
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          if (typeof parsed === 'object' && parsed !== null) {
            Object.keys(initialPreferences).forEach(key => {
                if (Object.prototype.hasOwnProperty.call(parsed, key) && typeof parsed[key] === 'boolean') {
                    initialPreferences[key] = parsed[key];
                }
            });
          }
        } catch (e) {
          console.error("Failed to parse enhancementPreferences from localStorage:", e);
        }
      }
    }
    return initialPreferences;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('enhancementPreferences', JSON.stringify(enabledEnhancements));
    }
  }, [enabledEnhancements]);
  

  useEffect(() => {
    setCustomInstruction('');
    setProcessedEnhancedText(null);
    setIsLoadingEnhancement(false);
  }, [originalSourceText, sourceLanguage, targetLanguage]); 


  useEffect(() => {
    if (!enhancementFeaturesEnabled) { 
        setCustomInstruction('');
        setProcessedEnhancedText(null);
    }
  }, [enhancementFeaturesEnabled]);


  const handleChipClick = (instruction: string) => {
    setCustomInstruction(instruction);
  };

  const handleGenerateEnhancement = async () => {
    if (!enhancementFeaturesEnabled || !currentTranslatedText.trim() || !customInstruction.trim()) {
      toast({ title: 'Missing Information', description: 'Please ensure translated text and an instruction are provided.', variant: 'default' });
      return;
    }

    setIsLoadingEnhancement(true);
    setProcessedEnhancedText(null); 

    const currentRequestId = ++generateEnhancementRequestIdRef.current;

    try {
      const response = await fetch(`${apiBaseUrl}/api/enhance-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentTranslatedText,
          language: targetLanguage,
          instruction: customInstruction,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Enhance text API request failed: ${response.statusText} (${response.status})` }));
        throw new Error(errorData.error || `Enhance text API request failed: ${response.statusText} (${response.status})`);
      }
      const result: EnhanceTextOutput = await response.json();

      if (currentRequestId === generateEnhancementRequestIdRef.current) {
        setProcessedEnhancedText(result.enhancedText);
      }
    } catch (error) {
      if (currentRequestId === generateEnhancementRequestIdRef.current) {
        console.error('Failed to apply enhancement:', error);
        let description = 'An unexpected error occurred while enhancing text.';
        if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
          description = `Failed to connect to the text enhancement service. Please ensure the API server at ${apiBaseUrl} is running, accessible, and CORS is configured correctly.`;
        } else if (error instanceof Error) {
          description = `Text enhancement error: ${error.message}. Check the console and API server logs for more details.`;
        }
        toast({ title: 'Enhancement Error', description, variant: 'destructive' });
        setProcessedEnhancedText(currentTranslatedText); 
      }
    } finally {
      if (currentRequestId === generateEnhancementRequestIdRef.current) {
        setIsLoadingEnhancement(false);
      }
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...Object.fromEntries(Object.keys(prev).map(k => [k, false])), [id]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
      toast({ title: 'Copied!', description: 'Text copied to clipboard.' });
    }).catch(_ => {
      toast({ title: 'Copy Failed', description: 'Could not copy text.', variant: 'destructive' });
    });
  };

  const handleApplyToMain = (textToApply: string | null) => {
    if (textToApply !== null) {
      onApplyText(textToApply);
      toast({ title: 'Applied', description: 'Text updated in the main translation panel.' });
    }
  };
  
  return (
    <Card className={cn("shadow-lg rounded-xl border-slate-300 dark:border-slate-700", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Dialog open={isSettingsPanelOpen} onOpenChange={setIsSettingsPanelOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="-ml-2">
                <Settings2 className="h-5 w-5 text-primary mr-2" />
                <CardTitle className="text-xl m-0">Enhancement</CardTitle>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Customize Enhancements</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {enhancementChipOptions.map((opt, index) => (
                  <div key={`setting-chip-${opt.label}-${index}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`enable-${opt.label.toLowerCase().replace(/\s/g, '-')}-${index}`}
                      checked={enabledEnhancements[opt.label]}
                      onCheckedChange={(checked) => {
                        setEnabledEnhancements(prev => ({ ...prev, [opt.label]: !!checked }));
                      }}
                    />
                    <Label htmlFor={`enable-${opt.label.toLowerCase().replace(/\s/g, '-')}-${index}`}>
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-enhancements"
              checked={enhancementFeaturesEnabled}
              onCheckedChange={(checked) => {
                const isEnabled = !!checked;
                setEnhancementFeaturesEnabled(isEnabled);
                if (!isEnabled) {
                  setCustomInstruction('');
                  setProcessedEnhancedText(null);
                }
              }}
            />
            <Label htmlFor="enable-enhancements" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Enable Features
            </Label>
          </div>
        </div>
        <CardDescription className="pt-1">
          {enhancementFeaturesEnabled ? "Refine your translation with custom instructions." : "Activate to use enhancement tools."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!enhancementFeaturesEnabled && (
          <div className="p-4 text-center text-muted-foreground border border-dashed rounded-md">
            <Info className="h-5 w-5 mx-auto mb-2" />
            <p>Enable enhancement features to apply text modifications.</p>
          </div>
        )}

        {enhancementFeaturesEnabled && currentTranslatedText.trim() && ( 
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Enhance Current Translation</h3>
            <div className="mb-3">
              <Label htmlFor="custom-instruction-input" className="text-xs text-muted-foreground">Suggestion Chips (click to use as instruction):</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {enhancementChipOptions.filter(opt => enabledEnhancements[opt.label]).map((opt, index) => (
                  <Button
                    key={`chip-btn-${opt.label}-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleChipClick(opt.instruction)}
                    title={opt.description}
                    className="text-xs h-auto py-1 px-2 bg-background hover:bg-accent/80"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Textarea
              id="custom-instruction-input"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Or enter your custom instruction here (e.g., 'Make this sound more enthusiastic'). Applied to current translated text."
              className="min-h-[60px] text-sm bg-muted/20 border-input focus:bg-background transition-colors duration-150 ease-in-out rounded-md"
              disabled={isLoadingEnhancement || !currentTranslatedText.trim()}
            />
            <Button
              onClick={handleGenerateEnhancement}
              disabled={isLoadingEnhancement || !customInstruction.trim() || !currentTranslatedText.trim()}
              className="mt-2"
            >
              {isLoadingEnhancement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Enhancement
              <WandSparkles className="ml-2 h-4 w-4" />
            </Button>

            {processedEnhancedText !== null && !isLoadingEnhancement && (
              <div className="mt-4 p-3 border rounded-md bg-accent/50">
                <p className="text-sm font-medium mb-1 text-accent-foreground">Enhanced Version:</p>
                <ScrollArea className="max-h-32">
                  <p className="text-sm text-accent-foreground whitespace-pre-wrap">{processedEnhancedText}</p>
                </ScrollArea>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button variant="default" size="sm" onClick={() => handleApplyToMain(processedEnhancedText)}>
                    Apply to Main
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCopyToClipboard(processedEnhancedText, 'enhanced')} className="text-muted-foreground hover:text-primary p-1">
                      {copiedStates['enhanced'] ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setProcessedEnhancedText(null); }} className="ml-auto">
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {enhancementFeaturesEnabled && !currentTranslatedText.trim() && (
            <div className="p-4 text-center text-muted-foreground border border-dashed rounded-md">
                <Info className="h-5 w-5 mx-auto mb-2" />
                <p>Translate some text first to enable enhancement options.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
    

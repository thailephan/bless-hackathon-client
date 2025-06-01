
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd'; // We'll create this simple component

interface ShortcutModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'Enter'], description: 'Translate current text' },
  { keys: ['Ctrl', '?'], description: 'Show this shortcuts help' },
  // Add more shortcuts here as they are implemented
];

export function ShortcutModal({ isOpen, onOpenChange }: ShortcutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Here are some helpful keyboard shortcuts to speed up your workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
              <span className="text-sm text-foreground/90">{shortcut.description}</span>
              <div className="flex items-center space-x-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

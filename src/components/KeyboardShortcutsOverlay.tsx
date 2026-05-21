import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useKeyboardShortcuts } from '@/contexts/KeyboardShortcutsContext';
import { Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function KeyboardShortcutsOverlay() {
  const { showOverlay, setShowOverlay, shortcuts } = useKeyboardShortcuts();

  const groupedShortcuts = Array.from(shortcuts.values()).reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts extends Map<string, infer T> ? T[] : never>);

  const formatKey = (key: string, modifiers?: string[]) => {
    const parts: string[] = [];
    
    if (modifiers?.includes('ctrl')) parts.push('Ctrl');
    if (modifiers?.includes('alt')) parts.push('Alt');
    if (modifiers?.includes('shift')) parts.push('Shift');
    if (modifiers?.includes('meta')) parts.push('⌘');
    
    // Handle sequence shortcuts (e.g., g+d)
    if (key.includes('+')) {
      const keyParts = key.split('+');
      parts.push(...keyParts.map(k => k.toUpperCase()));
    } else {
      parts.push(key === 'Escape' ? 'Esc' : key.toUpperCase());
    }
    
    return parts;
  };

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    general: 'General',
  };

  return (
    <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {formatKey(shortcut.key, shortcut.modifiers).map((key, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs px-2 py-1 bg-background"
                          >
                            {key}
                          </Badge>
                          {index < formatKey(shortcut.key, shortcut.modifiers).length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <Badge variant="outline" className="font-mono text-xs mx-1">?</Badge> to toggle this overlay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

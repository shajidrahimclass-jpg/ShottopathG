import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { KeyboardShortcut, ShortcutConfig } from '@/types/keyboard-shortcuts';
import { DEFAULT_SHORTCUTS } from '@/types/keyboard-shortcuts';

interface KeyboardShortcutsContextType {
  shortcuts: Map<string, KeyboardShortcut>;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(new Map());
  const [showOverlay, setShowOverlay] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [sequenceBuffer, setSequenceBuffer] = useState<string[]>([]);
  const [sequenceTimeout, setSequenceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sequenceTimeout) {
        clearTimeout(sequenceTimeout);
      }
    };
  }, [sequenceTimeout]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      const newMap = new Map(prev);
      newMap.set(shortcut.id, shortcut);
      return newMap;
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const isInputElement = (element: Element | null): boolean => {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.getAttribute('contenteditable') === 'true'
    );
  };

  const normalizeKey = (key: string): string => {
    // Normalize key names
    const keyMap: Record<string, string> = {
      'Escape': 'Escape',
      'Esc': 'Escape',
      '/': '/',
      '?': '?',
    };
    return keyMap[key] || key.toLowerCase();
  };

  const matchesShortcut = (
    event: KeyboardEvent,
    shortcut: KeyboardShortcut,
    sequence: string[]
  ): boolean => {
    const key = normalizeKey(event.key);
    
    // Handle sequence shortcuts (e.g., g+d)
    if (shortcut.key.includes('+')) {
      const parts = shortcut.key.split('+');
      if (parts.length === 2) {
        const [first, second] = parts;
        if (sequence.length === 1 && sequence[0] === first && key === second) {
          return true;
        }
      }
    }
    
    // Handle single key shortcuts
    if (key !== normalizeKey(shortcut.key)) {
      return false;
    }

    // Check modifiers
    const modifiers = shortcut.modifiers || [];
    const hasCtrl = modifiers.includes('ctrl');
    const hasAlt = modifiers.includes('alt');
    const hasShift = modifiers.includes('shift');
    const hasMeta = modifiers.includes('meta');

    return (
      event.ctrlKey === hasCtrl &&
      event.altKey === hasAlt &&
      event.shiftKey === hasShift &&
      event.metaKey === hasMeta
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if disabled
      if (!isEnabled) return;

      // Don't trigger shortcuts when typing in input fields
      if (isInputElement(event.target as Element)) {
        // Exception: Allow Escape to work in input fields
        if (event.key === 'Escape') {
          (event.target as HTMLElement).blur();
        }
        return;
      }

      const key = normalizeKey(event.key);

      // Handle help overlay toggle
      if (key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        setShowOverlay((prev) => !prev);
        return;
      }

      // Handle Escape to close overlay
      if (key === 'Escape' && showOverlay) {
        event.preventDefault();
        setShowOverlay(false);
        return;
      }

      // Build sequence buffer for multi-key shortcuts (e.g., g+d)
      setSequenceBuffer((prevBuffer) => {
        const newSequence = [...prevBuffer, key];
        
        // Try to match shortcuts
        for (const shortcut of shortcuts.values()) {
          if (shortcut.enabled !== false && matchesShortcut(event, shortcut, prevBuffer)) {
            event.preventDefault();
            shortcut.action();
            return [];
          }
        }
        
        return newSequence;
      });

      // Clear sequence after timeout
      setSequenceTimeout((prevTimeout) => {
        if (prevTimeout) {
          clearTimeout(prevTimeout);
        }
        return setTimeout(() => {
          setSequenceBuffer([]);
        }, 1000);
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, isEnabled, showOverlay]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        showOverlay,
        setShowOverlay,
        isEnabled,
        setIsEnabled,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

// Hook to register a shortcut
export function useKeyboardShortcut(shortcut: KeyboardShortcut) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut(shortcut);
    return () => {
      unregisterShortcut(shortcut.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcut.id, shortcut.key, registerShortcut, unregisterShortcut]);
}

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'navigation' | 'actions' | 'general';
  action: () => void;
  enabled?: boolean;
}

export interface ShortcutConfig {
  id: string;
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  category: 'navigation' | 'actions' | 'general';
}

export const DEFAULT_SHORTCUTS: Record<string, ShortcutConfig> = {
  // Navigation shortcuts (g + key)
  'nav.dashboard': {
    id: 'nav.dashboard',
    key: 'g+d',
    description: 'Go to Dashboard',
    category: 'navigation',
  },
  'nav.products': {
    id: 'nav.products',
    key: 'g+p',
    description: 'Go to Products',
    category: 'navigation',
  },
  'nav.orders': {
    id: 'nav.orders',
    key: 'g+o',
    description: 'Go to Orders',
    category: 'navigation',
  },
  'nav.users': {
    id: 'nav.users',
    key: 'g+u',
    description: 'Go to Users',
    category: 'navigation',
  },
  'nav.settings': {
    id: 'nav.settings',
    key: 'g+s',
    description: 'Go to Settings',
    category: 'navigation',
  },
  'nav.categories': {
    id: 'nav.categories',
    key: 'g+c',
    description: 'Go to Categories',
    category: 'navigation',
  },
  'nav.vouchers': {
    id: 'nav.vouchers',
    key: 'g+v',
    description: 'Go to Vouchers',
    category: 'navigation',
  },
  
  // Action shortcuts
  'action.new': {
    id: 'action.new',
    key: 'n',
    description: 'Create New Item',
    category: 'actions',
  },
  'action.save': {
    id: 'action.save',
    key: 's',
    modifiers: ['ctrl'],
    description: 'Save',
    category: 'actions',
  },
  'action.search': {
    id: 'action.search',
    key: '/',
    description: 'Focus Search',
    category: 'actions',
  },
  
  // General shortcuts
  'general.help': {
    id: 'general.help',
    key: '?',
    description: 'Show Keyboard Shortcuts',
    category: 'general',
  },
  'general.escape': {
    id: 'general.escape',
    key: 'Escape',
    description: 'Close Modal/Dialog',
    category: 'general',
  },
};

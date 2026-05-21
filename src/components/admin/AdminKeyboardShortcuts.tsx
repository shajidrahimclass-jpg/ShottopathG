import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKeyboardShortcut } from '@/contexts/KeyboardShortcutsContext';
import { adminPath } from '@/config/admin';

export function AdminKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation shortcuts with useCallback to prevent re-creation
  const goToDashboard = useCallback(() => navigate(adminPath()), [navigate]);
  const goToProducts = useCallback(() => navigate(adminPath('products')), [navigate]);
  const goToOrders = useCallback(() => navigate(adminPath('orders')), [navigate]);
  const goToUsers = useCallback(() => navigate(adminPath('users')), [navigate]);
  const goToSettings = useCallback(() => navigate(adminPath('settings')), [navigate]);
  const goToCategories = useCallback(() => navigate(adminPath('categories')), [navigate]);
  const goToVouchers = useCallback(() => navigate(adminPath('vouchers')), [navigate]);

  const createNew = useCallback(() => {
    // Determine what to create based on current page
    if (location.pathname.includes('products')) {
      navigate(adminPath('products/new'));
    } else if (location.pathname.includes('categories')) {
      console.log('New category');
    } else if (location.pathname.includes('vouchers')) {
      console.log('New voucher');
    }
  }, [navigate, location.pathname]);

  // Register shortcuts
  useKeyboardShortcut({
    id: 'nav.dashboard',
    key: 'g+d',
    description: 'Go to Dashboard',
    category: 'navigation',
    action: goToDashboard,
  });

  useKeyboardShortcut({
    id: 'nav.products',
    key: 'g+p',
    description: 'Go to Products',
    category: 'navigation',
    action: goToProducts,
  });

  useKeyboardShortcut({
    id: 'nav.orders',
    key: 'g+o',
    description: 'Go to Orders',
    category: 'navigation',
    action: goToOrders,
  });

  useKeyboardShortcut({
    id: 'nav.users',
    key: 'g+u',
    description: 'Go to Users',
    category: 'navigation',
    action: goToUsers,
  });

  useKeyboardShortcut({
    id: 'nav.settings',
    key: 'g+s',
    description: 'Go to Settings',
    category: 'navigation',
    action: goToSettings,
  });

  useKeyboardShortcut({
    id: 'nav.categories',
    key: 'g+c',
    description: 'Go to Categories',
    category: 'navigation',
    action: goToCategories,
  });

  useKeyboardShortcut({
    id: 'nav.vouchers',
    key: 'g+v',
    description: 'Go to Vouchers',
    category: 'navigation',
    action: goToVouchers,
  });

  useKeyboardShortcut({
    id: 'action.new',
    key: 'n',
    description: 'Create New Item',
    category: 'actions',
    action: createNew,
  });

  return null;
}

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAppSettings } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { AppSettings } from '@/types';
import { setAdminBasePath } from '@/config/admin';

interface AppSettingsContextType {
  appSettings: AppSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateForceSignIn: (value: boolean) => Promise<{ error: Error | null }>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      let settings = await getAppSettings();
      
      // Check for placeholder or system settings and sanitize them
      if (settings) {
        const isPlaceholder = 
          !settings.site_title || 
          settings.site_title.toLowerCase().includes('google ai studio') || 
          settings.site_title.toLowerCase().includes('my google') || 
          settings.site_title === 'My App';
          
        if (isPlaceholder) {
          settings = {
            ...settings,
            site_title: 'Shottopath',
            navbar_name: 'Shottopath',
            copyright_company: 'Shottopath',
            site_description: settings.site_description && !settings.site_description.toLowerCase().includes('google')
              ? settings.site_description
              : 'Shottopath - Your trusted e-commerce platform for quality products and seamless shopping experience.'
          };
          
          // Silently try to update the database so it's permanently cleaned!
          // We run this asynchronously without blocking loadSettings.
          supabase
            .from('app_settings')
            // @ts-expect-error - Supabase types issue with app_settings table
            .update({ 
              site_title: 'Shottopath', 
              navbar_name: 'Shottopath', 
              copyright_company: 'Shottopath',
              site_description: 'Shottopath - Your trusted e-commerce platform for quality products and seamless shopping experience.',
              updated_at: new Date().toISOString() 
            })
            .eq('id', settings.id)
            .then(({ error }) => {
              if (error) {
                console.warn('Could not silently auto-update database app_settings:', error.message);
              } else {
                console.log('Successfully updated database app_settings with Shottopath defaults');
              }
            });
        }
      } else {
        // Synthesize fallback settings if settings block is completely missing from DB
        settings = {
          id: 'default-settings',
          site_title: 'Shottopath',
          navbar_name: 'Shottopath',
          site_description: 'Shottopath - Your trusted e-commerce platform for quality products and seamless shopping experience.',
          admin_url_path: '/pass-43726fshf88w93uh78ww39/admin/39uwfwh98rw38ef',
          copyright_year: '2026',
          copyright_company: 'Shottopath',
          force_sign_in: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any;
      }
      
      setAppSettings(settings);
      
      // Update admin base path if available
      if (settings?.admin_url_path) {
        setAdminBasePath(settings.admin_url_path);
      }
      
      // Update document title and favicon
      if (settings) {
        document.title = settings.site_title;
        
        if (settings.favicon_url) {
          // Remove existing favicon links
          const existingLinks = document.querySelectorAll("link[rel*='icon']");
          existingLinks.forEach(link => link.remove());
          
          // Add cache-busting parameter to force browser refresh
          const faviconUrl = settings.favicon_url.includes('?') 
            ? `${settings.favicon_url}&t=${Date.now()}`
            : `${settings.favicon_url}?t=${Date.now()}`;
          
          // Create new favicon link
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          link.href = faviconUrl;
          document.head.appendChild(link);
          
          // Also add apple-touch-icon for iOS devices
          const appleLink = document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          appleLink.href = faviconUrl;
          document.head.appendChild(appleLink);
        }
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const refreshSettings = async () => {
    await loadSettings();
  };

  const updateForceSignIn = async (value: boolean) => {
    try {
      if (!appSettings) {
        throw new Error('Settings not loaded');
      }

      const { error } = await supabase
        .from('app_settings')
        // @ts-expect-error - Supabase types issue with app_settings table
        .update({ force_sign_in: value, updated_at: new Date().toISOString() })
        .eq('id', appSettings.id);

      if (error) throw error;

      // Update local state
      setAppSettings({ ...appSettings, force_sign_in: value });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AppSettingsContext.Provider value={{ appSettings, loading, refreshSettings, updateForceSignIn }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

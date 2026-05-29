/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { KeyboardShortcutsProvider } from './contexts/KeyboardShortcutsContext';
import { WishlistProvider } from './contexts/WishlistContext';
import getRoutes from './routes';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  const routes = getRoutes();

  return (
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AppSettingsProvider>
              <KeyboardShortcutsProvider>
                <WishlistProvider>
                  <Routes>
                    {routes.map((route) => (
                      <Route key={route.path} path={route.path} element={route.element} />
                    ))}
                  </Routes>
                  <Toaster />
                </WishlistProvider>
              </KeyboardShortcutsProvider>
            </AppSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}


import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Package, AlertTriangle, MessageSquare, Settings as SettingsIcon, Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminNotificationPreferences } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { adminPath } from '@/config/admin';

export default function AdminNotificationPreferencesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<AdminNotificationPreferences>({
    id: '',
    user_id: '',
    new_orders: true,
    low_stock: true,
    customer_messages: true,
    system_events: true,
    created_at: '',
    updated_at: '',
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const { data: newPrefs, error: insertError } = await (supabase as any)
          .from('admin_notification_preferences')
          .insert({
            user_id: user.id,
            new_orders: true,
            low_stock: true,
            customer_messages: true,
            system_events: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newPrefs) setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('admin_notification_preferences')
        // @ts-ignore - Supabase types not updated
        .update({
          new_orders: preferences.new_orders,
          low_stock: preferences.low_stock,
          customer_messages: preferences.customer_messages,
          system_events: preferences.system_events,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof AdminNotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notification Preferences</h1>
            <p className="text-muted-foreground mt-1">
              Manage which notifications you want to receive
            </p>
          </div>
          <Link to={adminPath('notifications')}>
            <Button variant="outline">View History</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive. You can always change these settings later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="new_orders" className="text-base font-medium">
                    New Orders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when customers place new orders
                  </p>
                </div>
              </div>
              <Switch
                id="new_orders"
                checked={preferences.new_orders}
                onCheckedChange={(checked) => handleToggle('new_orders', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="low_stock" className="text-base font-medium">
                    Low Stock Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when products are running low on stock
                  </p>
                </div>
              </div>
              <Switch
                id="low_stock"
                checked={preferences.low_stock}
                onCheckedChange={(checked) => handleToggle('low_stock', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="customer_messages" className="text-base font-medium">
                    Customer Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when customers send messages or inquiries
                  </p>
                </div>
              </div>
              <Switch
                id="customer_messages"
                checked={preferences.customer_messages}
                onCheckedChange={(checked) => handleToggle('customer_messages', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <SettingsIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="space-y-1">
                  <Label htmlFor="system_events" className="text-base font-medium">
                    System Events
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about system updates and important events
                  </p>
                </div>
              </div>
              <Switch
                id="system_events"
                checked={preferences.system_events}
                onCheckedChange={(checked) => handleToggle('system_events', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={fetchPreferences}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

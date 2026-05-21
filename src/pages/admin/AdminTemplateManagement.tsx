import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Copy, Eye, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { GiftCardTemplate } from '@/types';

export default function AdminTemplateManagement() {
  const [templates, setTemplates] = useState<GiftCardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GiftCardTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<GiftCardTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<GiftCardTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    occasion: '',
    subject_line: '',
    header_text: '',
    greeting_message: '',
    primary_color: '#10b981',
    secondary_color: '#059669',
    emoji: '🎁',
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gift_card_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as GiftCardTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenDialog = (template?: GiftCardTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        occasion: template.occasion,
        subject_line: template.subject_line,
        header_text: template.header_text,
        greeting_message: template.greeting_message,
        primary_color: template.primary_color,
        secondary_color: template.secondary_color,
        emoji: template.emoji,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        occasion: '',
        subject_line: '',
        header_text: '',
        greeting_message: '',
        primary_color: '#10b981',
        secondary_color: '#059669',
        emoji: '🎁',
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleDuplicate = (template: GiftCardTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      occasion: template.occasion,
      subject_line: template.subject_line,
      header_text: template.header_text,
      greeting_message: template.greeting_message,
      primary_color: template.primary_color,
      secondary_color: template.secondary_color,
      emoji: template.emoji,
      is_active: false,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter template name');
      return;
    }
    if (!formData.occasion.trim()) {
      toast.error('Please enter occasion');
      return;
    }
    if (!formData.subject_line.trim()) {
      toast.error('Please enter subject line');
      return;
    }
    if (!formData.header_text.trim()) {
      toast.error('Please enter header text');
      return;
    }
    if (!formData.greeting_message.trim()) {
      toast.error('Please enter greeting message');
      return;
    }

    setSaving(true);

    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await ((supabase as any)
          .from('gift_card_templates')
          .update({
            name: formData.name.trim(),
            occasion: formData.occasion.trim().toLowerCase(),
            subject_line: formData.subject_line.trim(),
            header_text: formData.header_text.trim(),
            greeting_message: formData.greeting_message.trim(),
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            emoji: formData.emoji,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id));

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await ((supabase as any)
          .from('gift_card_templates')
          .insert({
            name: formData.name.trim(),
            occasion: formData.occasion.trim().toLowerCase(),
            subject_line: formData.subject_line.trim(),
            header_text: formData.header_text.trim(),
            greeting_message: formData.greeting_message.trim(),
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            emoji: formData.emoji,
            is_active: formData.is_active,
          }));

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setShowDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: GiftCardTemplate) => {
    try {
      const { error } = await ((supabase as any)
        .from('gift_card_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id));

      if (error) throw error;
      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const { error } = await supabase
        .from('gift_card_templates')
        .delete()
        .eq('id', deletingTemplate.id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      setShowDeleteDialog(false);
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gift-card-templates-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Templates exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedTemplates = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(importedTemplates)) {
          toast.error('Invalid template file format');
          return;
        }

        // Insert templates
        const templatesToInsert = importedTemplates.map(t => ({
          name: t.name,
          occasion: t.occasion,
          subject_line: t.subject_line,
          header_text: t.header_text,
          greeting_message: t.greeting_message,
          primary_color: t.primary_color,
          secondary_color: t.secondary_color,
          emoji: t.emoji,
          is_active: false, // Import as inactive by default
        }));

        const { error } = await ((supabase as any)
          .from('gift_card_templates')
          .insert(templatesToInsert));

        if (error) throw error;
        toast.success(`${templatesToInsert.length} templates imported successfully`);
        fetchTemplates();
      } catch (error) {
        console.error('Error importing templates:', error);
        toast.error('Failed to import templates');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Gift Card Templates</h1>
            <p className="text-muted-foreground">
              Manage email templates for gift card occasions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={templates.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Preview Thumbnail */}
                    <div 
                      className="w-full md:w-48 h-32 rounded-lg flex items-center justify-center text-white text-2xl font-bold shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%)` 
                      }}
                    >
                      {template.emoji}
                    </div>

                    {/* Template Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate">{template.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{template.occasion}</p>
                        </div>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.greeting_message}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPreviewTemplate(template);
                            setShowPreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(template)}
                        >
                          {template.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeletingTemplate(template);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground mb-4">No templates found</p>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate ? 'Update template details and preview changes' : 'Create a new gift card email template'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Template Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Birthday Gift Card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occasion">
                    Occasion <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="occasion"
                    name="occasion"
                    value={formData.occasion}
                    onChange={handleInputChange}
                    placeholder="e.g., birthday, holiday, thankyou"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase, no spaces (e.g., birthday, newyear, thankyou)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emoji">
                    Emoji <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="emoji"
                    name="emoji"
                    value={formData.emoji}
                    onChange={handleInputChange}
                    placeholder="🎁"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject_line">
                    Subject Line <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject_line"
                    name="subject_line"
                    value={formData.subject_line}
                    onChange={handleInputChange}
                    placeholder="🎁 Your Gift Card from {siteName}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{siteName}'} for site name, {'{recipientName}'} for recipient
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header_text">
                    Header Text <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="header_text"
                    name="header_text"
                    value={formData.header_text}
                    onChange={handleInputChange}
                    placeholder="You've Received a Gift Card!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting_message">
                    Greeting Message <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formData.greeting_message.length} characters)
                    </span>
                  </Label>
                  <Textarea
                    id="greeting_message"
                    name="greeting_message"
                    value={formData.greeting_message}
                    onChange={handleInputChange}
                    placeholder="Great news! You've received a gift card from {siteName}..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{recipientName}'} and {'{siteName}'} as placeholders
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        name="primary_color"
                        type="color"
                        value={formData.primary_color}
                        onChange={handleInputChange}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.primary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        name="secondary_color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={handleInputChange}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData.secondary_color}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        placeholder="#059669"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active (visible in template selection)</Label>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <Label>Live Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/30 max-h-[600px] overflow-y-auto">
                  <div 
                    className="p-6 rounded-lg text-center text-white mb-4"
                    style={{ 
                      background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)` 
                    }}
                  >
                    <h1 className="text-xl font-bold">
                      {formData.emoji} {formData.header_text || 'Header Text'}
                    </h1>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <p>Dear John Doe,</p>
                    <p>{formData.greeting_message || 'Greeting message will appear here...'}</p>
                    
                    <div 
                      className="border-2 rounded-lg p-4 space-y-2"
                      style={{ borderColor: formData.primary_color }}
                    >
                      <h3 className="font-semibold">Gift Card Details</h3>
                      <p><strong>Product:</strong> Gift Card - ৳500</p>
                      <p><strong>Value:</strong> ৳500</p>
                      <div 
                        className="border-2 border-dashed rounded p-3 text-center"
                        style={{ borderColor: formData.primary_color }}
                      >
                        <p className="text-xs text-muted-foreground uppercase mb-1">Your Gift Code</p>
                        <p 
                          className="text-lg font-bold tracking-wider font-mono"
                          style={{ color: formData.primary_color }}
                        >
                          GC-XXXX-XXXX-XXXX
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingTemplate ? 'Update Template' : 'Create Template'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                {previewTemplate?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {previewTemplate && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div 
                    className="p-8 rounded-lg text-center text-white mb-4"
                    style={{ 
                      background: `linear-gradient(135deg, ${previewTemplate.primary_color} 0%, ${previewTemplate.secondary_color} 100%)` 
                    }}
                  >
                    <h1 className="text-2xl font-bold">
                      {previewTemplate.emoji} {previewTemplate.header_text.replace('{siteName}', 'Shottopath')}
                    </h1>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <p>Dear John Doe,</p>
                    <p>
                      {previewTemplate.greeting_message
                        .replace('{recipientName}', 'John Doe')
                        .replace('{siteName}', 'Shottopath')}
                    </p>
                    
                    <div 
                      className="border-2 rounded-lg p-6 space-y-3"
                      style={{ borderColor: previewTemplate.primary_color }}
                    >
                      <h2 className="text-lg font-semibold">Gift Card Details</h2>
                      <p className="text-sm"><strong>Product:</strong> Shottopath Gift Card - ৳500</p>
                      <p className="text-sm"><strong>Value:</strong> ৳500</p>
                      <div 
                        className="border-2 border-dashed rounded p-4 text-center"
                        style={{ borderColor: previewTemplate.primary_color }}
                      >
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Gift Code</p>
                        <p 
                          className="text-xl font-bold tracking-widest font-mono"
                          style={{ color: previewTemplate.primary_color }}
                        >
                          GC-XXXX-XXXX-XXXX
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>Date Issued:</strong> {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

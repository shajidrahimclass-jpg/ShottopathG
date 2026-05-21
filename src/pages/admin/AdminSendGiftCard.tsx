import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gift, Send, Loader2, Eye, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { GiftCardTemplate } from '@/types';

export default function AdminSendGiftCard() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<GiftCardTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    productName: '',
    giftCode: '',
    giftValue: '',
    customMessage: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_card_templates')
        .select('*')
        .eq('is_active', true)
        .order('occasion');

      if (error) throw error;
      
      const templateData = (data || []) as GiftCardTemplate[];
      setTemplates(templateData);
      
      // Set default template to general
      const generalTemplate = templateData.find(t => t.occasion === 'general');
      if (generalTemplate) {
        setSelectedTemplate(generalTemplate.id);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.recipientName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }
    if (!formData.recipientEmail.trim()) {
      toast.error('Please enter recipient email');
      return;
    }
    if (!formData.productName.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!formData.giftCode.trim()) {
      toast.error('Please enter gift code');
      return;
    }
    if (!formData.giftValue.trim()) {
      toast.error('Please enter gift value');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select an email template');
      return;
    }

    setLoading(true);

    try {
      // Call Edge Function to send gift card email
      const { data, error } = await supabase.functions.invoke('send-gift-card-email', {
        body: {
          recipientName: formData.recipientName.trim(),
          recipientEmail: formData.recipientEmail.trim(),
          productName: formData.productName.trim(),
          giftCode: formData.giftCode.trim(),
          giftValue: formData.giftValue.trim(),
          customMessage: formData.customMessage.trim() || null,
          templateId: selectedTemplate,
        }
      });

      if (error) {
        console.error('Error sending gift card email:', error);
        const errorMsg = await error?.context?.text?.();
        console.error('Edge function error details:', errorMsg);
        
        // Parse error message if it's JSON
        let displayError = errorMsg || error.message || 'Failed to send gift card email. Please try again.';
        let displayHint = '';
        
        try {
          const errorData = JSON.parse(errorMsg || '{}');
          if (errorData.error === 'Email service not configured') {
            displayError = 'Email service not configured. Please set up your Resend API key in the Supabase Edge Function secrets. Get your API key from https://resend.com/api-keys';
          } else if (errorData.error) {
            displayError = errorData.error;
            if (errorData.hint) {
              displayHint = errorData.hint;
            }
          }
        } catch (e) {
          // Not JSON, use as is
        }
        
        toast.error(displayError + (displayHint ? ` - ${displayHint}` : ''), { duration: 10000 });
        return;
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        let displayError = data.error;
        let displayHint = '';
        
        if (data.error === 'Email service not configured') {
          displayError = 'Email service not configured. Please set up your Resend API key in the Supabase Edge Function secrets. Get your API key from https://resend.com/api-keys';
        }
        
        if (data.hint) {
          displayHint = data.hint;
        }
        
        toast.error(displayError + (displayHint ? ` - ${displayHint}` : ''), { duration: 10000 });
        return;
      }

      toast.success(`Gift card sent successfully to ${formData.recipientEmail}`);
      
      // Reset form
      setFormData({
        recipientName: '',
        recipientEmail: '',
        productName: '',
        giftCode: '',
        giftValue: '',
        customMessage: '',
      });
    } catch (error: any) {
      console.error('Failed to send gift card:', error);
      toast.error('Failed to send gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Send Gift Card</h1>
          <p className="text-muted-foreground">
            Manually send gift card codes to customers via email
          </p>
        </div>
        {/* Email Service Configuration Alert */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Gift Card Details
            </CardTitle>
            <CardDescription>
              Fill in the details below to send a gift card code to a customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Email Template Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Template</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="template">
                    Select Template <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger id="template" className="flex-1">
                        <SelectValue placeholder="Choose an email template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.emoji} {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      disabled={!selectedTemplate || loading}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  {selectedTemplate && (
                    <p className="text-xs text-muted-foreground">
                      {templates.find(t => t.id === selectedTemplate)?.greeting_message}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recipient Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">
                      Recipient Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      placeholder="Enter recipient name"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">
                      Recipient Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="recipientEmail"
                      name="recipientEmail"
                      type="email"
                      value={formData.recipientEmail}
                      onChange={handleInputChange}
                      placeholder="recipient@example.com"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Gift Card Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gift Card Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="productName">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="productName"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="e.g., Shottopath Gift Card - ৳500"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="giftCode">
                      Gift Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="giftCode"
                      name="giftCode"
                      value={formData.giftCode}
                      onChange={handleInputChange}
                      placeholder="e.g., GC-XXXX-XXXX-XXXX"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="giftValue">
                      Gift Value <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="giftValue"
                      name="giftValue"
                      value={formData.giftValue}
                      onChange={handleInputChange}
                      placeholder="e.g., ৳500"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customMessage">
                    Custom Message (Optional)
                  </Label>
                  <Textarea
                    id="customMessage"
                    name="customMessage"
                    value={formData.customMessage}
                    onChange={handleInputChange}
                    placeholder="Add a personal message for the recipient..."
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({
                    recipientName: '',
                    recipientEmail: '',
                    productName: '',
                    giftCode: '',
                    giftValue: '',
                    customMessage: '',
                  })}
                  disabled={loading}
                >
                  Clear Form
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Gift Card
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Preview</DialogTitle>
              <DialogDescription>
                Preview of how the gift card email will look
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedTemplate && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  {(() => {
                    const template = templates.find(t => t.id === selectedTemplate);
                    if (!template) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div 
                          className="p-8 rounded-lg text-center text-white"
                          style={{ 
                            background: `linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%)` 
                          }}
                        >
                          <h1 className="text-2xl font-bold">
                            {template.emoji} {template.header_text.replace('{siteName}', 'Shottopath')}
                          </h1>
                        </div>
                        <div className="p-6 space-y-4">
                          <p className="text-base">
                            {template.greeting_message
                              .replace('{recipientName}', formData.recipientName || 'John Doe')
                              .replace('{siteName}', 'Shottopath')}
                          </p>
                          {formData.customMessage && (
                            <div 
                              className="p-4 rounded border-l-4"
                              style={{ borderColor: template.primary_color, backgroundColor: '#f9fafb' }}
                            >
                              <p className="text-sm">{formData.customMessage}</p>
                            </div>
                          )}
                          <div className="border-2 rounded-lg p-6 space-y-3" style={{ borderColor: template.primary_color }}>
                            <h2 className="text-lg font-semibold">Gift Card Details</h2>
                            <p className="text-sm"><strong>Product:</strong> {formData.productName || 'Gift Card Product'}</p>
                            <p className="text-sm"><strong>Value:</strong> {formData.giftValue || '৳500'}</p>
                            <div 
                              className="border-2 border-dashed rounded p-4 text-center"
                              style={{ borderColor: template.primary_color }}
                            >
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Gift Code</p>
                              <p 
                                className="text-xl font-bold tracking-widest font-mono"
                                style={{ color: template.primary_color }}
                              >
                                {formData.giftCode || 'GC-XXXX-XXXX-XXXX'}
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
                    );
                  })()}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

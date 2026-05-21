import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, User, Shield, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { getOrderMessages, sendOrderMessage, markMessagesAsRead, uploadChatImage } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { OrderMessageWithProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface OrderChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
}

export function OrderChatDialog({ open, onOpenChange, orderId, orderNumber }: OrderChatDialogProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<OrderMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (open) {
      loadMessages();
      markAsRead();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`order-messages-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`,
          },
          () => {
            loadMessages();
            markAsRead();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, orderId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getOrderMessages(orderId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await markMessagesAsRead(orderId, isAdmin ? 'admin' : 'user');
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) {
      toast.error('Please enter a message or select an image');
      return;
    }

    try {
      setSending(true);
      let imageUrl: string | null = null;

      // Upload image if selected
      if (selectedImage) {
        setUploading(true);
        imageUrl = await uploadChatImage(selectedImage, orderId);
        setUploading(false);
      }

      await sendOrderMessage(orderId, newMessage || '📷 Image', isAdmin ? 'admin' : 'user', imageUrl);
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      toast.success('Message sent');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Order Chat</DialogTitle>
              <DialogDescription>
                Order #{orderNumber} - Chat with {isAdmin ? 'customer' : 'admin'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {loading && messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation about this order</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_role === (isAdmin ? 'admin' : 'user');
                const isAdminMessage = message.sender_role === 'admin';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={isAdminMessage ? 'bg-primary/10' : 'bg-secondary/10'}>
                        {isAdminMessage ? (
                          <Shield className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-secondary" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {isAdminMessage ? 'Admin' : message.sender_name}
                        </span>
                        {isAdminMessage && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Admin
                          </Badge>
                        )}
                      </div>

                      <div
                        className={`rounded-lg overflow-hidden ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Chat attachment"
                            className="max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.image_url!, '_blank')}
                          />
                        )}
                        {message.message && (
                          <p className="text-sm whitespace-pre-wrap break-words px-4 py-2">{message.message}</p>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/30">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg border-2 border-primary"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="chat-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={sending || uploading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sending || uploading || (!newMessage.trim() && !selectedImage)}
              className="shrink-0"
              size="lg"
            >
              {uploading ? '...' : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

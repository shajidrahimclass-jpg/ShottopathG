import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageZoom } from '@/components/ui/image-zoom';
import { adminPath } from '@/config/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, MessageCircle, User, Shield, X, ArrowLeft, Zap, Paperclip, Mail, Phone, MapPin, DollarSign, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getOrderMessages,
  sendOrderMessage,
  markMessagesAsRead,
  uploadChatImage,
  getOrders,
  getQuickReplies,
  deleteOrderMessage,
} from '@/db/api';
import { supabase } from '@/db/supabase';
import type { OrderMessageWithProfile, OrderWithItems, QuickReply } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Label } from '@/components/ui/label';

export default function AdminChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [messages, setMessages] = useState<OrderMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderId) {
      navigate(adminPath('orders'));
      return;
    }

    loadOrderAndMessages();
    loadQuickReplies();
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
  }, [orderId, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const loadOrderAndMessages = async () => {
    try {
      setLoading(true);
      const orders = await getOrders();
      const foundOrder = orders.find(o => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      }
      await loadMessages();
    } catch (error) {
      console.error('Failed to load order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!orderId) return;
    try {
      const data = await getOrderMessages(orderId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadQuickReplies = async () => {
    try {
      const data = await getQuickReplies();
      setQuickReplies(data);
    } catch (error) {
      console.error('Failed to load quick replies:', error);
    }
  };

  const markAsRead = async () => {
    if (!orderId) return;
    try {
      await markMessagesAsRead(orderId, 'admin');
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) {
      toast.error('Please enter a message or select an image');
      return;
    }

    if (!orderId) return;

    try {
      setSending(true);
      let imageUrl: string | null = null;

      if (selectedImage) {
        setUploading(true);
        try {
          imageUrl = await uploadChatImage(selectedImage, orderId);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload image. Sending message without image.');
        }
        setUploading(false);
      }

      await sendOrderMessage(orderId, newMessage || '📷 Image', 'admin', imageUrl);
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    setSelectedImage(file);
    
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

  const handleUseQuickReply = (message: string) => {
    setNewMessage(message);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteOrderMessage(messageId);
      toast.success('Message deleted');
      loadMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-20 w-20 mb-6 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold mb-3">Order Not Found</h2>
          <p className="text-muted-foreground mb-8">The order you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(adminPath('orders'))} size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar - Customer Info & Quick Replies */}
      <div className="w-80 border-r bg-card flex flex-col hidden lg:flex">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate(adminPath('orders'))}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {/* Customer Info */}
          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">CUSTOMER INFO</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-sm">{order.delivery_address.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm break-all">{order.user?.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">{order.delivery_address.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm">{order.delivery_address.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t">
                  <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Order Total</p>
                    <p className="font-bold text-lg text-primary">৳{order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Replies Link */}
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(adminPath('quick-replies'))}
              >
                <Zap className="h-4 w-4 mr-2" />
                Manage Quick Replies
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {quickReplies.length} saved {quickReplies.length === 1 ? 'reply' : 'replies'}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card shadow-sm">
          <div className="px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(adminPath('orders'))}
              className="lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 border-2 border-secondary/20">
                <AvatarFallback className="bg-secondary/10">
                  <User className="h-5 w-5 text-secondary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-lg">{order.delivery_address.name}</h1>
                <p className="text-sm text-muted-foreground truncate">
                  Order #{order.id.slice(0, 8)} • {order.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="max-w-4xl mx-auto py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 bg-primary/5 rounded-full mb-6">
                  <MessageCircle className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Waiting for customer to start the conversation
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_role === 'admin';
                  const isAdminMessage = message.sender_role === 'admin';
                  const showAvatar = index === 0 || messages[index - 1].sender_role !== message.sender_role;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-4 duration-300 group`}
                    >
                      {showAvatar ? (
                        <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm">
                          <AvatarFallback className={isAdminMessage ? 'bg-primary/10' : 'bg-secondary/10'}>
                            {isAdminMessage ? (
                              <Shield className="h-5 w-5 text-primary" />
                            ) : (
                              <User className="h-5 w-5 text-secondary" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-10 shrink-0" />
                      )}

                      <div className={`flex flex-col gap-1.5 max-w-[75%] md:max-w-[60%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        {showAvatar && (
                          <div className="flex items-center gap-2 px-1">
                            {isAdminMessage ? (
                              <>
                                <span className="text-sm font-medium text-foreground">You (Admin)</span>
                                <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                                  Admin
                                </Badge>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setUserDetailsDialogOpen(true)}
                                  className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                                >
                                  {message.sender_name}
                                </button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={() => setUserDetailsDialogOpen(true)}
                                >
                                  <Info className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                        <div className="relative">
                          <div
                            className={`rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-card border rounded-tl-sm'
                            }`}
                          >
                            {message.image_url && (
                              <div className="relative group">
                                <ImageZoom
                                  src={message.image_url}
                                  alt="Chat attachment"
                                  className="max-w-full h-auto max-h-80 object-contain rounded-lg"
                                />
                              </div>
                            )}
                            {message.message && message.message !== '📷 Image' && (
                              <div className="px-4 py-3">
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {message.message}
                                </p>
                              </div>
                            )}
                          </div>

                          {isOwnMessage && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <span className="text-xs text-muted-foreground px-1">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-card shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {imagePreview && (
              <div className="mb-4 relative inline-block animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-28 w-28 object-cover rounded-xl border-2 border-primary shadow-md"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-end">
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
                size="icon"
                className="shrink-0 h-12 w-12 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              {/* Quick Replies Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-12 w-12 rounded-xl"
                    disabled={sending || uploading}
                  >
                    <Zap className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Quick Replies</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quickReplies.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No quick replies yet
                    </div>
                  ) : (
                    quickReplies.map((qr) => (
                      <DropdownMenuItem
                        key={qr.id}
                        onClick={() => handleUseQuickReply(qr.message)}
                        className="cursor-pointer"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{qr.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{qr.message}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 relative">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[48px] max-h-[120px] resize-none rounded-xl pr-4 py-3 border-2 focus:border-primary/50 transition-all shadow-sm"
                  disabled={sending || uploading}
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={sending || uploading || (!newMessage.trim() && !selectedImage)}
                className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                size="icon"
              >
                {uploading || sending ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd> to send
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Shift+Enter</kbd> for new line
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsDialogOpen} onOpenChange={setUserDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Full information about the customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <p className="font-medium">{order?.delivery_address.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <p className="font-medium text-sm break-all">{order?.user?.email || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <p className="font-medium">{order?.delivery_address.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Delivery Address</Label>
                <p className="text-sm">{order?.delivery_address.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t">
              <DollarSign className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Order Total</Label>
                <p className="font-bold text-xl text-primary">৳{order?.total.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Order Status</Label>
                <Badge variant="secondary" className="mt-1">{order?.status}</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setUserDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

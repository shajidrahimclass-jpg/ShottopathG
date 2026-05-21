import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { getQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply } from '@/db/api';
import type { QuickReply } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function AdminQuickRepliesPage() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<QuickReply | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuickReplies();
  }, []);

  const loadQuickReplies = async () => {
    try {
      setLoading(true);
      const data = await getQuickReplies();
      setQuickReplies(data);
    } catch (error) {
      console.error('Failed to load quick replies:', error);
      toast.error('Failed to load quick replies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (quickReply?: QuickReply) => {
    if (quickReply) {
      setEditingQuickReply(quickReply);
      setTitle(quickReply.title);
      setMessage(quickReply.message);
    } else {
      setEditingQuickReply(null);
      setTitle('');
      setMessage('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      if (editingQuickReply) {
        await updateQuickReply(editingQuickReply.id, title, message);
        toast.success('Quick reply updated');
      } else {
        await createQuickReply(title, message);
        toast.success('Quick reply created');
      }
      setDialogOpen(false);
      setTitle('');
      setMessage('');
      setEditingQuickReply(null);
      loadQuickReplies();
    } catch (error) {
      console.error('Failed to save quick reply:', error);
      toast.error('Failed to save quick reply');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quick reply?')) {
      return;
    }

    try {
      await deleteQuickReply(id);
      toast.success('Quick reply deleted');
      loadQuickReplies();
    } catch (error) {
      console.error('Failed to delete quick reply:', error);
      toast.error('Failed to delete quick reply');
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quick Replies</h1>
            <p className="text-muted-foreground">
              Manage saved message templates for faster customer support
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Quick Reply
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingQuickReply ? 'Edit Quick Reply' : 'Add Quick Reply'}
                </DialogTitle>
                <DialogDescription>
                  Create a saved message template for quick access in chat
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Shipping Update, Order Confirmation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message template..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[150px] mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    This message will be available in the chat interface
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editingQuickReply ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-16 w-full bg-muted" />
                <Skeleton className="h-16 w-full bg-muted" />
                <Skeleton className="h-16 w-full bg-muted" />
              </div>
            </CardContent>
          </Card>
        ) : quickReplies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-6 bg-primary/5 rounded-full mb-6">
                <Zap className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Quick Replies Yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first quick reply template to speed up customer support responses
              </p>
              <Button onClick={() => handleOpenDialog()} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Quick Reply
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Quick Replies ({quickReplies.length})</CardTitle>
              <CardDescription>
                Click on a quick reply to edit or delete it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[150px]">Created</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quickReplies.map((qr) => (
                    <TableRow key={qr.id}>
                      <TableCell className="font-medium">{qr.title}</TableCell>
                      <TableCell>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {qr.message}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(qr.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDialog(qr)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(qr.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

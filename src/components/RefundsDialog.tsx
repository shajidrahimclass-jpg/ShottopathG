import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getActiveRefundsPolicy } from '@/db/api';
import type { RefundsPolicy } from '@/types';
import { toast } from 'sonner';

interface RefundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefundsDialog({ open, onOpenChange }: RefundsDialogProps) {
  const [policy, setPolicy] = useState<RefundsPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPolicy();
    }
  }, [open]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const policyData = await getActiveRefundsPolicy();
      setPolicy(policyData);
    } catch (error) {
      console.error('Failed to fetch refunds policy:', error);
      toast.error('Failed to load refunds policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl lg:text-2xl">
            {loading ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              policy?.title || 'Refunds Policy'
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : policy ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <div
                className="text-sm md:text-base leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm md:text-base">No refunds policy available at the moment.</p>
              <p className="text-xs md:text-sm mt-2">Please contact support for more information.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

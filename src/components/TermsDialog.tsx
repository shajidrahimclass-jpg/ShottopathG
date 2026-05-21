import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getActiveTerms } from '@/db/api';
import type { TermsAndConditions } from '@/types';
import { toast } from 'sonner';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  const [terms, setTerms] = useState<TermsAndConditions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTerms();
    }
  }, [open]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const termsData = await getActiveTerms();
      setTerms(termsData);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      toast.error('Failed to load terms and conditions');
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
              terms?.title || 'Terms and Conditions'
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
          ) : terms ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <div
                className="text-sm md:text-base leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: terms.content }}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm md:text-base">No terms and conditions available at the moment.</p>
              <p className="text-xs md:text-sm mt-2">Please contact support for more information.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

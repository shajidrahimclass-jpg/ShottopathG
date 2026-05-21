import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/types';
import { FileText } from 'lucide-react';

interface ProductUserManualDialogProps {
  product: Product;
  open: boolean;
  onAccept: () => void;
  onCancel?: () => void;
}

export function ProductUserManualDialog({ product, open, onAccept, onCancel }: ProductUserManualDialogProps) {
  const [agreed, setAgreed] = useState(false);

  // Reset checkbox when dialog opens
  useEffect(() => {
    if (open) {
      setAgreed(false);
    }
  }, [open]);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
      setAgreed(false); // Reset for next time
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
    setAgreed(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && onCancel) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            {product.name} - User Manual
          </DialogTitle>
          <DialogDescription>
            Please read the product user manual carefully before proceeding
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm whitespace-pre-wrap">
            {product.user_manual}
          </div>
        </ScrollArea>

        <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label
            htmlFor="agree"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I have read and understood the product user manual
          </Label>
        </div>

        <DialogFooter className="gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full sm:w-auto"
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

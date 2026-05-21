import { useState } from 'react';
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
import type { UserManual } from '@/types';
import { BookOpen } from 'lucide-react';

interface UserManualDialogProps {
  manual: UserManual;
  open: boolean;
  onAccept: () => void;
}

export function UserManualDialog({ manual, open, onAccept }: UserManualDialogProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            {manual.title}
          </DialogTitle>
          <DialogDescription>
            Please read the user manual carefully before proceeding
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 text-sm whitespace-pre-wrap">
            {manual.content}
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
            I have read and understood the user manual
          </Label>
        </div>

        <DialogFooter>
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

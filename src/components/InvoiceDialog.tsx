import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/components/Invoice';
import type { OrderWithItems } from '@/types';
import { Printer, Download } from 'lucide-react';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithItems;
}

export function InvoiceDialog({ open, onOpenChange, order }: InvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${order.id}`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <DialogTitle className="text-lg md:text-xl">Order Invoice</DialogTitle>
            <div className="flex gap-2">
              <Button onClick={handlePrint} size="sm" variant="outline" className="flex-1 md:flex-none">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handlePrint} size="sm" className="flex-1 md:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4">
          <Invoice ref={invoiceRef} order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

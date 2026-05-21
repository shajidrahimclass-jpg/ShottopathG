import { useEffect, useState } from 'react';
import { getActiveAnnouncements } from '@/db/api';
import type { Announcement } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const DISMISSED_ANNOUNCEMENTS_KEY = 'dismissedAnnouncements';

export function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getActiveAnnouncements();
        
        // Get dismissed announcement IDs from localStorage
        const dismissedIds = JSON.parse(
          localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY) || '[]'
        ) as string[];
        
        // Filter out dismissed announcements
        const unseenAnnouncements = data.filter(
          announcement => !dismissedIds.includes(announcement.id)
        );
        
        if (unseenAnnouncements.length > 0) {
          setAnnouncements(unseenAnnouncements);
          setOpen(true);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    };

    fetchAnnouncements();
  }, []);

  const markAnnouncementAsDismissed = (announcementId: string) => {
    const dismissedIds = JSON.parse(
      localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY) || '[]'
    ) as string[];
    
    if (!dismissedIds.includes(announcementId)) {
      dismissedIds.push(announcementId);
      localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(dismissedIds));
    }
  };

  const handleNext = () => {
    // Mark current announcement as dismissed
    markAnnouncementAsDismissed(announcements[currentIndex].id);
    
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCopied(false);
    } else {
      setOpen(false);
    }
  };

  const handleClose = () => {
    // Mark current announcement as dismissed
    markAnnouncementAsDismissed(announcements[currentIndex].id);
    setOpen(false);
  };
  
  const handleDismissAll = () => {
    // Mark all announcements as dismissed
    announcements.forEach(announcement => {
      markAnnouncementAsDismissed(announcement.id);
    });
    setOpen(false);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentAnnouncement.message);
      setCopied(true);
      toast.success('Text copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.error('Failed to copy text');
    }
  };

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl pr-8">{currentAnnouncement.title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {currentAnnouncement.image_url && (
            <div className="w-full rounded-lg overflow-hidden bg-muted">
              <img
                src={currentAnnouncement.image_url}
                alt={currentAnnouncement.title}
                className="w-full h-auto object-cover max-h-[400px]"
                onError={(e) => {
                  console.error('Failed to load image:', currentAnnouncement.image_url);
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="p-4 text-center text-muted-foreground text-sm">Image failed to load</div>';
                  }
                }}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <DialogDescription 
              className="text-sm md:text-base whitespace-pre-wrap leading-relaxed select-text cursor-text"
              style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text' }}
            >
              {currentAnnouncement.message}
            </DialogDescription>
          </div>

          {/* Copyable Text Section */}
          {currentAnnouncement.copyable_text && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Copy
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(currentAnnouncement.copyable_text!);
                      toast.success('Copied to clipboard!');
                    } catch (error) {
                      console.error('Failed to copy:', error);
                      toast.error('Failed to copy');
                    }
                  }}
                  className="h-7 px-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-background rounded-md p-3 font-mono text-sm md:text-base font-semibold text-primary break-all select-all">
                {currentAnnouncement.copyable_text}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-muted-foreground">
              {currentIndex + 1} of {announcements.length}
            </span>
            {announcements.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissAll}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Don't show again
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="flex-1 sm:flex-initial"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Text
                </>
              )}
            </Button>
            <Button onClick={handleNext} size="sm" className="flex-1 sm:flex-initial">
              {currentIndex < announcements.length - 1 ? 'Next' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

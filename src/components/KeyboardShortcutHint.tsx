import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReactNode } from 'react';

interface KeyboardShortcutHintProps {
  keys: string[];
  children: ReactNode;
  description?: string;
}

export function KeyboardShortcutHint({ keys, children, description }: KeyboardShortcutHintProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-2">
            {description && <p className="text-sm">{description}</p>}
            <div className="flex items-center gap-1">
              {keys.map((key, index) => (
                <span key={index} className="flex items-center gap-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {key}
                  </Badge>
                  {index < keys.length - 1 && (
                    <span className="text-muted-foreground text-xs">+</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

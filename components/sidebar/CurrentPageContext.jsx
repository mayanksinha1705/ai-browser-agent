'use client';

import { Globe, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CurrentPageContext({ pageInfo, isActive, onToggle }) {
  if (!pageInfo) return null;

  return (
    <Card className="mx-4 mt-4 p-3 border-border/60 bg-card/50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-md bg-secondary grid place-items-center">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Current Page
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={onToggle}
            >
              {isActive ? 'Using' : 'Use'}
            </Button>
          </div>
          <h4 className="text-sm font-medium truncate mb-0.5">
            {pageInfo.title}
          </h4>
          <a
            href={pageInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
          >
            {pageInfo.url}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      </div>
    </Card>
  );
}

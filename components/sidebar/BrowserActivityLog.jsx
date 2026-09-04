'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, MousePointer, Type, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ActionIcon({ type }) {
  switch (type) {
    case 'navigate':
      return <Globe className="h-3.5 w-3.5" />;
    case 'click':
      return <MousePointer className="h-3.5 w-3.5" />;
    case 'type':
    case 'search':
      return <Type className="h-3.5 w-3.5" />;
    case 'upload':
      return <Upload className="h-3.5 w-3.5" />;
    default:
      return null;
  }
}

export function BrowserActivityLog({ actions }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!actions || actions.length === 0) return null;

  return (
    <Card className="mx-4 mb-4 border-border/60 bg-card/50 overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <h3 className="text-sm font-medium">Browser Activity</h3>
          <span className="text-xs text-muted-foreground">
            ({actions.length} {actions.length === 1 ? 'action' : 'actions'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs font-mono animate-slide-up"
            >
              <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                <ActionIcon type={action.type} />
              </div>
              <div className="flex-1 min-w-0">
                {action.type === 'navigate' && (
                  <div>
                    <span className="text-blue-400">🌐</span>{' '}
                    <span className="text-muted-foreground">{action.url}</span>
                  </div>
                )}
                {action.type === 'search' && (
                  <div>
                    <span className="text-muted-foreground">Search:</span>{' '}
                    <span className="text-emerald-400">"{action.query}"</span>
                  </div>
                )}
                {action.type === 'click' && (
                  <div>
                    <span className="text-amber-400">🖱 Clicked:</span>{' '}
                    <span className="text-muted-foreground">"{action.element}"</span>
                  </div>
                )}
                {action.type === 'type' && (
                  <div>
                    <span className="text-violet-400">⌨ Typed in {action.field}:</span>{' '}
                    <span className="text-muted-foreground truncate">"{action.value}"</span>
                  </div>
                )}
                {action.type === 'upload' && (
                  <div>
                    <span className="text-sky-400">📎 Uploaded:</span>{' '}
                    <span className="text-muted-foreground">{action.file}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

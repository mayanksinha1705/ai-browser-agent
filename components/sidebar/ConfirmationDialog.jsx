'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ConfirmationDialog({ confirmation, onApprove, onCancel }) {
  if (!confirmation) return null;

  return (
    <Card className="mx-4 my-4 p-4 border-amber-500/50 bg-amber-500/5 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-500/20 grid place-items-center">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-400 mb-1">
            {confirmation.title}
          </h3>
          <p className="text-sm text-foreground mb-3">
            {confirmation.message}
          </p>
          {confirmation.details && confirmation.details.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">Please review the details:</p>
              <div className="bg-background/50 rounded-md p-3 space-y-1">
                {confirmation.details.map((detail, index) => (
                  <p key={index} className="text-xs font-mono text-muted-foreground">
                    {detail}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator className="mb-4" />

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          className="text-xs bg-amber-500 hover:bg-amber-600 text-white"
        >
          Approve
        </Button>
      </div>
    </Card>
  );
}

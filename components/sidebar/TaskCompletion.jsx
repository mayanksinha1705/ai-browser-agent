'use client';

import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function TaskCompletion({ onNewTask }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="px-4 py-6"
    >
      <Card className="p-6 border-emerald-500/50 bg-emerald-500/5 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 grid place-items-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-semibold mb-2"
        >
          Task completed
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground mb-6"
        >
          Your request has been processed successfully.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={onNewTask} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Start another task
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
}

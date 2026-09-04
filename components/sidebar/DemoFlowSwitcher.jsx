'use client';

import { Search, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const DEMO_FLOWS = [
  {
    id: 'laptop-search',
    name: 'Laptop Search',
    description: 'Find and compare gaming laptops',
    icon: Search,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'form-filling',
    name: 'Form Filling',
    description: 'Auto-fill job application with confirmation',
    icon: FileText,
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Multi-source research and summary',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-500'
  }
];

export function DemoFlowSwitcher({ onSelectFlow, currentFlow }) {
  return (
    <div className="px-4 py-4 border-b border-border/60 bg-secondary/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Demo Flows
        </h3>
        <Badge variant="outline" className="text-xs">
          Interactive Demo
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {DEMO_FLOWS.map((flow) => {
          const Icon = flow.icon;
          const isActive = currentFlow === flow.id;
          return (
            <Button
              key={flow.id}
              variant={isActive ? 'default' : 'outline'}
              className="w-full justify-start h-auto py-3 px-3"
              onClick={() => onSelectFlow(flow.id)}
              disabled={isActive}
            >
              <div className={`flex-shrink-0 h-8 w-8 rounded-md bg-gradient-to-br ${flow.color} grid place-items-center mr-3`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{flow.name}</p>
                <p className="text-xs text-muted-foreground">{flow.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

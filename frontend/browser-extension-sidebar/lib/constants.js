// Agent Status Constants
export const AGENT_STATUS = {
  READY: 'ready',
  THINKING: 'thinking',
  WORKING: 'working',
  PAUSED: 'paused',
  WAITING: 'waiting',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// Agent Event Types
export const AGENT_EVENTS = {
  TASK_STARTED: 'task_started',
  TASK_THINKING: 'task_thinking',
  BROWSER_NAVIGATED: 'browser_navigated',
  ELEMENT_FOUND: 'element_found',
  ELEMENT_CLICKED: 'element_clicked',
  TEXT_TYPED: 'text_typed',
  PAGE_READ: 'page_read',
  TASK_PAUSED: 'task_paused',
  CONFIRMATION_REQUIRED: 'confirmation_required',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  STEP_STARTED: 'step_started',
  STEP_COMPLETED: 'step_completed',
  STEP_FAILED: 'step_failed'
};

// Step Status
export const STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Sidebar States
export const SIDEBAR_STATE = {
  FULL: 'full',
  COMPACT: 'compact',
  HIDDEN: 'hidden'
};

// Default sidebar width
export const SIDEBAR_WIDTH = {
  DEFAULT: 400,
  MIN: 320,
  MAX: 650
};

// Floating window dimensions
export const WINDOW_SIZE = {
  DEFAULT: { W: 420, H: 640 },
  MIN: { W: 10, H: 10 },
  MAX: { W: 700, H: 900 },
};

// Status Display Config
export const STATUS_CONFIG = {
  [AGENT_STATUS.READY]: {
    label: 'Ready',
    color: 'text-emerald-400',
    icon: '●'
  },
  [AGENT_STATUS.THINKING]: {
    label: 'Thinking...',
    color: 'text-blue-400',
    icon: '◌',
    animated: true
  },
  [AGENT_STATUS.WORKING]: {
    label: 'Working on page...',
    color: 'text-blue-400',
    icon: '●',
    animated: true
  },
  [AGENT_STATUS.PAUSED]: {
    label: 'Paused',
    color: 'text-amber-400',
    icon: 'Ⅱ'
  },
  [AGENT_STATUS.WAITING]: {
    label: 'Waiting for approval',
    color: 'text-amber-400',
    icon: '⚠'
  },
  [AGENT_STATUS.COMPLETED]: {
    label: 'Task completed',
    color: 'text-emerald-400',
    icon: '✓'
  },
  [AGENT_STATUS.ERROR]: {
    label: 'Something went wrong',
    color: 'text-red-400',
    icon: '!'
  }
};

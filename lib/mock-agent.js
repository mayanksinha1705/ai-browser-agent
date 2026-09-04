import { AGENT_STATUS, AGENT_EVENTS } from '@/lib/constants';
import { agentEmitter } from './agent-emitter';

// Mock Agent Class
export class MockAgent {
  constructor() {
    this.status = AGENT_STATUS.READY;
    this.currentFlow = null;
    this.currentStepIndex = -1;
    this.messages = [];
    this.browserActions = [];
    this.isRunning = false;
    this.isPaused = false;
    this.pendingConfirmation = null;
  }

  async startFlow(flowConfig) {
    if (this.isRunning) return;

    this.currentFlow = flowConfig;
    this.currentStepIndex = -1;
    this.isRunning = true;
    this.isPaused = false;
    this.browserActions = [];

    // Add user message
    this.addMessage({
      role: 'user',
      content: flowConfig.userMessage,
      timestamp: new Date()
    });

    // Start task
    agentEmitter.emit(AGENT_EVENTS.TASK_STARTED, {
      flowId: flowConfig.id,
      message: flowConfig.userMessage
    });

    this.status = AGENT_STATUS.THINKING;
    this.emitStatusChange();

    // Execute steps
    await this.executeSteps();
  }

  async executeSteps() {
    const steps = this.currentFlow.steps;

    for (let i = 0; i < steps.length; i++) {
      if (!this.isRunning || this.isPaused) break;

      this.currentStepIndex = i;
      const step = steps[i];

      // Check for confirmation requirement
      if (step.requiresConfirmation) {
        this.status = AGENT_STATUS.WAITING;
        this.isPaused = true;
        this.pendingConfirmation = this.currentFlow.confirmation;
        this.emitStatusChange();
        
        agentEmitter.emit(AGENT_EVENTS.CONFIRMATION_REQUIRED, {
          confirmation: this.pendingConfirmation,
          stepId: step.id
        });
        
        // Wait for confirmation
        return;
      }

      // Emit step started
      agentEmitter.emit(AGENT_EVENTS.STEP_STARTED, {
        stepId: step.id,
        label: step.label,
        index: i
      });

      this.status = AGENT_STATUS.WORKING;
      this.emitStatusChange();

      // Add browser action if present
      if (step.action) {
        this.addBrowserAction(step.action);
      }

      // Wait for step duration
      await this.delay(step.duration);

      // Emit step completed
      agentEmitter.emit(AGENT_EVENTS.STEP_COMPLETED, {
        stepId: step.id,
        index: i
      });
    }

    // Task completed if not waiting for confirmation
    if (!this.isPaused) {
      await this.completeTask();
    }
  }

  async continueAfterConfirmation(approved) {
    if (!approved) {
      this.cancelTask();
      return;
    }

    this.isPaused = false;
    this.pendingConfirmation = null;
    this.status = AGENT_STATUS.WORKING;
    this.emitStatusChange();

    // Execute post-confirmation steps if any
    if (this.currentFlow.postConfirmationSteps) {
      for (const step of this.currentFlow.postConfirmationSteps) {
        if (!this.isRunning) break;

        agentEmitter.emit(AGENT_EVENTS.STEP_STARTED, {
          stepId: step.id,
          label: step.label
        });

        await this.delay(step.duration);

        agentEmitter.emit(AGENT_EVENTS.STEP_COMPLETED, {
          stepId: step.id
        });
      }
    }

    await this.completeTask();
  }

  async completeTask() {
    this.status = AGENT_STATUS.COMPLETED;
    this.isRunning = false;
    this.emitStatusChange();

    // Add result message
    this.addMessage({
      role: 'agent',
      content: this.formatResult(this.currentFlow.result),
      result: this.currentFlow.result,
      timestamp: new Date()
    });

    agentEmitter.emit(AGENT_EVENTS.TASK_COMPLETED, {
      result: this.currentFlow.result
    });
  }

  pauseTask() {
    this.isPaused = true;
    this.status = AGENT_STATUS.PAUSED;
    this.emitStatusChange();
    agentEmitter.emit(AGENT_EVENTS.TASK_PAUSED, {});
  }

  resumeTask() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.status = AGENT_STATUS.WORKING;
    this.emitStatusChange();
    this.executeSteps();
  }

  cancelTask() {
    this.isRunning = false;
    this.isPaused = false;
    this.status = AGENT_STATUS.READY;
    this.currentFlow = null;
    this.currentStepIndex = -1;
    this.pendingConfirmation = null;
    this.emitStatusChange();
  }

  addMessage(message) {
    this.messages.push(message);
    agentEmitter.emit('message_added', message);
  }

  addBrowserAction(action) {
    this.browserActions.push({
      ...action,
      timestamp: new Date()
    });
    agentEmitter.emit('browser_action', action);
  }

  formatResult(result) {
    if (result.type === 'success') {
      return result.message;
    }
    return 'Task completed successfully.';
  }

  emitStatusChange() {
    agentEmitter.emit('status_changed', {
      status: this.status,
      isPaused: this.isPaused
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return this.status;
  }

  getMessages() {
    return this.messages;
  }

  getBrowserActions() {
    return this.browserActions;
  }

  getCurrentStep() {
    if (!this.currentFlow || this.currentStepIndex < 0) return null;
    return {
      ...this.currentFlow.steps[this.currentStepIndex],
      index: this.currentStepIndex,
      total: this.currentFlow.steps.length
    };
  }

  getAllSteps() {
    if (!this.currentFlow) return [];
    return this.currentFlow.steps;
  }
}

// Create singleton instance
export const mockAgent = new MockAgent();

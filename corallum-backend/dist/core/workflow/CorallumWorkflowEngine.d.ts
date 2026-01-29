import { SimpleEventEmitter } from '../events/SimpleEventEmitter';
import { Workflow, IRun, ExecutionOptions } from '../../types';
import { CorallumAIAgent } from '../../ai/agent/CorallumAIAgent';
import { NodeRegistry } from '../nodes/NodeRegistry';
export declare class CorallumWorkflowEngine extends SimpleEventEmitter {
    private aiAgent;
    private nodeRegistry;
    private executions;
    constructor(aiAgent: CorallumAIAgent, nodeRegistry: NodeRegistry);
    executeWorkflow(workflow: Workflow, triggerData?: any, options?: ExecutionOptions): Promise<IRun>;
    private processExecution;
    private buildExecutionStack;
    private executeNode;
    private generateExecutionId;
    getExecution(executionId: string): IRun | undefined;
    getAllExecutions(): IRun[];
    cancelExecution(executionId: string): boolean;
}
//# sourceMappingURL=CorallumWorkflowEngine.d.ts.map
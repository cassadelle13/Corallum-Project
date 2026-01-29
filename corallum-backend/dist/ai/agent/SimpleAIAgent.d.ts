import { Workflow, Node, ExecutionInsights, IRun, ErrorHelp, FixSuggestion } from '../../types';
export declare class SimpleAIAgent {
    constructor();
    createWorkflowFromRequest(userRequest: string): Promise<Workflow>;
    optimizeWorkflow(workflow: Workflow, analysis: any): Promise<Workflow>;
    helpWithError(node: Node, error: any): Promise<ErrorHelp>;
    analyzeWorkflow(workflow: Workflow): Promise<any>;
    analyzeExecution(execution: IRun): Promise<ExecutionInsights>;
    suggestFixes(workflow: Workflow, error: any): Promise<FixSuggestion[]>;
    private analyzeRequest;
    private generateNodes;
    private generateEdges;
    private findSlowestNode;
    private findFastestNode;
    private generateId;
}
//# sourceMappingURL=SimpleAIAgent.d.ts.map
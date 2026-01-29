import { NodeTypeDefinition } from './NodeTypes';
export interface INode {
    type: string;
    displayName: string;
    description: string;
    icon: string;
    category: string;
    execute(data: any): Promise<any>;
}
export declare class NodeRegistry {
    private nodes;
    constructor();
    registerNode(node: INode): void;
    getNode(type: string): INode | undefined;
    getAllNodes(): INode[];
    getNodesByCategory(category: string): INode[];
    getNodeTypes(): NodeTypeDefinition[];
    isNodeTypeSupported(type: string): boolean;
    private registerBuiltinNodes;
    private createExecutor;
}
//# sourceMappingURL=NodeRegistry.d.ts.map
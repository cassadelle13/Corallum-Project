export interface NodeTypeDefinition {
    type: string;
    displayName: string;
    description: string;
    icon: string;
    category: 'triggers' | 'operators' | 'integrations' | 'resources' | 'aiagents';
    color?: string;
    shape?: 'square' | 'rectangle' | 'diamond' | 'circle';
    boilerplate?: string;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
    parameters?: Record<string, any>;
}
export interface NodeInput {
    id: string;
    name: string;
    type: string;
    required: boolean;
    description?: string;
}
export interface NodeOutput {
    id: string;
    name: string;
    type: string;
    description?: string;
}
export declare const CORALLUM_NODE_TYPES: NodeTypeDefinition[];
export declare const getNodeByType: (type: string) => NodeTypeDefinition | undefined;
export declare const getNodesByCategory: (category: string) => NodeTypeDefinition[];
export declare const getAllCategories: () => string[];
//# sourceMappingURL=NodeTypes.d.ts.map
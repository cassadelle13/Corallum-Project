import { Document } from "@langchain/core/documents";
export interface AIConfig {
    provider: 'openai' | 'ollama' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface RAGConfig {
    enabled: boolean;
    knowledgeBasePath: string;
    chunkSize: number;
    chunkOverlap: number;
    maxDocuments: number;
}
export interface WorkflowGenerationRequest {
    description: string;
    businessContext?: string;
    industry?: string;
    constraints?: Record<string, any>;
    examples?: any[];
    tenantId?: string;
}
export interface EnhancedWorkflowResponse {
    workflow: any;
    reasoning: string;
    confidence: number;
    suggestions: string[];
    estimatedComplexity: 'low' | 'medium' | 'high';
    businessValue: 'low' | 'medium' | 'high';
    implementationSteps: string[];
}
export declare class LangChainAIManager {
    private llm;
    private embeddings;
    private vectorStore;
    private config;
    private ragConfig;
    private textSplitter;
    private businessKnowledge;
    constructor(config: AIConfig, ragConfig: RAGConfig);
    private initializeModels;
    private initializeRAG;
    private loadBusinessKnowledge;
    private createDefaultKnowledgeBase;
    generateWorkflow(request: WorkflowGenerationRequest): Promise<EnhancedWorkflowResponse>;
    private retrieveRelevantKnowledge;
    private formatKnowledgeContext;
    private createEnhancedPrompt;
    private getSystemPrompt;
    private parseWorkflowResponse;
    private validateAndEnhanceWorkflow;
    private extractReasoning;
    private generateSuggestions;
    private estimateComplexity;
    private estimateBusinessValue;
    private generateImplementationSteps;
    addKnowledgeDocument(domain: string, content: string, metadata?: Record<string, any>): Promise<void>;
    searchKnowledge(query: string, domain?: string, limit?: number): Promise<Document[]>;
    healthCheck(): Promise<{
        status: string;
        details: any;
    }>;
    updateConfig(newConfig: Partial<AIConfig>): void;
    updateRAGConfig(newConfig: Partial<RAGConfig>): void;
}
//# sourceMappingURL=LangChainAIManager.d.ts.map
// LangChain AI Manager с Local LLM и RAG
// Умные workflow с контекстом бизнеса

import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import * as fs from 'fs';
import * as path from 'path';

// AI Configuration interfaces
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

// LangChain AI Manager
export class LangChainAIManager {
  private llm: any;
  private embeddings: any;
  private vectorStore: MemoryVectorStore;
  private config: AIConfig;
  private ragConfig: RAGConfig;
  private textSplitter: RecursiveCharacterTextSplitter;
  private businessKnowledge = new Map<string, Document[]>();

  constructor(config: AIConfig, ragConfig: RAGConfig) {
    this.config = config;
    this.ragConfig = ragConfig;
    this.initializeModels();
    this.initializeRAG();
  }

  private async initializeModels(): Promise<void> {
    console.log('🤖 Initializing LangChain AI Models...');

    // Initialize LLM based on provider
    switch (this.config.provider) {
      case 'openai':
        this.llm = new ChatOpenAI({
          modelName: this.config.model,
          openAIApiKey: this.config.apiKey,
          temperature: this.config.temperature || 0.7,
          maxTokens: this.config.maxTokens || 2000,
        });
        this.embeddings = new OpenAIEmbeddings({
          openAIApiKey: this.config.apiKey,
        });
        break;

      case 'ollama':
        this.llm = new ChatOllama({
          baseUrl: this.config.baseUrl || "http://localhost:11434",
          model: this.config.model,
          temperature: this.config.temperature || 0.7,
        });
        this.embeddings = new OllamaEmbeddings({
          baseUrl: this.config.baseUrl || "http://localhost:11434",
          model: this.config.model,
        });
        break;

      case 'local':
        // Для локальных моделей можно использовать другие провайдеры
        throw new Error('Local models not yet implemented');
    }

    console.log(`✅ Initialized ${this.config.provider} LLM: ${this.config.model}`);
  }

  private async initializeRAG(): Promise<void> {
    if (!this.ragConfig.enabled) {
      console.log('📚 RAG disabled');
      return;
    }

    console.log('📚 Initializing RAG system...');
    
    this.vectorStore = new MemoryVectorStore(this.embeddings);
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.ragConfig.chunkSize,
      chunkOverlap: this.ragConfig.chunkOverlap,
    });

    // Load business knowledge base
    await this.loadBusinessKnowledge();
    
    console.log(`✅ RAG initialized with ${this.businessKnowledge.size} domains`);
  }

  private async loadBusinessKnowledge(): Promise<void> {
    const knowledgePath = this.ragConfig.knowledgeBasePath;
    
    if (!fs.existsSync(knowledgePath)) {
      console.log('📁 Creating default knowledge base...');
      await this.createDefaultKnowledgeBase();
      return;
    }

    // Load knowledge files
    const domains = ['ecommerce', 'finance', 'hr', 'manufacturing', 'healthcare'];
    
    for (const domain of domains) {
      const domainPath = path.join(knowledgePath, `${domain}.txt`);
      if (fs.existsSync(domainPath)) {
        const content = fs.readFileSync(domainPath, 'utf8');
        const documents = await this.textSplitter.createDocuments([content]);
        
        // Add metadata
        documents.forEach(doc => {
          doc.metadata = { ...doc.metadata, domain, source: domainPath };
        });

        await this.vectorStore.addDocuments(documents);
        this.businessKnowledge.set(domain, documents);
        
        console.log(`📚 Loaded ${documents.length} documents for ${domain}`);
      }
    }
  }

  private async createDefaultKnowledgeBase(): Promise<void> {
    const knowledgePath = this.ragConfig.knowledgeBasePath;
    
    // Create directory
    if (!fs.existsSync(knowledgePath)) {
      fs.mkdirSync(knowledgePath, { recursive: true });
    }

    // Create default knowledge files
    const defaultKnowledge = {
      ecommerce: `
        E-commerce business processes:
        1. Order Processing - Receive order → Validate payment → Process payment → Update inventory → Ship order → Send confirmation
        2. Inventory Management - Monitor stock levels → Reorder products → Update website → Notify customers
        3. Customer Service - Receive support ticket → Categorize issue → Assign agent → Resolve issue → Follow up
        4. Marketing Automation - Segment customers → Create campaigns → Send emails → Track results → Optimize
        Key integrations: Payment gateways (Stripe, PayPal), Shipping APIs (FedEx, UPS), Email services (SendGrid), CRM systems
      `,
      finance: `
        Financial business processes:
        1. Invoice Processing - Receive invoice → Validate details → Approve → Process payment → Record transaction
        2. Expense Management - Submit expense → Review → Approve → Reimburse → Report
        3. Financial Reporting - Collect data → Generate reports → Analyze trends → Present to stakeholders
        4. Compliance Monitoring - Check regulations → Ensure compliance → Report violations → Implement fixes
        Key integrations: Accounting software (QuickBooks, Xero), Banking APIs, Compliance tools
      `,
      hr: `
        HR business processes:
        1. Recruitment - Post job → Screen applications → Interview candidates → Make offer → Onboard
        2. Employee Management - Track performance → Manage benefits → Process payroll → Handle leave requests
        3. Training & Development - Identify needs → Create programs → Track progress → Evaluate effectiveness
        4. Compliance - Ensure labor laws → Track certifications → Report metrics → Audit processes
        Key integrations: HRIS systems, Payroll providers, Learning management systems
      `,
      manufacturing: `
        Manufacturing business processes:
        1. Production Planning - Forecast demand → Plan production → Schedule resources → Monitor progress
        2. Quality Control - Inspect materials → Test products → Document results → Improve processes
        3. Supply Chain - Order materials → Track inventory → Manage suppliers → Optimize logistics
        4. Maintenance - Schedule maintenance → Track equipment → Manage repairs → Analyze downtime
        Key integrations: ERP systems, IoT sensors, Quality management tools
      `,
      healthcare: `
        Healthcare business processes:
        1. Patient Management - Schedule appointments → Record visits → Manage treatments → Bill insurance
        2. Clinical Workflows - Triage patients → Order tests → Diagnose conditions → Prescribe treatment
        3. Administrative Tasks - Verify insurance → Process claims → Maintain records → Ensure compliance
        4. Care Coordination - Share information → Coordinate providers → Follow up care → Monitor outcomes
        Key integrations: EHR systems, Billing software, Lab information systems, Telehealth platforms
      `
    };

    for (const [domain, content] of Object.entries(defaultKnowledge)) {
      const filePath = path.join(knowledgePath, `${domain}.txt`);
      fs.writeFileSync(filePath, content);
      
      const documents = await this.textSplitter.createDocuments([content]);
      documents.forEach(doc => {
        doc.metadata = { ...doc.metadata, domain, source: filePath };
      });

      await this.vectorStore.addDocuments(documents);
      this.businessKnowledge.set(domain, documents);
    }

    console.log('📚 Created default knowledge base');
  }

  // Enhanced workflow generation with RAG
  async generateWorkflow(request: WorkflowGenerationRequest): Promise<EnhancedWorkflowResponse> {
    console.log('🧠 Generating enhanced workflow with RAG...');

    try {
      // Retrieve relevant knowledge
      const relevantDocs = await this.retrieveRelevantKnowledge(request);
      const context = this.formatKnowledgeContext(relevantDocs);

      // Create enhanced prompt
      const prompt = await this.createEnhancedPrompt(request, context);

      // Generate workflow with reasoning
      const response = await this.llm.invoke([
        new SystemMessage(this.getSystemPrompt()),
        new HumanMessage(prompt)
      ]);

      const responseText = response.content as string;

      // Parse and enhance response
      const parsed = await this.parseWorkflowResponse(responseText);
      
      return {
        ...parsed,
        reasoning: this.extractReasoning(responseText),
        confidence: 0.85,
        suggestions: await this.generateSuggestions(request, parsed.workflow),
        estimatedComplexity: this.estimateComplexity(parsed.workflow),
        businessValue: this.estimateBusinessValue(request, parsed.workflow),
        implementationSteps: this.generateImplementationSteps(parsed.workflow)
      };

    } catch (error) {
      console.error('❌ Workflow generation failed:', error);
      throw new Error(`AI workflow generation failed: ${error.message}`);
    }
  }

  private async retrieveRelevantKnowledge(request: WorkflowGenerationRequest): Promise<Document[]> {
    if (!this.ragConfig.enabled) {
      return [];
    }

    // Create search query from request
    const searchQuery = `
      ${request.description} 
      ${request.businessContext || ''} 
      ${request.industry || ''}
    `.trim();

    // Search vector store
    const results = await this.vectorStore.similaritySearch(
      searchQuery, 
      this.ragConfig.maxDocuments
    );

    return results;
  }

  private formatKnowledgeContext(docs: Document[]): string {
    if (docs.length === 0) {
      return 'No specific business knowledge available.';
    }

    return docs.map(doc => `
Domain: ${doc.metadata.domain}
${doc.pageContent}
    `).join('\n---\n');
  }

  private async createEnhancedPrompt(request: WorkflowGenerationRequest, context: string): Promise<string> {
    const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert business process automation consultant with deep knowledge of various industries.

TASK: Create a comprehensive workflow automation solution based on the user's request.

BUSINESS CONTEXT:
{context}

USER REQUEST:
Description: {description}
Industry: {industry}
Business Context: {businessContext}
Constraints: {constraints}

REQUIREMENTS:
1. Generate a detailed workflow with nodes and edges
2. Provide step-by-step reasoning for your decisions
3. Estimate complexity and business value
4. Suggest optimizations and improvements
5. Include specific integration recommendations

RESPONSE FORMAT:
<reasoning>
Explain your step-by-step thought process and decision-making
</reasoning>

<workflow>
Generate JSON workflow with:
- nodes: array of workflow nodes with id, type, position, data
- edges: array of connections between nodes
- metadata: workflow information
</workflow>

<analysis>
- complexity: low|medium|high
- business_value: low|medium|high
- estimated_implementation_time: in days
- required_integrations: list of systems/APIs
- potential_challenges: list of obstacles
- optimization_suggestions: list of improvements
</analysis>

<implementation_steps>
1. First step...
2. Second step...
3. etc.
</implementation_steps>
    `);

    return await promptTemplate.format({
      context,
      description: request.description,
      industry: request.industry || 'General',
      businessContext: request.businessContext || 'Not specified',
      constraints: JSON.stringify(request.constraints || {})
    });
  }

  private getSystemPrompt(): string {
    return `
You are an expert business automation consultant with deep knowledge of:
- Business process optimization
- Workflow automation best practices
- System integration patterns
- Industry-specific requirements
- Change management and implementation

Your workflow designs should be:
- Practical and implementable
- Scalable and maintainable
- Cost-effective and efficient
- User-friendly and accessible
- Secure and compliant

Always consider:
- Business impact and ROI
- Technical feasibility
- User adoption
- Integration requirements
- Security and compliance
    `;
  }

  private async parseWorkflowResponse(responseText: string): Promise<{ workflow: any }> {
    // Extract workflow JSON from response
    const workflowMatch = responseText.match(/<workflow>([\s\S]*?)<\/workflow>/);
    if (!workflowMatch) {
      throw new Error('No workflow found in AI response');
    }

    try {
      const workflowJson = workflowMatch[1].trim();
      const workflow = JSON.parse(workflowJson);
      
      // Validate and enhance workflow
      return {
        workflow: this.validateAndEnhanceWorkflow(workflow)
      };
    } catch (error) {
      throw new Error(`Failed to parse workflow JSON: ${error.message}`);
    }
  }

  private validateAndEnhanceWorkflow(workflow: any): any {
    // Ensure required fields
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      workflow.nodes = [];
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      workflow.edges = [];
    }

    // Add default metadata
    if (!workflow.metadata) {
      workflow.metadata = {
        generated_by: 'langchain_ai',
        version: '1.0',
        created_at: new Date().toISOString()
      };
    }

    // Validate nodes
    workflow.nodes = workflow.nodes.map((node: any, index: number) => ({
      id: node.id || `node_${index}`,
      type: node.type || 'default',
      position: node.position || { x: 100 + (index * 200), y: 100 },
      data: node.data || { label: `Node ${index + 1}` }
    }));

    // Validate edges
    workflow.edges = workflow.edges.map((edge: any, index: number) => ({
      id: edge.id || `edge_${index}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default'
    }));

    return workflow;
  }

  private extractReasoning(responseText: string): string {
    const reasoningMatch = responseText.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
    return reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided';
  }

  private async generateSuggestions(request: WorkflowGenerationRequest, workflow: any): Promise<string[]> {
    const suggestionsPrompt = `
Based on this workflow and business request, suggest 3-5 specific improvements:

Request: ${request.description}
Workflow: ${JSON.stringify(workflow, null, 2)}

Provide suggestions for:
1. Performance optimization
2. User experience improvements
3. Cost reduction
4. Security enhancements
5. Additional features
    `;

    const response = await this.llm.invoke([
      new HumanMessage(suggestionsPrompt)
    ]);

    const suggestionsText = response.content as string;
    return suggestionsText.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 5);
  }

  private estimateComplexity(workflow: any): 'low' | 'medium' | 'high' {
    const nodeCount = workflow.nodes?.length || 0;
    const edgeCount = workflow.edges?.length || 0;
    
    if (nodeCount <= 5 && edgeCount <= 4) return 'low';
    if (nodeCount <= 15 && edgeCount <= 20) return 'medium';
    return 'high';
  }

  private estimateBusinessValue(request: WorkflowGenerationRequest, workflow: any): 'low' | 'medium' | 'high' {
    // Simple heuristic based on request complexity and workflow size
    const hasBusinessContext = !!request.businessContext;
    const hasConstraints = !!request.constraints && Object.keys(request.constraints).length > 0;
    const workflowSize = workflow.nodes?.length || 0;
    
    if (hasBusinessContext && hasConstraints && workflowSize > 5) return 'high';
    if (hasBusinessContext || workflowSize > 3) return 'medium';
    return 'low';
  }

  private generateImplementationSteps(workflow: any): string[] {
    const steps = [
      '1. Set up development environment',
      '2. Configure required integrations',
      '3. Implement individual workflow nodes',
      '4. Connect workflow logic and edges',
      '5. Add error handling and validation',
      '6. Test with sample data',
      '7. Deploy to staging environment',
      '8. User acceptance testing',
      '9. Production deployment',
      '10. Monitor and optimize performance'
    ];

    return steps.slice(0, Math.min(workflow.nodes?.length || 5, 10));
  }

  // RAG Document Management
  async addKnowledgeDocument(domain: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.ragConfig.enabled) {
      throw new Error('RAG is not enabled');
    }

    const documents = await this.textSplitter.createDocuments([content]);
    
    documents.forEach(doc => {
      doc.metadata = { ...doc.metadata, domain, ...metadata };
    });

    await this.vectorStore.addDocuments(documents);
    
    // Update in-memory store
    if (!this.businessKnowledge.has(domain)) {
      this.businessKnowledge.set(domain, []);
    }
    this.businessKnowledge.get(domain)!.push(...documents);

    console.log(`📚 Added ${documents.length} documents to ${domain} knowledge base`);
  }

  async searchKnowledge(query: string, domain?: string, limit: number = 5): Promise<Document[]> {
    if (!this.ragConfig.enabled) {
      return [];
    }

    let searchQuery = query;
    if (domain) {
      searchQuery = `${query} domain:${domain}`;
    }

    return await this.vectorStore.similaritySearch(searchQuery, limit);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test LLM
      const testResponse = await this.llm.invoke([new HumanMessage('Hello')]);
      
      return {
        status: 'healthy',
        details: {
          provider: this.config.provider,
          model: this.config.model,
          rag_enabled: this.ragConfig.enabled,
          knowledge_domains: Array.from(this.businessKnowledge.keys()),
          llm_response: testResponse.content ? 'OK' : 'Failed'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          provider: this.config.provider,
          model: this.config.model
        }
      };
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeModels(); // Reinitialize with new config
  }

  updateRAGConfig(newConfig: Partial<RAGConfig>): void {
    this.ragConfig = { ...this.ragConfig, ...newConfig };
    if (newConfig.enabled !== undefined) {
      this.initializeRAG(); // Reinitialize RAG
    }
  }
}

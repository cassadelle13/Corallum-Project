// Enhanced AI API Routes с LangChain интеграцией
import { Router } from 'express';
import { z } from 'zod';
import type { LangChainAIManager } from '../ai/LangChainAIManager';
import type { EnterpriseManager } from '../enterprise/EnterpriseManager';
import { validate } from './_validation/validate';

export default function createAIRouter(ai: LangChainAIManager, enterprise: EnterpriseManager) {
const router = Router();

const generateWorkflowBodySchema = z.object({
  description: z.string().min(1),
  businessContext: z.string().optional(),
  industry: z.string().optional(),
  constraints: z.record(z.any()).optional(),
  examples: z.array(z.any()).optional()
});

const knowledgeDocumentBodySchema = z.object({
  domain: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

const knowledgeSearchQuerySchema = z.object({
  query: z.string().min(1),
  domain: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(5)
});

const updateConfigBodySchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.coerce.number().optional(),
  maxTokens: z.coerce.number().int().optional(),
  rag_enabled: z.boolean().optional()
});

const analyzeWorkflowBodySchema = z.object({
  workflow: z.any(),
  businessContext: z.string().optional()
});

const optimizeWorkflowBodySchema = z.object({
  workflow: z.any(),
  optimizationGoals: z.any().optional()
});

const suggestionsBodySchema = z.object({
  context: z.any(),
  type: z.string().optional()
});

// Enhanced workflow generation
router.post('/generate-workflow', 
  enterprise.requireAuth(),
  validate({ body: generateWorkflowBodySchema }),
  async (req, res) => {
    try {
      const {
        description,
        businessContext,
        industry,
        constraints,
        examples
      } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const request = {
        description,
        businessContext,
        industry,
        constraints,
        examples,
        tenantId: req.user.tenantId
      };

      const result = await ai.generateWorkflow(request);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ AI workflow generation failed:', error);
      res.status(500).json({ 
        error: 'AI workflow generation failed',
        details: error.message 
      });
    }
  }
);

// Knowledge base management
router.post('/knowledge/documents',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'knowledge', action: 'create' }),
  validate({ body: knowledgeDocumentBodySchema }),
  async (req, res) => {
    try {
      const { domain, content, metadata } = req.body;

      if (!domain || !content) {
        return res.status(400).json({ error: 'Domain and content are required' });
      }

      await (ai as any).addKnowledgeDocument(domain, content, metadata || {});
      
      res.json({
        success: true,
        message: `Document added to ${domain} knowledge base`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/knowledge/search',
  enterprise.requireAuth(),
  validate({ query: knowledgeSearchQuerySchema }),
  async (req, res) => {
    try {
      const { query, domain, limit = 5 } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const results = await (ai as any).searchKnowledge(
        query as string,
        domain as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: results.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: doc.metadata?.score || 0
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// AI Configuration
router.get('/config', enterprise.requireAuth(), (req, res) => {
  res.json({
    success: true,
    data: {
      provider: process.env.AI_PROVIDER || 'ollama',
      model: process.env.AI_MODEL || 'llama2',
      rag_enabled: process.env.RAG_ENABLED === 'true',
      temperature: process.env.AI_TEMPERATURE || '0.7',
      maxTokens: process.env.AI_MAX_TOKENS || '2000'
    }
  });
});

router.put('/config',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'ai_config', action: 'update' }),
  validate({ body: updateConfigBodySchema }),
  async (req, res) => {
    try {
      const { provider, model, temperature, maxTokens, rag_enabled } = req.body;

      // Update AI configuration
      (ai as any).updateConfig({
        provider,
        model,
        temperature,
        maxTokens
      });

      // Update RAG configuration
      (ai as any).updateRAGConfig({
        enabled: rag_enabled
      });

      res.json({
        success: true,
        message: 'AI configuration updated'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// AI Health Check
router.get('/health', enterprise.requireAuth(), async (req, res) => {
  try {
    const health = await ai.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced AI features
router.post('/analyze-workflow',
  enterprise.requireAuth(),
  validate({ body: analyzeWorkflowBodySchema }),
  async (req, res) => {
    try {
      const { workflow, businessContext } = req.body;

      if (!workflow) {
        return res.status(400).json({ error: 'Workflow is required' });
      }

      // Analyze workflow for optimization opportunities
      const analysisPrompt = `
Analyze this workflow for optimization opportunities:

Workflow: ${JSON.stringify(workflow, null, 2)}
Business Context: ${businessContext || 'Not provided'}

Provide analysis on:
1. Performance bottlenecks
2. Cost optimization opportunities
3. Security vulnerabilities
4. User experience improvements
5. Scalability concerns

Format response as JSON with sections for each area.
      `;

      const response = await (ai as any).llm.invoke([
        new (require('@langchain/core/messages').HumanMessage)(analysisPrompt)
      ]);

      res.json({
        success: true,
        data: {
          analysis: response.content,
          recommendations: 'Analysis completed'
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/optimize-workflow',
  enterprise.requireAuth(),
  validate({ body: optimizeWorkflowBodySchema }),
  async (req, res) => {
    try {
      const { workflow, optimizationGoals } = req.body;

      if (!workflow) {
        return res.status(400).json({ error: 'Workflow is required' });
      }

      const optimizationPrompt = `
Optimize this workflow based on the following goals:

Workflow: ${JSON.stringify(workflow, null, 2)}
Optimization Goals: ${JSON.stringify(optimizationGoals || {})}

Provide an optimized version of the workflow that:
1. Reduces execution time
2. Minimizes resource usage
3. Improves reliability
4. Enhances user experience

Return the optimized workflow in the same JSON format.
      `;

      const response = await (ai as any).llm.invoke([
        new (require('@langchain/core/messages').HumanMessage)(optimizationPrompt)
      ]);

      // Extract optimized workflow from response
      const workflowMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      const optimizedWorkflow = workflowMatch ? JSON.parse(workflowMatch[1]) : workflow;

      res.json({
        success: true,
        data: {
          originalWorkflow: workflow,
          optimizedWorkflow,
          improvements: 'Workflow optimized based on specified goals'
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// AI-powered suggestions
router.post('/suggestions',
  enterprise.requireAuth(),
  validate({ body: suggestionsBodySchema }),
  async (req, res) => {
    try {
      const { context, type } = req.body;

      let prompt = '';
      
      switch (type) {
        case 'integrations':
          prompt = `Based on this workflow context, suggest relevant integrations: ${JSON.stringify(context)}`;
          break;
        case 'optimizations':
          prompt = `Suggest optimizations for this workflow: ${JSON.stringify(context)}`;
          break;
        case 'best_practices':
          prompt = `Provide best practices for this type of workflow: ${JSON.stringify(context)}`;
          break;
        default:
          prompt = `Provide suggestions for: ${JSON.stringify(context)}`;
      }

      const response = await (ai as any).llm.invoke([
        new (require('@langchain/core/messages').HumanMessage)(prompt)
      ]);

      res.json({
        success: true,
        data: {
          type,
          suggestions: response.content,
          context
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

return router;
}

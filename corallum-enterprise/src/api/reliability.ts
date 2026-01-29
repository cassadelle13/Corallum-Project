// Reliability API Routes с Inngest интеграцией
import { Router } from 'express';
import { z } from 'zod';
import type { InngestManager } from '../reliability/InngestManager';
import type { EnterpriseManager } from '../enterprise/EnterpriseManager';
import { validate } from './_validation/validate';

export default function createReliabilityRouter(reliability: InngestManager, enterprise: EnterpriseManager) {
const router = Router();

const executionIdParamsSchema = z.object({
  executionId: z.string().min(1)
});

const executionsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().min(1).optional()
});

const executeWorkflowBodySchema = z.object({
  workflowId: z.string().min(1),
  workflowDefinition: z.any(),
  input: z.any().optional()
});

const analyticsQuerySchema = z.object({
  timeframe: z.string().min(1).default('24h')
});

// Start reliable workflow execution
router.post('/execute-workflow',
  enterprise.requireAuth(),
  validate({ body: executeWorkflowBodySchema }),
  async (req, res) => {
    try {
      const { workflowId, workflowDefinition, input } = req.body;

      if (!workflowId || !workflowDefinition) {
        return res.status(400).json({ 
          error: 'Workflow ID and definition are required' 
        });
      }

      const executionId = await reliability.startWorkflowExecution(
        workflowId,
        workflowDefinition,
        input || {},
        req.user.tenantId,
        req.user.userId
      );

      res.json({
        success: true,
        data: {
          executionId,
          status: 'started',
          message: 'Workflow execution started with reliability guarantees'
        }
      });
    } catch (error: any) {
      console.error('❌ Workflow execution failed:', error);
      res.status(500).json({ 
        error: 'Failed to start workflow execution',
        details: error.message 
      });
    }
  }
);

// Get execution status
router.get('/executions/:executionId',
  enterprise.requireAuth(),
  validate({ params: executionIdParamsSchema }),
  async (req, res) => {
    try {
      const { executionId } = req.params;
      
      const execution = await reliability.getExecutionStatus(executionId);
      
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      // Check tenant access
      if (execution.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        data: execution
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// List executions for tenant
router.get('/executions',
  enterprise.requireAuth(),
  validate({ query: executionsListQuerySchema }),
  async (req, res) => {
    try {
      const { limit = 20, offset = 0, status } = req.query;

      const executions = await (reliability as any).listExecutions(req.user.tenantId, {
        status: status ? String(status) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.json({
        success: true,
        data: executions,
        count: executions.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Retry failed execution
router.post('/executions/:executionId/retry',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'executions', action: 'retry' }),
  validate({ params: executionIdParamsSchema }),
  async (req, res) => {
    try {
      const { executionId } = req.params;
      
      const execution = await reliability.getExecutionStatus(executionId);
      
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      if (execution.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (execution.status !== 'failed') {
        return res.status(400).json({ 
          error: 'Only failed executions can be retried' 
        });
      }

      // Implement retry logic
      await (reliability as any).retryExecution(executionId);

      res.json({
        success: true,
        message: 'Execution retry initiated'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Cancel execution
router.post('/executions/:executionId/cancel',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'executions', action: 'cancel' }),
  validate({ params: executionIdParamsSchema }),
  async (req, res) => {
    try {
      const { executionId } = req.params;
      
      const execution = await reliability.getExecutionStatus(executionId);
      
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      if (execution.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (['completed', 'failed'].includes(execution.status)) {
        return res.status(400).json({ 
          error: 'Cannot cancel completed execution' 
        });
      }

      // Update status to cancelled
      await (reliability as any).updateExecutionStatus(executionId, 'failed', {
        error: 'Cancelled by user'
      });

      res.json({
        success: true,
        message: 'Execution cancelled'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get reliability metrics
router.get('/metrics',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'metrics', action: 'read' }),
  async (req, res) => {
    try {
      const metrics = reliability.getMetrics();
      
      res.json({
        success: true,
        data: {
          ...metrics,
          tenantId: req.user.tenantId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Health check for reliability system
router.get('/health', enterprise.requireAuth(), async (req, res) => {
  try {
    const health = await reliability.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup old executions
router.post('/cleanup',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'executions', action: 'cleanup' }),
  async (req, res) => {
    try {
      await reliability.cleanup();
      
      res.json({
        success: true,
        message: 'Cleanup completed'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Execution logs and debugging
router.get('/executions/:executionId/logs',
  enterprise.requireAuth(),
  validate({ params: executionIdParamsSchema }),
  async (req, res) => {
    try {
      const { executionId } = req.params;
      
      const execution = await reliability.getExecutionStatus(executionId);
      
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      if (execution.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get audit logs for this execution
      const allLogs = await enterprise.getAuditLogs(req.user.tenantId, {
        limit: 100
      });
      const logs = allLogs.filter(log => log.details?.executionId === executionId);

      res.json({
        success: true,
        data: {
          execution,
          logs,
          timeline: generateExecutionTimeline(execution, logs)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Performance analytics
router.get('/analytics/performance',
  enterprise.requireAuth(),
  enterprise.requirePermission({ resource: 'analytics', action: 'read' }),
  validate({ query: analyticsQuerySchema }),
  async (req, res) => {
    try {
      const { timeframe = '24h' } = req.query;
      
      const metrics = reliability.getMetrics();
      
      // Calculate performance analytics
      const analytics = {
        timeframe,
        performance: {
          successRate: metrics.successRate,
          averageExecutionTime: metrics.averageExecutionTime,
          throughput: metrics.totalExecutions / 24, // executions per hour
          reliability: '99.9%' // Based on Inngest guarantees
        },
        trends: {
          executions: {
            total: metrics.totalExecutions,
            successful: metrics.successfulExecutions,
            failed: metrics.failedExecutions,
            retrying: metrics.pendingRetries
          }
        },
        recommendations: generatePerformanceRecommendations(metrics)
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Helper functions
type TimelineEntry = {
  timestamp: any;
  event: string;
  status: string;
  details?: any;
};

function generateExecutionTimeline(execution: any, logs: any[]): TimelineEntry[] {
  const timeline: TimelineEntry[] = [
    {
      timestamp: execution.metadata?.createdAt,
      event: 'created',
      status: 'info'
    }
  ];

  if (execution.startedAt) {
    timeline.push({
      timestamp: execution.startedAt,
      event: 'started',
      status: 'info'
    });
  }

  if (execution.completedAt) {
    timeline.push({
      timestamp: execution.completedAt,
      event: execution.status,
      status: execution.status === 'completed' ? 'success' : 'error'
    });
  }

  // Add log events
  logs.forEach(log => {
    timeline.push({
      timestamp: log.created_at,
      event: log.action,
      status: 'info',
      details: log.details
    });
  });

  return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generatePerformanceRecommendations(metrics: any): string[] {
  const recommendations = [];

  if (metrics.successRate < 95) {
    recommendations.push('Consider reviewing failed executions for common patterns');
  }

  if (metrics.pendingRetries > 10) {
    recommendations.push('High number of retries - check workflow logic and external dependencies');
  }

  if (metrics.averageExecutionTime > 30000) {
    recommendations.push('Consider optimizing workflows for better performance');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is performing optimally');
  }

  return recommendations;
}

return router;
}

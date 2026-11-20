import { Request, Response } from 'express';
import AgentDecision from '../models/AgentDecision.model';
import Shipment from '../models/Shipment.model';
import Road from '../models/Road.model';
import { runAgentCycle, getAgentStatus } from '../services/agent.service';

export const triggerAgentRun = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await runAgentCycle();
    const status = getAgentStatus();
    res.json({
      message: 'Autonomous agent cycle completed successfully',
      summary,
      status,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Agent run execution failed', error: err.message });
  }
};

export const getDecisions = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const decisions = await AgentDecision.findAll({
      limit: Math.min(100, Math.max(1, limit)),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'code', 'cargoType', 'priority', 'status', 'driverName'],
        },
        {
          model: Road,
          as: 'road',
          attributes: ['id', 'name', 'status', 'riskScore', 'riskLevel'],
        },
      ],
    });
    res.json(decisions);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve agent decisions', error: err.message });
  }
};

export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = getAgentStatus();
    const totalDecisions = await AgentDecision.count();
    const reroutes = await AgentDecision.count({ where: { decision: 'REROUTE' } });
    const holds = await AgentDecision.count({ where: { decision: 'HOLD' } });
    const escalations = await AgentDecision.count({ where: { decision: 'ESCALATE' } });

    res.json({
      ...status,
      counts: {
        totalDecisions,
        reroutes,
        holds,
        escalations,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get agent status', error: err.message });
  }
};

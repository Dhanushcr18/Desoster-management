import { Request, Response } from 'express';
import AgentDecision from '../models/AgentDecision.model';
import Shipment from '../models/Shipment.model';
import env from '../config/env';

export const getImpactMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const decisions = await AgentDecision.findAll({
      include: [
        {
          model: Shipment,
          as: 'shipment',
          attributes: ['id', 'code', 'cargoType', 'priority'],
        },
      ],
    });

    let reroutes = 0;
    let holds = 0;
    let escalations = 0;
    let totalDelayAvoidedMin = 0;
    const protectedShipmentIds = new Set<number>();
    const criticalMedicineShipmentIds = new Set<number>();

    const cargoBreakdown: Record<string, { protected: number; delayAvoidedHours: number }> = {
      medicine: { protected: 0, delayAvoidedHours: 0 },
      food: { protected: 0, delayAvoidedHours: 0 },
      fuel: { protected: 0, delayAvoidedHours: 0 },
      water: { protected: 0, delayAvoidedHours: 0 },
      general: { protected: 0, delayAvoidedHours: 0 },
    };

    for (const d of decisions) {
      if (d.decision === 'REROUTE') reroutes++;
      else if (d.decision === 'HOLD') holds++;
      else if (d.decision === 'ESCALATE') escalations++;

      if (d.decision === 'REROUTE' || d.decision === 'HOLD') {
        protectedShipmentIds.add(d.shipmentId);
        totalDelayAvoidedMin += d.estimatedDelayAvoidedMin || 0;

        const shipment = d.shipment;
        if (shipment) {
          if (shipment.priority === 'critical' || shipment.cargoType === 'medicine') {
            criticalMedicineShipmentIds.add(shipment.id);
          }

          const cargo = shipment.cargoType || 'general';
          if (!cargoBreakdown[cargo]) {
            cargoBreakdown[cargo] = { protected: 0, delayAvoidedHours: 0 };
          }
          cargoBreakdown[cargo].protected += 1;
          cargoBreakdown[cargo].delayAvoidedHours += Math.round(((d.estimatedDelayAvoidedMin || 0) / 60) * 10) / 10;
        }
      }
    }

    const estimatedDelayHoursAvoided = Math.round((totalDelayAvoidedMin / 60) * 10) / 10;

    res.json({
      isEstimate: true,
      shipmentsProtected: protectedShipmentIds.size,
      reroutesCount: reroutes,
      holdsCount: holds,
      escalationsCount: escalations,
      estimatedDelayHoursAvoided,
      criticalMedicineProtected: criticalMedicineShipmentIds.size,
      cargoBreakdown,
      modelAssumptions: {
        baselineBlockedRoadDelayHours: env.BLOCKED_ROAD_DELAY_MIN / 60,
        delayAvoidedFormula: 'max(0, baselineDelay * (riskScore / 100) - detourExtraTime)',
        disclaimer: 'Delay hours avoided are modelled estimates based on historical road disruption duration and risk probability.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to compute supply resilience impact metrics', error: err.message });
  }
};

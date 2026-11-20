import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env';
import Shipment, { ShipmentStatus } from '../models/Shipment.model';
import Warehouse from '../models/Warehouse.model';
import Road from '../models/Road.model';
import AgentDecision, { DecisionType, ExplanationSource } from '../models/AgentDecision.model';
import { assessAllRoads } from './risk.service';
import { scoreRoute, findSafestRoute } from './routing.service';
import {
  LatLng,
  LngLat,
  lngLatToLatLng,
  latLngToLngLat,
  interpolateAlongLngLatLineString,
} from '../utils/geo';
import { io } from '../server';
import { notifyAgentDecision } from './notification.service';

let isAgentRunning = false;
let agentIntervalHandle: NodeJS.Timeout | null = null;
let lastAgentRunTime: Date | null = null;
let agentRunCount = 0;

export interface AgentRunStatus {
  isRunning: boolean;
  lastRunTime: Date | null;
  nextRunTime: Date | null;
  intervalMinutes: number;
  runCount: number;
}

/**
 * Determine max acceptable extra detour time based on priority and perishable cargo
 */
function getMaxDetourMinutes(cargoType: string, priority: string, perishable: boolean): number {
  if (priority === 'critical' || cargoType === 'medicine') {
    return 180; // Critical medicine can tolerate up to 3 hours detour
  }
  if (perishable || cargoType === 'food') {
    return 120; // Perishable food up to 2 hours
  }
  return 90; // Normal cargo up to 90 min
}

/**
 * Slice remaining route ahead of the truck's current position
 */
function getRemainingRouteCoordinates(activeRouteCoords: LngLat[], progress: number): LngLat[] {
  if (activeRouteCoords.length <= 1 || progress <= 0) {
    return activeRouteCoords;
  }
  if (progress >= 1) {
    return [activeRouteCoords[activeRouteCoords.length - 1]];
  }

  const startIndex = Math.min(
    activeRouteCoords.length - 1,
    Math.floor(progress * activeRouteCoords.length)
  );
  return activeRouteCoords.slice(startIndex);
}

/**
 * Generate human explanation using Gemini or deterministic template
 */
async function generateExplanation(facts: {
  code: string;
  cargoType: string;
  priority: string;
  decision: DecisionType;
  roadName: string;
  riskScore: number;
  rainfall48h: number;
  extraMinutes: number;
  estimatedDelayAvoidedMin: number;
  alternateRoad?: string;
}): Promise<{ explanation: string; driverMessage: string; source: ExplanationSource }> {
  const hoursAvoided = (facts.estimatedDelayAvoidedMin / 60).toFixed(1);
  const altName = facts.alternateRoad || 'alternate regional corridor';

  // Deterministic high-quality template
  let templateExplanation = '';
  let driverMessage = '';

  if (facts.decision === 'REROUTE') {
    templateExplanation = `Truck ${facts.code} (${facts.cargoType}) rerouted via ${altName}: ${facts.roadName} has ${facts.riskScore}% flood/landslide risk (${facts.rainfall48h} mm rain in 48h). Adds ${facts.extraMinutes} min but avoids an estimated ${hoursAvoided} h blocked road delay.`;
    driverMessage = `${facts.code}: Take ${altName}. Reason: flood risk ${facts.riskScore}% ahead on ${facts.roadName}. +${facts.extraMinutes} min.`;
  } else if (facts.decision === 'HOLD') {
    templateExplanation = `Truck ${facts.code} (${facts.cargoType}) held at safe staging area: ${facts.roadName} carries severe risk (${facts.riskScore}%). Rain is forecast to ease within 12h. Staging avoids stranding.`;
    driverMessage = `${facts.code}: HOLD at current safe depot. Critical flood hazard on ${facts.roadName} ahead. Wait for clearance.`;
  } else if (facts.decision === 'ESCALATE') {
    templateExplanation = `Truck ${facts.code} (${facts.cargoType}) escalated to admin: ${facts.roadName} impassable (${facts.riskScore}% risk) and all alternates exceed maximum cargo detour limit. Manual intervention required.`;
    driverMessage = `${facts.code}: Emergency hold. Dispatch team escalated route planning for ${facts.roadName}. Stand by.`;
  } else {
    templateExplanation = `Route clear for ${facts.code} (${facts.cargoType}): ahead corridor risk is low (${facts.riskScore}%). Continuing as planned.`;
    driverMessage = `${facts.code}: All clear ahead on ${facts.roadName}. Proceed on current route.`;
  }

  // If Gemini is available, attempt to polish
  if (env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a Supply Resilience Logistics Agent. Output exactly ONE short sentence explaining this routing decision.
DO NOT invent any numbers or names. Use ONLY these exact facts:
- Truck: ${facts.code}
- Cargo: ${facts.cargoType} (${facts.priority})
- Action: ${facts.decision}
- Risky Road: ${facts.roadName}
- Risk Score: ${facts.riskScore}%
- Rainfall in 48h: ${facts.rainfall48h} mm
- Extra Detour Minutes: ${facts.extraMinutes} min
- Estimated Delay Avoided: ${hoursAvoided} hours
- Alternate Corridor: ${altName}`;

      const res = await Promise.race([
        model.generateContent(prompt),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), 4000)),
      ]);

      const text = (res as any)?.response?.text()?.trim();
      if (text && text.length > 20) {
        return {
          explanation: text,
          driverMessage,
          source: 'gemini',
        };
      }
    } catch (err: any) {
      console.warn('[AgentService] Gemini explanation fallback:', err.message);
    }
  }

  return {
    explanation: templateExplanation,
    driverMessage,
    source: 'template',
  };
}

/**
 * Execute the autonomous agent loop:
 * SENSE -> PREDICT -> DECIDE -> ACT
 */
export async function runAgentCycle(
  customWeatherFetcher?: (lat: number, lng: number) => Promise<{ hourlyRain: number[]; prob: number[] }>
): Promise<{
  decisionsCreated: number;
  reroutes: number;
  holds: number;
  escalations: number;
  continues: number;
}> {
  if (isAgentRunning) {
    console.log('⏳ [AgentService] Agent cycle already running, skipping overlapping run.');
    return { decisionsCreated: 0, reroutes: 0, holds: 0, escalations: 0, continues: 0 };
  }

  isAgentRunning = true;
  lastAgentRunTime = new Date();
  agentRunCount++;

  console.log(`🤖 [AgentService] Run #${agentRunCount} started at ${lastAgentRunTime.toISOString()}`);

  let decisionsCreated = 0;
  let reroutes = 0;
  let holds = 0;
  let escalations = 0;
  let continues = 0;

  try {
    // 1. SENSE & PREDICT: assess all roads
    console.log('📡 [AgentService] SENSE: Assessing weather and terrain risks for all roads...');
    await assessAllRoads(customWeatherFetcher);

    // 2. Load active shipments: in_transit, scheduled, rerouted
    const shipments = await Shipment.findAll({
      where: {
        status: ['in_transit', 'scheduled', 'rerouted'],
      },
      include: [
        { model: Warehouse, as: 'originWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
      ],
    });

    // Priority sort: critical/medicine shipments processed first
    const sortedShipments = [...shipments].sort((a, b) => {
      const aScore = (a.priority === 'critical' ? 10 : 0) + (a.cargoType === 'medicine' ? 5 : 0);
      const bScore = (b.priority === 'critical' ? 10 : 0) + (b.cargoType === 'medicine' ? 5 : 0);
      return bScore - aScore;
    });

    console.log(`🧭 [AgentService] DECIDE: Evaluating ${sortedShipments.length} active shipments...`);

    for (const shipment of sortedShipments) {
      const activeCoords: LngLat[] = shipment.activeRoute?.coordinates || [];
      if (activeCoords.length === 0) continue;

      // Current position of truck
      const currentPos: LatLng = [shipment.currentLat, shipment.currentLng];

      // Destination warehouse coordinates
      let destPos: LatLng = [0, 0];
      if (shipment.destinationWarehouse) {
        destPos = [shipment.destinationWarehouse.lat, shipment.destinationWarehouse.lng];
      } else {
        const lastPt = activeCoords[activeCoords.length - 1];
        destPos = lngLatToLatLng(lastPt);
      }

      // Check risk on remaining route ahead
      const remainingCoords = getRemainingRouteCoordinates(activeCoords, shipment.progress);
      const remainingGeometry = {
        type: 'LineString' as const,
        coordinates: remainingCoords,
      };

      const routeRisk = await scoreRoute(remainingGeometry);
      const maxRisk = routeRisk.maxRiskScore;
      const primaryRiskyRoad = routeRisk.intersectedRoads[0] || null;

      // Conservative delay avoided calculation
      // baseline = BLOCKED_ROAD_DELAY_MIN (default 360)
      // avoided = max(0, BLOCKED_ROAD_DELAY_MIN * (riskScore/100) - extraMinutes)
      const BLOCKED_ROAD_DELAY_MIN = env.BLOCKED_ROAD_DELAY_MIN;

      // Decision rules:
      if (maxRisk < 50) {
        // CONTINUE
        continues++;

        // Only record CONTINUE decision if the shipment was previously rerouted or at_risk to avoid spam
        const lastDecision = await AgentDecision.findOne({
          where: { shipmentId: shipment.id },
          order: [['createdAt', 'DESC']],
        });

        if (lastDecision && lastDecision.decision !== 'CONTINUE') {
          const { explanation, driverMessage, source } = await generateExplanation({
            code: shipment.code,
            cargoType: shipment.cargoType,
            priority: shipment.priority,
            decision: 'CONTINUE',
            roadName: primaryRiskyRoad?.name || 'Highway',
            riskScore: maxRisk,
            rainfall48h: 10,
            extraMinutes: 0,
            estimatedDelayAvoidedMin: 0,
          });

          await AgentDecision.create({
            shipmentId: shipment.id,
            roadId: primaryRiskyRoad?.id || null,
            decision: 'CONTINUE',
            riskScore: maxRisk,
            riskLevel: 'low',
            reasoning: explanation,
            explanationSource: source,
            extraMinutes: 0,
            estimatedDelayAvoidedMin: 0,
            notified: false,
          });
          decisionsCreated++;
        }
      } else {
        // Road risk >= 50: Risk mitigation needed (REROUTE, HOLD, or ESCALATE)
        const maxAllowedExtra = getMaxDetourMinutes(
          shipment.cargoType,
          shipment.priority,
          shipment.perishable
        );

        // Find safest alternate route from current position to destination
        const safestPlan = await findSafestRoute(currentPos, destPos, {
          maxExtraMinutes: maxAllowedExtra,
        });

        const targetRoad = primaryRiskyRoad ? await Road.findByPk(primaryRiskyRoad.id) : null;
        const rainfall48h = targetRoad?.rainfall48h || 120;

        if (safestPlan.isRerouted && (safestPlan.safestRoute.maxRiskScore || 0) < 50) {
          // SAFE ALTERNATE FOUND -> REROUTE
          reroutes++;
          const extraMin = safestPlan.extraMinutes;
          const avoidedMin = Math.max(
            0,
            Math.round(BLOCKED_ROAD_DELAY_MIN * (maxRisk / 100) - extraMin)
          );

          // Construct newly combined active route:
          // Past driven coords + new safest route coords
          const pastCoords = activeCoords.slice(
            0,
            Math.max(1, Math.floor(shipment.progress * activeCoords.length))
          );
          const newCombinedCoords: LngLat[] = [
            ...pastCoords,
            ...safestPlan.safestRoute.geometry.coordinates,
          ];

          shipment.activeRoute = {
            type: 'LineString',
            coordinates: newCombinedCoords,
          };
          shipment.status = 'rerouted';
          shipment.activeDurationMin = shipment.originalDurationMin + extraMin;
          shipment.etaMinutes = Math.round(
            (1 - shipment.progress) * shipment.activeDurationMin
          );
          await shipment.save();

          const { explanation, driverMessage, source } = await generateExplanation({
            code: shipment.code,
            cargoType: shipment.cargoType,
            priority: shipment.priority,
            decision: 'REROUTE',
            roadName: primaryRiskyRoad?.name || 'Corridor',
            riskScore: maxRisk,
            rainfall48h,
            extraMinutes: extraMin,
            estimatedDelayAvoidedMin: avoidedMin,
            alternateRoad: 'Safe Alternate Route',
          });

          const decision = await AgentDecision.create({
            shipmentId: shipment.id,
            roadId: primaryRiskyRoad?.id || null,
            decision: 'REROUTE',
            riskScore: maxRisk,
            riskLevel: maxRisk >= 75 ? 'severe' : 'high',
            reasoning: explanation,
            explanationSource: source,
            extraMinutes: extraMin,
            estimatedDelayAvoidedMin: avoidedMin,
            notified: true,
          });
          decisionsCreated++;

          // Emit real-time events
          io?.emit('shipment:update', shipment);
          io?.emit('agent:decision', {
            ...decision.toJSON(),
            shipmentCode: shipment.code,
            driverMessage,
          });

          // Dispatch notifications (Telegram + In-App)
          await notifyAgentDecision({
            shipment,
            decision: 'REROUTE',
            explanation,
            driverMessage,
            extraMinutes: extraMin,
            delayAvoidedMin: avoidedMin,
          });
        } else {
          // No acceptable alternate route under time constraints
          // Check if rainfall eases within 12h
          const canHold = rainfall48h < 160 && !shipment.perishable;

          if (canHold) {
            // HOLD
            holds++;
            shipment.status = 'held';
            await shipment.save();

            const avoidedMin = Math.max(0, Math.round(BLOCKED_ROAD_DELAY_MIN * 0.5));
            const { explanation, driverMessage, source } = await generateExplanation({
              code: shipment.code,
              cargoType: shipment.cargoType,
              priority: shipment.priority,
              decision: 'HOLD',
              roadName: primaryRiskyRoad?.name || 'Corridor',
              riskScore: maxRisk,
              rainfall48h,
              extraMinutes: 360,
              estimatedDelayAvoidedMin: avoidedMin,
            });

            const decision = await AgentDecision.create({
              shipmentId: shipment.id,
              roadId: primaryRiskyRoad?.id || null,
              decision: 'HOLD',
              riskScore: maxRisk,
              riskLevel: maxRisk >= 75 ? 'severe' : 'high',
              reasoning: explanation,
              explanationSource: source,
              extraMinutes: 360,
              estimatedDelayAvoidedMin: avoidedMin,
              notified: true,
            });
            decisionsCreated++;

            io?.emit('shipment:update', shipment);
            io?.emit('agent:decision', {
              ...decision.toJSON(),
              shipmentCode: shipment.code,
              driverMessage,
            });

            await notifyAgentDecision({
              shipment,
              decision: 'HOLD',
              explanation,
              driverMessage,
              extraMinutes: 360,
              delayAvoidedMin: avoidedMin,
            });
          } else {
            // ESCALATE to admin
            escalations++;
            shipment.status = 'at_risk';
            await shipment.save();

            const { explanation, driverMessage, source } = await generateExplanation({
              code: shipment.code,
              cargoType: shipment.cargoType,
              priority: shipment.priority,
              decision: 'ESCALATE',
              roadName: primaryRiskyRoad?.name || 'Corridor',
              riskScore: maxRisk,
              rainfall48h,
              extraMinutes: 0,
              estimatedDelayAvoidedMin: 0,
            });

            const decision = await AgentDecision.create({
              shipmentId: shipment.id,
              roadId: primaryRiskyRoad?.id || null,
              decision: 'ESCALATE',
              riskScore: maxRisk,
              riskLevel: maxRisk >= 75 ? 'severe' : 'high',
              reasoning: explanation,
              explanationSource: source,
              extraMinutes: 0,
              estimatedDelayAvoidedMin: 0,
              notified: true,
            });
            decisionsCreated++;

            io?.emit('shipment:update', shipment);
            io?.emit('agent:decision', {
              ...decision.toJSON(),
              shipmentCode: shipment.code,
              driverMessage,
            });

            await notifyAgentDecision({
              shipment,
              decision: 'ESCALATE',
              explanation,
              driverMessage,
              extraMinutes: 0,
              delayAvoidedMin: 0,
            });
          }
        }
      }
    }

    console.log(
      `✅ [AgentService] Agent cycle finished: ${decisionsCreated} decisions (${reroutes} reroutes, ${holds} holds, ${escalations} escalations, ${continues} continues)`
    );
  } catch (err: any) {
    console.error('❌ [AgentService] Agent run cycle error:', err);
  } finally {
    isAgentRunning = false;
  }

  return { decisionsCreated, reroutes, holds, escalations, continues };
}

/**
 * Start background autonomous agent interval timer
 */
export function startAgentInterval(intervalMinutes?: number): void {
  const interval = (intervalMinutes ?? env.AGENT_INTERVAL_MIN) * 60 * 1000;
  if (agentIntervalHandle) {
    clearInterval(agentIntervalHandle);
  }

  console.log(`⏱️ [AgentService] Autonomous agent scheduled every ${interval / 60000} minutes`);
  agentIntervalHandle = setInterval(() => {
    runAgentCycle().catch((err) => console.error('[AgentInterval] Error:', err));
  }, interval);
}

export function stopAgentInterval(): void {
  if (agentIntervalHandle) {
    clearInterval(agentIntervalHandle);
    agentIntervalHandle = null;
  }
}

export function getAgentStatus(): AgentRunStatus {
  const nextRunTime = lastAgentRunTime
    ? new Date(lastAgentRunTime.getTime() + env.AGENT_INTERVAL_MIN * 60 * 1000)
    : null;

  return {
    isRunning: isAgentRunning,
    lastRunTime: lastAgentRunTime,
    nextRunTime,
    intervalMinutes: env.AGENT_INTERVAL_MIN,
    runCount: agentRunCount,
  };
}

export default {
  runAgentCycle,
  startAgentInterval,
  stopAgentInterval,
  getAgentStatus,
};

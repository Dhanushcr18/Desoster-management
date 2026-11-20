import Shipment from '../models/Shipment.model';
import Warehouse from '../models/Warehouse.model';
import env from '../config/env';
import { interpolateAlongLngLatLineString, LatLng } from '../utils/geo';
import { io } from '../server';

let simulationIntervalHandle: NodeJS.Timeout | null = null;
const TICK_INTERVAL_MS = 10000; // 10 seconds

/**
 * Execute one simulation tick across all active in-transit shipments
 */
export async function simulateStep(): Promise<number> {
  try {
    const activeShipments = await Shipment.findAll({
      where: {
        status: ['in_transit', 'rerouted'],
      },
      include: [
        { model: Warehouse, as: 'originWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
      ],
    });

    if (activeShipments.length === 0) {
      return 0;
    }

    // Real-world minutes elapsed in 10 seconds = 10 / 60 ≈ 0.1667 min
    const realMinutes = TICK_INTERVAL_MS / 60000;
    const simMinutesElapsed = realMinutes * env.SIM_SPEED;

    for (const shipment of activeShipments) {
      const activeCoords = shipment.activeRoute?.coordinates || [];
      if (activeCoords.length <= 1) continue;

      const duration = shipment.activeDurationMin || 180;
      const progressDelta = simMinutesElapsed / duration;
      const newProgress = Math.min(1.0, shipment.progress + progressDelta);

      // Interpolate truck's current position along active route geometry
      const newPos: LatLng = interpolateAlongLngLatLineString(activeCoords, newProgress);

      shipment.progress = Math.round(newProgress * 1000) / 1000;
      shipment.currentLat = Math.round(newPos[0] * 100000) / 100000;
      shipment.currentLng = Math.round(newPos[1] * 100000) / 100000;
      shipment.etaMinutes = Math.max(0, Math.round((1 - newProgress) * duration));

      if (newProgress >= 1.0) {
        shipment.status = 'delivered';
        console.log(`🏁 [Simulated] Shipment ${shipment.code} delivered to destination.`);
      }

      await shipment.save();

      // Emit real-time simulation update
      try {
        io?.emit('shipment:update', {
          ...shipment.toJSON(),
          isSimulated: true,
        });
      } catch (err: any) {
        console.warn('[Simulation] Socket emit error:', err.message);
      }
    }

    return activeShipments.length;
  } catch (err: any) {
    console.error('❌ [Simulation] Step error:', err);
    return 0;
  }
}

export function startSimulation(): void {
  if (simulationIntervalHandle) {
    clearInterval(simulationIntervalHandle);
  }

  console.log(`🚚 [Simulation] Starting truck movement simulation (speed: ${env.SIM_SPEED}x, tick: 10s)`);
  simulationIntervalHandle = setInterval(() => {
    simulateStep().catch((err) => console.error('[SimulateStep] Error:', err));
  }, TICK_INTERVAL_MS);
}

export function stopSimulation(): void {
  if (simulationIntervalHandle) {
    clearInterval(simulationIntervalHandle);
    simulationIntervalHandle = null;
  }
}

export default {
  simulateStep,
  startSimulation,
  stopSimulation,
};

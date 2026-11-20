import dotenv from 'dotenv';
dotenv.config();

import sequelize, { migrateRoadColumns } from '../config/database';
import '../config/models';
import Warehouse from '../models/Warehouse.model';
import Road from '../models/Road.model';
import Shipment from '../models/Shipment.model';
import AgentDecision from '../models/AgentDecision.model';
import { getRoutes } from '../services/routing.service';
import { interpolateAlongLngLatLineString, LatLng } from '../utils/geo';

async function seedResilience() {
  try {
    console.log('🌱 Starting Supply Resilience Platform database seeding...');
    await sequelize.authenticate();
    await sequelize.sync();
    await migrateRoadColumns();

    // 1. Clear previous resilience supply chain data
    await AgentDecision.destroy({ where: {} });
    await Shipment.destroy({ where: {} });
    console.log('🗑️  Cleaned previous shipments and agent decisions');

    // 2. Seed Warehouses
    const warehouseData = [
      { name: 'Bengaluru Central Distribution Hub', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, type: 'hub' as const },
      { name: 'Mysuru Regional Depot', city: 'Mysuru', state: 'Karnataka', lat: 12.2958, lng: 76.6394, type: 'depot' as const },
      { name: 'Mangaluru Port Depot', city: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lng: 74.8560, type: 'depot' as const },
      { name: 'Kozhikode Coastal Depot', city: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804, type: 'depot' as const },
      { name: 'Kochi Maritime Hub', city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, type: 'hub' as const },
      { name: 'Thiruvananthapuram Medical Store', city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366, type: 'hospital' as const },
      { name: 'Chennai Industrial Hub', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, type: 'hub' as const },
    ];

    const warehouses: Warehouse[] = [];
    for (const w of warehouseData) {
      let wh = await Warehouse.findOne({ where: { name: w.name } });
      if (!wh) {
        wh = await Warehouse.create(w);
      } else {
        await wh.update(w);
      }
      warehouses.push(wh);
    }
    console.log(`✅ Seeded ${warehouses.length} strategic warehouses`);

    // Map for easy access
    const whMap = new Map<string, Warehouse>();
    warehouses.forEach((w) => whMap.set(w.city, w));

    // 3. Seed Roads (known vulnerable corridors and alternates in South India)
    // Road coordinates are [lat, lng][]
    const roadData = [
      {
        name: 'NH75 Shiradi Ghat Section',
        description: 'Key arterial road through Western Ghats connecting Bengaluru to Mangaluru Port. High landslide hazard.',
        status: 'normal' as const,
        coordinates: [
          [12.8900, 75.7800],
          [12.8700, 75.7400],
          [12.8500, 75.7000],
          [12.8350, 75.6400],
          [12.8200, 75.5800],
        ] as [number, number][],
        severity: 'high' as const,
        riskScore: 82,
        riskLevel: 'severe' as const,
        riskReason: '185 mm rain forecast in 48h, peak 34 mm/h, steep terrain variance (320 m), river discharge 2.1x normal',
        rainfall24h: 110,
        rainfall48h: 185,
        peakHourlyRain: 34,
        minElevation: 140,
        riverDischargeRatio: 2.1,
      },
      {
        name: 'NH766 Wayanad Thamarassery Ghat',
        description: 'Critical ghat corridor connecting Mysuru with Kozhikode. Steep hair-pin curves vulnerable to debris flows.',
        status: 'normal' as const,
        coordinates: [
          [11.5800, 76.0800],
          [11.5500, 76.0500],
          [11.5200, 76.0100],
          [11.4900, 75.9800],
          [11.4600, 75.9400],
        ] as [number, number][],
        severity: 'high' as const,
        riskScore: 78,
        riskLevel: 'severe' as const,
        riskReason: '165 mm rain forecast in 48h, peak 29 mm/h, steep terrain variance (450 m gradient)',
        rainfall24h: 95,
        rainfall48h: 165,
        peakHourlyRain: 29,
        minElevation: 85,
        riverDischargeRatio: 1.8,
      },
      {
        name: 'NH66 Kochi-Alappuzha Coastal Corridor',
        description: 'Low-lying coastal road along backwaters. High tidal surge and backwater flooding vulnerability.',
        status: 'normal' as const,
        coordinates: [
          [9.9300, 76.2800],
          [9.8100, 76.3000],
          [9.6800, 76.3200],
          [9.5500, 76.3300],
          [9.4900, 76.3400],
        ] as [number, number][],
        severity: 'medium' as const,
        riskScore: 62,
        riskLevel: 'high' as const,
        riskReason: '130 mm rain forecast in 48h, low-lying sector (4 m elevation), river discharge 1.6x normal',
        rainfall24h: 70,
        rainfall48h: 130,
        peakHourlyRain: 22,
        minElevation: 4,
        riverDischargeRatio: 1.6,
      },
      {
        name: 'Chennai OMR Low-Lying Bypass',
        description: 'Southern Chennai IT corridor prone to severe waterlogging during intense coastal downpours.',
        status: 'normal' as const,
        coordinates: [
          [12.9800, 80.2200],
          [12.9400, 80.2250],
          [12.9000, 80.2300],
          [12.8600, 80.2350],
          [12.8200, 80.2400],
        ] as [number, number][],
        severity: 'medium' as const,
        riskScore: 48,
        riskLevel: 'moderate' as const,
        riskReason: '85 mm rain forecast in 48h, low-lying sector (8 m elevation)',
        rainfall24h: 50,
        rainfall48h: 85,
        peakHourlyRain: 18,
        minElevation: 8,
        riverDischargeRatio: 1.1,
      },
      {
        name: 'NH275 Bengaluru-Mysuru Expressway',
        description: 'High capacity 10-lane expressway. Elevated engineering and rapid drainage.',
        status: 'normal' as const,
        coordinates: [
          [12.9200, 77.4800],
          [12.7200, 77.2800],
          [12.5200, 77.0400],
          [12.4200, 76.8500],
          [12.3200, 76.6600],
        ] as [number, number][],
        severity: 'low' as const,
        riskScore: 12,
        riskLevel: 'low' as const,
        riskReason: '20 mm rain forecast in 48h, elevated expressway drainage',
        rainfall24h: 10,
        rainfall48h: 20,
        peakHourlyRain: 5,
        minElevation: 680,
        riverDischargeRatio: 0.8,
      },
      {
        name: 'NH73 Charmadi Ghat (Alternate Corridor)',
        description: 'Alternate Western Ghat route connecting Mudigere to Belthangady. Higher elevation ridge.',
        status: 'alternate' as const,
        coordinates: [
          [13.1200, 75.6000],
          [13.0800, 75.5200],
          [13.0400, 75.4500],
          [13.0100, 75.3800],
        ] as [number, number][],
        severity: 'low' as const,
        riskScore: 28,
        riskLevel: 'moderate' as const,
        riskReason: '55 mm rain forecast in 48h, stable rocky terrain ridge',
        rainfall24h: 30,
        rainfall48h: 55,
        peakHourlyRain: 12,
        minElevation: 350,
        riverDischargeRatio: 1.0,
      },
    ];

    for (const r of roadData) {
      let road = await Road.findOne({ where: { name: r.name } });
      if (!road) {
        await Road.create(r);
      } else {
        await road.update(r);
      }
    }
    console.log(`✅ Seeded ${roadData.length} key road corridors`);

    // 4. Seed Shipments (14 diverse shipments across South India)
    const shipmentConfigs = [
      {
        code: 'TRK-MED-001',
        cargoType: 'medicine' as const,
        priority: 'critical' as const,
        perishable: true,
        originCity: 'Bengaluru',
        destCity: 'Mangaluru',
        progress: 0.35,
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 98450 11223',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-MED-002',
        cargoType: 'medicine' as const,
        priority: 'critical' as const,
        perishable: true,
        originCity: 'Kochi',
        destCity: 'Thiruvananthapuram',
        progress: 0.45,
        driverName: 'Suresh Nair',
        driverPhone: '+91 94470 33445',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-FOOD-003',
        cargoType: 'food' as const,
        priority: 'high' as const,
        perishable: true,
        originCity: 'Mysuru',
        destCity: 'Kozhikode',
        progress: 0.28,
        driverName: 'Abdul Basheer',
        driverPhone: '+91 98950 55667',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-FUEL-004',
        cargoType: 'fuel' as const,
        priority: 'high' as const,
        perishable: false,
        originCity: 'Mangaluru',
        destCity: 'Bengaluru',
        progress: 0.20,
        driverName: 'Vijay Hegde',
        driverPhone: '+91 94800 77889',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-WAT-005',
        cargoType: 'water' as const,
        priority: 'critical' as const,
        perishable: false,
        originCity: 'Bengaluru',
        destCity: 'Chennai',
        progress: 0.55,
        driverName: 'Karthik Raja',
        driverPhone: '+91 98400 99001',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-MED-006',
        cargoType: 'medicine' as const,
        priority: 'critical' as const,
        perishable: true,
        originCity: 'Chennai',
        destCity: 'Bengaluru',
        progress: 0.40,
        driverName: 'Manoj Pillai',
        driverPhone: '+91 97400 22334',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-FOOD-007',
        cargoType: 'food' as const,
        priority: 'normal' as const,
        perishable: false,
        originCity: 'Bengaluru',
        destCity: 'Mysuru',
        progress: 0.60,
        driverName: 'Chetan Gowda',
        driverPhone: '+91 99000 44556',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-GEN-008',
        cargoType: 'general' as const,
        priority: 'normal' as const,
        perishable: false,
        originCity: 'Kochi',
        destCity: 'Kozhikode',
        progress: 0.15,
        driverName: 'Anil Kumar',
        driverPhone: '+91 94460 66778',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-MED-009',
        cargoType: 'medicine' as const,
        priority: 'critical' as const,
        perishable: true,
        originCity: 'Bengaluru',
        destCity: 'Kochi',
        progress: 0.30,
        driverName: 'Prashant Shenoy',
        driverPhone: '+91 98450 88990',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-FUEL-010',
        cargoType: 'fuel' as const,
        priority: 'high' as const,
        perishable: false,
        originCity: 'Chennai',
        destCity: 'Kochi',
        progress: 0.10,
        driverName: 'Dhanush Selvam',
        driverPhone: '+91 98410 11335',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-WAT-011',
        cargoType: 'water' as const,
        priority: 'high' as const,
        perishable: false,
        originCity: 'Mysuru',
        destCity: 'Bengaluru',
        progress: 0.70,
        driverName: 'Rajesh Varma',
        driverPhone: '+91 99800 22446',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-FOOD-012',
        cargoType: 'food' as const,
        priority: 'high' as const,
        perishable: true,
        originCity: 'Kozhikode',
        destCity: 'Kochi',
        progress: 0.50,
        driverName: 'Mohammed Shafi',
        driverPhone: '+91 98950 33557',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-GEN-013',
        cargoType: 'general' as const,
        priority: 'normal' as const,
        perishable: false,
        originCity: 'Thiruvananthapuram',
        destCity: 'Kochi',
        progress: 0.25,
        driverName: 'Vipin George',
        driverPhone: '+91 94470 44668',
        telegramChatId: '123456789',
      },
      {
        code: 'TRK-MED-014',
        cargoType: 'medicine' as const,
        priority: 'critical' as const,
        perishable: true,
        originCity: 'Bengaluru',
        destCity: 'Mangaluru',
        progress: 0.12,
        driverName: 'Deepak Bhat',
        driverPhone: '+91 98450 55779',
        telegramChatId: '123456789',
      },
    ];

    for (const cfg of shipmentConfigs) {
      const origin = whMap.get(cfg.originCity)!;
      const dest = whMap.get(cfg.destCity)!;

      const originCoord: LatLng = [origin.lat, origin.lng];
      const destCoord: LatLng = [dest.lat, dest.lng];

      // Query route via routing service
      const routes = await getRoutes(originCoord, destCoord);
      const fastest = routes[0];

      // Calculate truck position from progress
      const currentPos = interpolateAlongLngLatLineString(
        fastest.geometry.coordinates,
        cfg.progress
      );

      await Shipment.create({
        code: cfg.code,
        cargoType: cfg.cargoType,
        priority: cfg.priority,
        perishable: cfg.perishable,
        originWarehouseId: origin.id,
        destinationWarehouseId: dest.id,
        status: 'in_transit',
        departureTime: new Date(Date.now() - cfg.progress * fastest.durationMin * 60000),
        etaMinutes: Math.round((1 - cfg.progress) * fastest.durationMin),
        currentLat: Math.round(currentPos[0] * 100000) / 100000,
        currentLng: Math.round(currentPos[1] * 100000) / 100000,
        progress: cfg.progress,
        originalRoute: fastest.geometry,
        activeRoute: fastest.geometry,
        originalDurationMin: fastest.durationMin,
        activeDurationMin: fastest.durationMin,
        driverName: cfg.driverName,
        driverPhone: cfg.driverPhone,
        telegramChatId: cfg.telegramChatId,
      });
    }

    console.log(`✅ Seeded ${shipmentConfigs.length} simulated shipments in transit across South India`);
    console.log('🎉 Seed complete! Supply Resilience platform is ready for demonstration.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedResilience();

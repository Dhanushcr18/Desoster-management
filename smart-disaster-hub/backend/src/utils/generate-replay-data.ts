import fs from 'fs';
import path from 'path';

interface HourlyRain {
  time: string;
  rainfall: number; // mm
  prob: number; // 0-100%
}

interface ReplayDataset {
  scenario: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  corridors: Record<string, HourlyRain[]>;
}

function generateKerala2018(): ReplayDataset {
  const startDate = new Date('2018-08-10T00:00:00.000Z');
  const endDate = new Date('2018-08-20T23:00:00.000Z');
  const totalHours = Math.round((endDate.getTime() - startDate.getTime()) / 3600000);

  const corridors: Record<string, HourlyRain[]> = {
    'NH75 Shiradi Ghat Section': [],
    'NH766 Wayanad Thamarassery Ghat': [],
    'NH66 Kochi-Alappuzha Coastal Corridor': [],
    'NH275 Bengaluru-Mysuru Expressway': [],
    'NH73 Charmadi Ghat (Alternate Corridor)': [],
    'Chennai OMR Low-Lying Bypass': [],
  };

  // Peak of Kerala floods happened Aug 14-17 (hours ~96 to 168)
  for (let h = 0; h < totalHours; h++) {
    const t = new Date(startDate.getTime() + h * 3600000).toISOString();

    // Monsoon surge curve peaking around Aug 15 (hour ~120)
    const peakFactor = Math.exp(-Math.pow((h - 120) / 36, 2));

    // Shiradi Ghat (extreme rain in Western Ghats)
    const shiradiBase = 3 + 18 * peakFactor + (Math.sin(h / 6) * 4);
    corridors['NH75 Shiradi Ghat Section'].push({
      time: t,
      rainfall: Math.max(0, Math.round(shiradiBase * 10) / 10),
      prob: Math.min(100, Math.round(60 + 38 * peakFactor)),
    });

    // Wayanad Ghat (devastating landslides)
    const wayanadBase = 4 + 22 * peakFactor + (Math.cos(h / 5) * 5);
    corridors['NH766 Wayanad Thamarassery Ghat'].push({
      time: t,
      rainfall: Math.max(0, Math.round(wayanadBase * 10) / 10),
      prob: Math.min(100, Math.round(65 + 35 * peakFactor)),
    });

    // Kochi-Alappuzha (coastal backwater surge)
    const kochiBase = 2 + 14 * peakFactor + (Math.sin(h / 8) * 3);
    corridors['NH66 Kochi-Alappuzha Coastal Corridor'].push({
      time: t,
      rainfall: Math.max(0, Math.round(kochiBase * 10) / 10),
      prob: Math.min(100, Math.round(50 + 45 * peakFactor)),
    });

    // Bengaluru-Mysuru (moderate inland plateau rain)
    const blrBase = 0.5 + 4 * peakFactor + (Math.sin(h / 12) * 1);
    corridors['NH275 Bengaluru-Mysuru Expressway'].push({
      time: t,
      rainfall: Math.max(0, Math.round(blrBase * 10) / 10),
      prob: Math.min(100, Math.round(30 + 30 * peakFactor)),
    });

    // Charmadi Ghat alternate (stable ridge, lower rain)
    const charmadiBase = 1.5 + 7 * peakFactor + (Math.cos(h / 7) * 2);
    corridors['NH73 Charmadi Ghat (Alternate Corridor)'].push({
      time: t,
      rainfall: Math.max(0, Math.round(charmadiBase * 10) / 10),
      prob: Math.min(100, Math.round(45 + 30 * peakFactor)),
    });

    // Chennai (dry during Southwest monsoon)
    corridors['Chennai OMR Low-Lying Bypass'].push({
      time: t,
      rainfall: Math.max(0, Math.round((0.2 + Math.random() * 0.5) * 10) / 10),
      prob: 15,
    });
  }

  return {
    scenario: 'kerala-2018',
    name: 'Kerala August 2018 Extreme Monsoon & Flood Surge',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    description: 'Historical Western Ghats downpour triggering severe landslides in Shiradi & Wayanad and extensive backwater inundation across Kochi.',
    corridors,
  };
}

function generateChennai2015(): ReplayDataset {
  const startDate = new Date('2015-11-28T00:00:00.000Z');
  const endDate = new Date('2015-12-03T23:00:00.000Z');
  const totalHours = Math.round((endDate.getTime() - startDate.getTime()) / 3600000);

  const corridors: Record<string, HourlyRain[]> = {
    'Chennai OMR Low-Lying Bypass': [],
    'NH75 Shiradi Ghat Section': [],
    'NH766 Wayanad Thamarassery Ghat': [],
    'NH66 Kochi-Alappuzha Coastal Corridor': [],
    'NH275 Bengaluru-Mysuru Expressway': [],
    'NH73 Charmadi Ghat (Alternate Corridor)': [],
  };

  // Peak of Chennai floods Dec 1 (hours ~72 to 96)
  for (let h = 0; h < totalHours; h++) {
    const t = new Date(startDate.getTime() + h * 3600000).toISOString();

    const peakFactor = Math.exp(-Math.pow((h - 80) / 18, 2));

    // Chennai OMR (cloudburst up to 35mm/h)
    const chennaiBase = 2 + 28 * peakFactor + (Math.sin(h / 4) * 6);
    corridors['Chennai OMR Low-Lying Bypass'].push({
      time: t,
      rainfall: Math.max(0, Math.round(chennaiBase * 10) / 10),
      prob: Math.min(100, Math.round(70 + 30 * peakFactor)),
    });

    // Shiradi Ghat (moderate Northeast monsoon influence)
    const shiradiBase = 1 + 6 * peakFactor;
    corridors['NH75 Shiradi Ghat Section'].push({
      time: t,
      rainfall: Math.max(0, Math.round(shiradiBase * 10) / 10),
      prob: Math.min(100, Math.round(30 + 30 * peakFactor)),
    });

    corridors['NH766 Wayanad Thamarassery Ghat'].push({
      time: t,
      rainfall: Math.max(0, Math.round((1 + 4 * peakFactor) * 10) / 10),
      prob: 35,
    });

    corridors['NH66 Kochi-Alappuzha Coastal Corridor'].push({
      time: t,
      rainfall: Math.max(0, Math.round((1.5 + 5 * peakFactor) * 10) / 10),
      prob: 40,
    });

    corridors['NH275 Bengaluru-Mysuru Expressway'].push({
      time: t,
      rainfall: Math.max(0, Math.round((0.5 + 3 * peakFactor) * 10) / 10),
      prob: 25,
    });

    corridors['NH73 Charmadi Ghat (Alternate Corridor)'].push({
      time: t,
      rainfall: Math.max(0, Math.round((1 + 3 * peakFactor) * 10) / 10),
      prob: 25,
    });
  }

  return {
    scenario: 'chennai-2015',
    name: 'Chennai December 2015 Coastal Cloudburst & Inundation',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    description: 'Catastrophic Northeast Monsoon cloudburst over the Coromandel coast with 450 mm rain over 24 hours, inundating urban low-lying road networks.',
    corridors,
  };
}

const outDir = path.join(process.cwd(), 'data', 'replay');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outDir, 'kerala-2018.json'),
  JSON.stringify(generateKerala2018(), null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(outDir, 'chennai-2015.json'),
  JSON.stringify(generateChennai2015(), null, 2),
  'utf8'
);

console.log('✅ Generated cached replay files in backend/data/replay/');

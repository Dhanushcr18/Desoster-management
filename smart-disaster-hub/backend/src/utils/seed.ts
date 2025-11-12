import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Alert from '../models/Alert.model';
import Report from '../models/Report.model';
import bcrypt from 'bcrypt';

dotenv.config();

/**
 * Seed database with sample data for demo
 */

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster-hub';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Alert.deleteMany({});
    await Report.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.create([
      {
        email: 'john@example.com',
        password: hashedPassword,
        name: 'John Doe'
      },
      {
        email: 'jane@example.com',
        password: hashedPassword,
        name: 'Jane Smith'
      },
      {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User'
      }
    ]);

    console.log(`✅ Created ${users.length} sample users`);

    // Create sample alerts
    const alerts = await Alert.create([
      {
        title: 'Earthquake Alert - 6.5 Magnitude',
        description: 'A 6.5 magnitude earthquake has been detected 15km from the coast. Residents should move to higher ground and avoid structures near fault lines. Emergency services are on standby.',
        geometry: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        },
        severity: 'high',
        source: 'USGS',
        verified: true
      },
      {
        title: 'Flash Flood Warning',
        description: 'Heavy rainfall has caused flash flooding in downtown areas. Water levels rising rapidly. Avoid driving through flooded streets. Emergency shelters open at City Hall and Community Center.',
        geometry: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522] // Los Angeles
        },
        severity: 'high',
        source: 'NOAA',
        verified: true
      },
      {
        title: 'Wildfire Watch - High Fire Danger',
        description: 'Extremely dry conditions with strong winds creating high fire danger. Red flag warning in effect. Residents should prepare evacuation kits and stay alert for updates.',
        geometry: {
          type: 'Point',
          coordinates: [-122.0842, 37.4220] // Palo Alto
        },
        severity: 'medium',
        source: 'Cal Fire',
        verified: true
      },
      {
        title: 'Severe Thunderstorm Warning',
        description: 'Severe thunderstorms with large hail and damaging winds moving through the area. Seek shelter immediately. Avoid windows and stay indoors.',
        geometry: {
          type: 'Point',
          coordinates: [-87.6298, 41.8781] // Chicago
        },
        severity: 'medium',
        source: 'National Weather Service',
        verified: true
      },
      {
        title: 'Air Quality Alert',
        description: 'Poor air quality due to smoke from nearby wildfires. Sensitive individuals should remain indoors. Use air purifiers if available.',
        geometry: {
          type: 'Point',
          coordinates: [-122.3321, 47.6062] // Seattle
        },
        severity: 'low',
        source: 'EPA',
        verified: true
      }
    ]);

    console.log(`✅ Created ${alerts.length} sample alerts`);

    // Create sample reports
    const reports = await Report.create([
      {
        alertId: alerts[0]._id,
        userId: users[0]._id,
        status: 'safe',
        note: 'Made it to high ground, staying with family'
      },
      {
        alertId: alerts[0]._id,
        userId: users[1]._id,
        status: 'help',
        note: 'Trapped in building, need assistance'
      },
      {
        alertId: alerts[1]._id,
        userId: users[0]._id,
        status: 'safe',
        note: 'At emergency shelter'
      },
      {
        alertId: alerts[2]._id,
        userId: users[1]._id,
        status: 'safe',
        note: 'Evacuated to safe zone'
      }
    ]);

    console.log(`✅ Created ${reports.length} sample reports`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Sample login credentials:');
    console.log('Email: john@example.com');
    console.log('Email: jane@example.com');
    console.log('Email: admin@example.com');
    console.log('Password: password123\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();

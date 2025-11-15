import axios from 'axios';

interface AIServiceConfig {
  provider: 'huggingface' | 'fallback';
  apiKey?: string;
}

class AIService {
  private config: AIServiceConfig;
  private systemPrompt = `You are a helpful disaster management AI assistant. Your role is to provide accurate, concise, and helpful information about:
- Natural disasters (earthquakes, floods, fires, hurricanes, tsunamis, etc.)
- Safety guidelines and emergency procedures
- Emergency preparedness and supplies
- Evacuation procedures
- How to use the disaster management platform
- Emergency contacts and resources
- Current disaster information and alerts
- Location-specific disaster guidance

Keep responses clear, actionable, and empathetic. Use emojis sparingly for better readability. Prioritize safety and accuracy.`;

  constructor(config?: AIServiceConfig) {
    this.config = config || { provider: 'fallback' };
  }

  async chat(message: string): Promise<string> {
    try {
      // Try HuggingFace free API first
      if (this.config.provider === 'huggingface') {
        return await this.chatWithHuggingFace(message);
      }
    } catch (error) {
      console.log('AI API failed, using fallback:', error);
    }

    // Fallback to enhanced keyword-based responses
    return this.chatWithFallback(message);
  }

  private async chatWithHuggingFace(message: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          inputs: message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data[0]?.generated_text) {
        return this.enhanceResponse(response.data[0].generated_text, message);
      }

      throw new Error('Invalid response from HuggingFace');
    } catch (error) {
      throw error;
    }
  }

  private enhanceResponse(aiResponse: string, originalMessage: string): string {
    // Enhance AI response with disaster-specific context
    const lowerMessage = originalMessage.toLowerCase();
    
    if (lowerMessage.includes('earthquake')) {
      return `${aiResponse}\n\n🏢 **Quick Tip:** Remember: Drop, Cover, and Hold On during an earthquake. Check our Dashboard for real-time earthquake alerts.`;
    }
    if (lowerMessage.includes('flood')) {
      return `${aiResponse}\n\n💧 **Safety First:** Never walk or drive through flood waters. Just 6 inches can knock you down. Monitor our alerts for flood warnings.`;
    }
    
    return aiResponse;
  }

  private chatWithFallback(message: string): string {
    const userMessage = message.toLowerCase().trim();
    let response = '';
    const locationMatch = /in\s+([a-zA-Z\s]+)/i.exec(message);
    const extractedLocation = locationMatch ? locationMatch[1].replace(/[?.!]/g, '').trim() : '';
    const locationLabels: Record<string, string> = {
      bangalore: 'Bangalore, India',
      bengaluru: 'Bengaluru, India',
      banglore: 'Bangalore, India',
      mumbai: 'Mumbai, India',
      bombay: 'Mumbai, India',
      delhi: 'Delhi, India',
      chennai: 'Chennai, India',
      kolkata: 'Kolkata, India',
      hyderabad: 'Hyderabad, India',
      pune: 'Pune, India',
      kerala: 'Kerala, India',
      tamil: 'Tamil Nadu, India',
      karnataka: 'Karnataka, India'
    };
    let detectedLocation = '';
    for (const [key, label] of Object.entries(locationLabels)) {
      if (userMessage.includes(key)) {
        detectedLocation = label;
        break;
      }
    }
    const toTitleCase = (text: string) =>
      text
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    if (!detectedLocation && extractedLocation) {
      detectedLocation = toTitleCase(extractedLocation);
    }
    const isLocationQuery =
      !!detectedLocation ||
      userMessage.includes(' in my area') ||
      userMessage.includes('near me') ||
      userMessage.includes('nearby') ||
      userMessage.includes('in city') ||
      userMessage.includes('what happening in') ||
      userMessage.includes('happening in');

    // Disaster types
    if (userMessage.includes('earthquake') || userMessage.includes('seismic')) {
      response = `**Earthquake Safety Guidelines:**

🏠 **During an earthquake:**
• Drop, Cover, and Hold On
• Stay away from windows and heavy objects
• If outdoors, move to an open area
• If driving, pull over and stay in the vehicle

📱 **After an earthquake:**
• Check for injuries and hazards
• Turn off utilities if damaged
• Stay alert for aftershocks
• Follow evacuation orders if issued

📋 Check our Dashboard for real-time earthquake updates in your area.`;
    } else if (userMessage.includes('flood') || userMessage.includes('water') || userMessage.includes('rain')) {
      response = `**Flood Safety Guidelines:**

💧 **Before a flood:**
• Move to higher ground immediately
• Avoid walking or driving through flood waters
• Turn off utilities at main switches
• Bring outdoor belongings indoors

⚠️ **During a flood:**
• Stay away from floodwaters (6 inches can knock you down)
• Never drive through flooded roads
• Move to the highest level of your building
• Call for help if trapped

🏔️ After the flood, wait for authorities to declare the area safe before returning.`;
    } else if (userMessage.includes('fire') || userMessage.includes('wildfire') || userMessage.includes('blaze')) {
      response = `**Fire Safety Guidelines:**

🔥 **Wildfire preparedness:**
• Create defensible space around your home
• Have an evacuation plan ready
• Keep important documents in a fireproof safe
• Monitor air quality and alerts

🚨 **During a wildfire:**
• Evacuate immediately if ordered
• Close all windows and doors
• Wear N95 masks to protect from smoke
• Stay low to the ground if trapped inside

📞 Call emergency services at the first sign of fire.`;
    } else if (userMessage.includes('hurricane') || userMessage.includes('cyclone') || userMessage.includes('storm') || userMessage.includes('typhoon')) {
      response = `**Hurricane/Storm Safety:**

🌀 **Preparation:**
• Board up windows and secure outdoor items
• Stock up on emergency supplies (water, food, batteries)
• Charge all devices and have backup power
• Know your evacuation route

⛈️ **During the storm:**
• Stay indoors away from windows
• Move to an interior room on the lowest floor
• Listen to emergency broadcasts
• Never go outside during the eye of the storm

Stay safe and monitor our alert system for updates!`;
    } else if (userMessage.includes('tsunami') || userMessage.includes('tidal wave')) {
      response = `**Tsunami Safety:**

🌊 **Warning signs:**
• Strong earthquake near coast
• Rapid rise or fall in coastal waters
• Loud ocean roar

🏃 **Immediate action:**
• Move to high ground (100+ feet elevation)
• Move inland at least 2 miles
• Stay away from beaches
• Don't wait for official warnings

⏰ Tsunamis can occur minutes or hours after an earthquake. Stay alert!`;
    } else if (isLocationQuery) {
      const locationLabel = detectedLocation || 'your area';
      response = `**Disaster Information for ${locationLabel}:**

🗺️ **How to check:**
• Open the Dashboard and filter by location
• Use the Map View to see disaster markers near ${locationLabel}
• Click markers for severity, status, and safety tips

📡 **Real-time updates include:**
• Active alerts and warnings issued for ${locationLabel}
• Community reports submitted from the area
• Weather conditions impacting response efforts

💡 Enable browser notifications so you never miss a critical alert for ${locationLabel}.`;
    } else if (userMessage.includes('today') || userMessage.includes('now') || userMessage.includes('current') || userMessage.includes('happening')) {
      response = `**Current Disaster Information:**

To see what's happening right now:

📊 **Dashboard** - View all active alerts in real-time
🗺️ **Map View** - See exact disaster locations
🔴 **Filters** - Sort by severity and type

📱 **Real-time updates include:**
• New disasters as reported
• Official weather data
• Community reports
• Emergency notifications

Visit the Dashboard to see current active disasters in your area!`;
    } else if (userMessage.includes('alert') || userMessage.includes('notification') || userMessage.includes('warning')) {
      response = `**Disaster Alerts:**

Our system provides real-time alerts:
• 🔴 Critical - Immediate action required
• 🟡 Warning - Prepare for potential disaster
• 🟢 Advisory - Stay informed

**Access alerts:**
• View on Dashboard
• Filter by severity and type
• Get detailed information
• See affected locations on map

Enable browser notifications for instant updates!`;
    } else if (userMessage.includes('report') || userMessage.includes('submit')) {
      response = `**Submit Disaster Reports:**

📝 **How to report:**
1. Go to Dashboard
2. Click "Submit Report"
3. Add disaster type, location, severity
4. Include description and photos
5. Submit for verification

Your reports help authorities respond faster and save lives!`;
    } else if (userMessage.includes('emergency') || userMessage.includes('contact') || userMessage.includes('help') || userMessage.includes('911')) {
      response = `**Emergency Contacts:**

🚨 **Universal Numbers:**
• Police: 911 (US) / 112 (EU) / 100 (India)
• Fire: 911 (US) / 112 (EU) / 101 (India)
• Ambulance: 911 (US) / 112 (EU) / 102 (India)

📞 **Disaster Helplines:**
• FEMA: 1-800-621-3362 (US)
• Red Cross: 1-800-733-2767 (US)
• National Disaster: 1-800-985-5990

Find more contacts in the Emergency Contacts section!`;
    } else if (userMessage.includes('prepare') || userMessage.includes('kit') || userMessage.includes('supplies') || userMessage.includes('need')) {
      response = `**Emergency Kit Essentials:**

🎒 **3-day minimum supplies:**
• Water: 1 gallon per person per day
• Non-perishable food
• First aid kit
• Flashlight and batteries
• Phone charger and backup battery
• Medications
• Cash and important documents

Review and update your kit every 6 months!`;
    } else if (userMessage.includes('evacuate') || userMessage.includes('evacuation') || userMessage.includes('leave')) {
      response = `**Evacuation Guidelines:**

🚗 **Before evacuating:**
• Have a plan and know routes
• Keep emergency kit ready
• Fill vehicle with gas
• Take important documents and pets

🏃 **During evacuation:**
• Follow official routes
• Don't take shortcuts
• Stay in contact with family
• Never return until authorities say it's safe!`;
    } else if (userMessage.includes('weather') || userMessage.includes('climate') || userMessage.includes('forecast')) {
      response = `**Weather Information:**

🌡️ **Climate Reports include:**
• Current temperature
• Weather conditions
• Humidity and wind
• Precipitation data

Access in Dashboard → Climate Report tab

We integrate official meteorological data and real-time updates!`;
    } else if (userMessage.includes('map')) {
      response = `**Using the Map:**

🗺️ **Interactive features:**
• Real-time disaster locations
• Affected areas with color coding
• Severity indicators
• Safe zones and routes

**How to use:**
• Click markers for details
• Filter by disaster type
• View community reports
• Find nearby safe zones

The map updates automatically with new alerts!`;
    } else if (userMessage.includes('dashboard') || userMessage.includes('features') || userMessage.includes('how to use')) {
      response = `**Platform Features:**

📊 **Dashboard:**
• View active alerts and warnings
• Submit disaster reports
• Track climate data
• Access emergency contacts
• View location reports

🎯 **Quick Actions:**
• Filter alerts by type/severity
• View detailed information
• Submit reports with photos
• Get real-time updates

Navigate using the sidebar menu!`;
    } else if (userMessage.includes('safe') || userMessage.includes('safety') || userMessage.includes('protect')) {
      response = `**General Safety Tips:**

✅ **During disasters:**
• Stay informed through official channels
• Follow evacuation orders immediately
• Keep emergency contacts handy
• Have multiple communication methods

🏠 **Home safety:**
• Know utility shut-offs
• Have fire extinguishers
• Secure heavy furniture
• Keep emergency kit accessible

Your safety is the top priority!`;
    } else if (userMessage.includes('thank') || userMessage.includes('thanks')) {
      response = `You're welcome! I'm here 24/7 to help keep you safe and informed. Feel free to ask anything about disaster preparedness or our platform! 😊

Stay safe! 🛡️`;
    } else if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
      response = `Hello! 👋 I'm your disaster management AI assistant. 

I can help with:
• 🌪️ Disaster information and safety
• 📋 Platform features and usage
• 🚨 Emergency procedures
• 🎒 Preparedness tips
• 📞 Emergency contacts

What would you like to know?`;
    } else if (userMessage.includes('what') && userMessage.includes('disaster')) {
      response = `**Disasters We Track:**

🌍 **Natural Disasters:**
• Earthquakes • Floods • Wildfires
• Hurricanes • Tsunamis • Tornadoes
• Landslides • Droughts • Heat/Cold waves

📊 **Severity Levels:**
• 🔴 Critical - Evacuate now
• 🟠 High - Prepare to evacuate
• 🟡 Medium - Monitor closely
• 🟢 Low - Stay informed

Ask about any specific disaster for detailed safety info!`;
    } else if (userMessage.includes('account') || userMessage.includes('login') || userMessage.includes('register')) {
      response = `**Account Help:**

🔐 **Creating account:**
1. Click "Register"
2. Enter email and password
3. Confirm password
4. Submit and login

👤 **Account benefits:**
• Submit disaster reports
• Get personalized alerts
• Access all platform features
• Use AI assistant (me!)

Having issues? Make sure your credentials are correct and you have internet connection.`;
    } else if (userMessage.includes('?')) {
      response = `I'd be happy to help! While I may not have specific information about that exact question, I can assist with:

📋 **Main Topics:**
• Specific disaster types and safety guidelines
• Current alerts and disasters
• Platform features and how to use them
• Emergency preparedness
• Location-specific information

💡 **Try asking:**
• "How do I stay safe during [disaster type]?"
• "What's happening today?"
• "How do I submit a report?"
• "What emergency supplies do I need?"

Feel free to rephrase your question!`;
    } else {
      response = `I'm your disaster management assistant! 🌍

I can help you with:

🌪️ **Disaster Safety:**
• Earthquakes, floods, fires, hurricanes, tsunamis
• Emergency procedures and guidelines
• Preparedness tips

📱 **Platform Help:**
• Viewing and submitting alerts
• Using the map and dashboard
• Understanding alert levels
• Account management

🆘 **Emergency Info:**
• Emergency contacts
• Evacuation procedures
• Supply checklist

💡 **Try asking:**
"What should I do during an earthquake?"
"What's happening in my area?"
"How do I prepare an emergency kit?"

How can I help you today?`;
    }

    return response;
  }
}

// Export singleton instance
export const aiService = new AIService({ provider: 'fallback' });
export default aiService;

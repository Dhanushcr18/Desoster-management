import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { newsService } from './news.service';

interface AIServiceConfig {
  provider: 'gemini' | 'huggingface' | 'fallback';
  apiKey?: string;
}

class AIService {
  private config: AIServiceConfig;
  private genAI: GoogleGenerativeAI | null = null;
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
    
    // Initialize Gemini if API key is provided
    if (this.config.apiKey && this.config.provider === 'gemini') {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    }
  }

  async chat(message: string): Promise<string> {
    try {
      // Try Gemini API first if configured
      if (this.config.provider === 'gemini' && this.genAI) {
        return await this.chatWithGemini(message);
      }
      
      // Try HuggingFace free API
      if (this.config.provider === 'huggingface') {
        return await this.chatWithHuggingFace(message);
      }
    } catch (error) {
      console.log('AI API failed, using fallback:', error);
    }

    // Fallback to enhanced keyword-based responses
    return await this.chatWithFallback(message);
  }

  private async chatWithGemini(message: string): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini AI not initialized');
      }

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        systemInstruction: this.systemPrompt
      });

      const chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
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

  private async chatWithFallback(message: string): Promise<string> {
    console.log(`[AI Fallback] Received message: "${message}"`); // Log incoming message
    const userMessage = message.toLowerCase().trim();
    let response = '';
    
    // Enhanced question analysis
    const isQuestion = userMessage.includes('?') || 
                      userMessage.startsWith('what') || 
                      userMessage.startsWith('how') || 
                      userMessage.startsWith('when') ||
                      userMessage.startsWith('where') ||
                      userMessage.startsWith('why') ||
                      userMessage.startsWith('can') ||
                      userMessage.startsWith('should') ||
                      userMessage.startsWith('is') ||
                      userMessage.startsWith('are') ||
                      userMessage.startsWith('do');

    // Location detection
    const locationMatch = /(?:in|at|near)\s+([a-zA-Z\s]+?)(?:\?|$|\.|\s+now|\s+today)/i.exec(message);
    const extractedLocation = locationMatch ? locationMatch[1].trim() : '';
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
      text.split(/\s+/).filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    if (!detectedLocation && extractedLocation) {
      detectedLocation = toTitleCase(extractedLocation);
    }

    console.log(`[AI Fallback] Detected Location: "${detectedLocation}"`); // Log detected location

    // Question intent classification
    const intents = {
      weatherQuery: userMessage.includes('weather') || userMessage.includes('temperature') || userMessage.includes('forecast') || userMessage.includes('climate') || userMessage.includes('rain'),
      locationQuery: !!detectedLocation && (
        userMessage.includes('happening') || 
        userMessage.includes('disaster') || 
        userMessage.includes('alert') ||
        userMessage.includes('status') ||
        userMessage.includes('situation') ||
        userMessage.includes('news') ||
        userMessage.includes('update') ||
        userMessage.includes('info') ||
        isQuestion // Catch-all for questions about a location
      ),
      currentStatus: (userMessage.includes('today') || userMessage.includes('now') || userMessage.includes('current')) && !detectedLocation,
      disasterSpecific: userMessage.includes('earthquake') || userMessage.includes('flood') || userMessage.includes('fire') || 
                        userMessage.includes('hurricane') || userMessage.includes('tsunami') || userMessage.includes('storm') || userMessage.includes('cyclone'),
      preparedness: userMessage.includes('prepare') || userMessage.includes('kit') || userMessage.includes('supplies') || userMessage.includes('safety') || userMessage.includes('precaution'),
      evacuation: userMessage.includes('evacuate') || userMessage.includes('evacuation') || userMessage.includes('leave') || userMessage.includes('route'),
      emergency: userMessage.includes('emergency') || userMessage.includes('911') || userMessage.includes('help') || userMessage.includes('contact') || userMessage.includes('ambulance') || userMessage.includes('police'),
      platformHelp: userMessage.includes('dashboard') || userMessage.includes('map') || userMessage.includes('report') || 
                    userMessage.includes('submit') || userMessage.includes('how to use') || userMessage.includes('app'),
      greeting: userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey') || userMessage.includes('greetings'),
      thanks: userMessage.includes('thank') || userMessage.includes('thanks')
    };

    console.log('[AI Fallback] Intents:', intents); // Log classified intents

    // Response routing based on intent
    if (userMessage.includes('what should i pack for a flood') || userMessage.includes('pack for a flood')) {
      response = `Pack a waterproof bag with essential items such as: bottled water, non-perishable food, a first aid kit, flashlight, extra batteries, important documents in a sealed pouch, a power bank, and basic hygiene supplies.`;
    } else if (intents.greeting) {
      response = `Hello! 👋 I'm your disaster management AI assistant.

I can help you with:
• 🌪️ Information about specific disasters (earthquakes, floods, fires, storms)
• 📍 Current disasters in specific locations
• 🛡️ Safety guidelines and emergency procedures
• 🎒 Emergency preparedness and supplies
• 📱 How to use this platform
• 📞 Emergency contacts

What would you like to know about?`;

    } else if (intents.thanks) {
      response = `You're welcome! I'm here to help keep you safe and informed. 

Feel free to ask me:
• About specific disasters or safety procedures
• What's happening in your area
• How to prepare for emergencies
• How to use our platform features

Stay safe! 🛡️`;

    } else if (intents.weatherQuery && detectedLocation) {
      response = `**Weather Information for ${detectedLocation}:**

I can provide general weather guidance. For real-time, detailed forecasts, please use a dedicated weather service or check the "Climate Report" section in our app.

To stay safe during severe weather in ${detectedLocation}:
• Monitor local news and official weather alerts.
• Secure outdoor furniture and loose objects.
• Stay indoors and away from windows.

Is there a specific type of weather event (like a storm or heatwave) you're concerned about?`;

    } else if (intents.weatherQuery) {
        response = `I can provide weather information if you specify a location. For example, try asking "what is the weather in London?" or check the "Climate Report" section for broader climate data.`;

    } else if (intents.locationQuery && detectedLocation) {
      const news = await newsService.getDisasterNews(detectedLocation);
      const newsSection = news.length > 0 
        ? `\n\n📰 **Latest News for ${detectedLocation}:**\n${news.join('\n')}`
        : '';

      response = `**Current Disaster Status for ${detectedLocation}:**${newsSection}

To check real-time information for ${detectedLocation}:

🗺️ **Live Updates:**
• Open the Dashboard → Map View
• Search or zoom to ${detectedLocation}
• Look for colored markers indicating active disasters
• Click markers for severity levels and safety instructions

📱 **What you'll find:**
• Active alerts and warnings for ${detectedLocation}
• Community reports from residents
• Weather conditions affecting the area
• Emergency resources and contacts

🔔 **Pro tip:** Enable location notifications to get instant alerts for ${detectedLocation}!`;

    } else if (intents.disasterSpecific) {
      let disasterType = '';
      if (userMessage.includes('earthquake')) disasterType = 'earthquake';
      else if (userMessage.includes('flood')) disasterType = 'flood';
      else if (userMessage.includes('fire')) disasterType = 'fire';
      else if (userMessage.includes('hurricane')) disasterType = 'hurricane';
      else if (userMessage.includes('tsunami')) disasterType = 'tsunami';
      else if (userMessage.includes('storm')) disasterType = 'storm';

      response = this.getDisasterInfo(disasterType);

    } else if (intents.preparedness) {
      response = `Being prepared is key to staying safe! Here are some essentials for an emergency kit:

🎒 **Emergency Supply Kit:**
• **Water:** One gallon per person per day for at least three days.
• **Food:** At least a three-day supply of non-perishable food.
• **First-Aid Kit:** Bandages, antiseptic wipes, pain relievers, and any personal medications.
• **Tools:** Flashlight, extra batteries, whistle (to signal for help), and a multi-tool.
• **Sanitation:** Moist towelettes, garbage bags, and plastic ties.

For a complete checklist, visit the "Emergency Contacts" section of the app. Would you like info on a specific type of disaster kit?`;

    } else if (intents.evacuation) {
      response = `Evacuation procedures depend on the specific disaster and your location. Always follow the guidance of local authorities.

**General Evacuation Tips:**
• **Know Your Route:** Have primary and backup evacuation routes planned in advance.
• **Emergency Kit:** Take your emergency supply kit with you.
• **Secure Your Home:** If you have time, lock your doors and windows.
• **Stay Informed:** Listen to a battery-powered radio and follow local evacuation orders.

For specific evacuation plans, check the "Emergency Contacts" section or alerts on the Dashboard.`;

    } else if (intents.emergency) {
      response = `If you are in immediate danger, please contact your local emergency services right away.

**For General Assistance:**
• **Emergency Contacts:** You can find a list of national and local emergency numbers in the "Emergency Contacts" section of this app.
• **Report an Incident:** Use the "Report" button on the map to alert authorities and other users about a new incident.

I am an AI and cannot dispatch emergency services, but I can provide information to help you.`;

    } else if (intents.platformHelp) {
      response = `I can help you use the platform! Here are some common features:

• **Dashboard:** The main screen with an overview of alerts and reports.
• **Map View:** An interactive map showing the location of disasters and user reports. Click on icons for more details.
• **Report:** Use the "Report" button to submit information about a new incident you are witnessing.
• **Emergency Contacts:** A list of important phone numbers and resources.

What feature would you like to learn more about? For example, you can ask, "How do I submit a report?"`;

    } else if (isQuestion) {
      response = `I'm sorry, I'm having trouble understanding that specific question. 

You can ask me about:
• Specific disasters like "what to do in an earthquake?"
• Conditions in a city like "what is happening in New York?"
• How to use the app like "how to report an incident?"

Please try rephrasing your question, and I'll do my best to help!`;

    } else {
      response = `Hello! I am a disaster management assistant. I can answer questions about natural disasters, safety procedures, and how to use this platform. How can I help you today?`;
    }

    console.log(`[AI Fallback] Sending response: "${response}"`); // Log outgoing response
    return response;
  }

  private getDisasterInfo(disasterType: string): string {
    switch (disasterType) {
      case 'earthquake':
        return `**Earthquake Safety Guidelines:**

🏠 **During an earthquake:**
• Drop, Cover, and Hold On immediately
• Stay away from windows and heavy objects
• If outdoors, move to an open area
• If driving, pull over safely and stay in vehicle

📱 **After an earthquake:**
• Check for injuries and hazards
• Turn off utilities if damaged
• Stay alert for aftershocks
• Follow official evacuation orders

🔍 **Real-time updates:**
Check our Dashboard for current earthquake alerts and aftershock information in your area.`;

      case 'flood':
        return `**Flood Safety Guidelines:**

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

🏔️ After flooding, wait for authorities to declare area safe before returning.`;

      case 'fire':
        return `**Fire Safety Guidelines:**

🔥 **Wildfire preparedness:**
• Create defensible space around your home
• Have evacuation plan ready
• Keep important documents safe
• Monitor air quality and alerts

🚨 **During a wildfire:**
• Evacuate immediately if ordered
• Close all windows and doors
• Wear N95 masks for smoke protection
• Stay low if trapped inside

📞 Call emergency services at first sign of fire.`;

      case 'hurricane':
      case 'storm':
        return `**Hurricane/Storm Safety:**

🌀 **Preparation:**
• Board windows and secure outdoor items
• Stock emergency supplies (water, food, batteries)
• Charge devices and have backup power
• Know evacuation routes

⛈️ **During storm:**
• Stay indoors away from windows
• Move to interior room on lowest floor
• Listen to emergency broadcasts
• Never go outside during eye of storm

Monitor our alert system for updates!`;

      case 'tsunami':
        return `**Tsunami Safety:**

🌊 **Warning signs:**
• Strong earthquake near coast
• Rapid rise/fall in coastal waters
• Loud ocean roar

🏃 **Immediate action:**
• Move to high ground (100+ feet elevation)
• Move inland at least 2 miles
• Stay away from beaches
• Don't wait for official warnings

⏰ Tsunamis can occur minutes or hours after earthquakes!`;

      default:
        return `I don't have specific information on this disaster type yet. Please check official sources or ask about general safety guidelines.`;
    }
  }
}

// Export singleton instance with Gemini configuration
const geminiApiKey = process.env.GEMINI_API_KEY;
export const aiService = new AIService({ 
  provider: geminiApiKey ? 'gemini' : 'fallback',
  apiKey: geminiApiKey
});
export default aiService;

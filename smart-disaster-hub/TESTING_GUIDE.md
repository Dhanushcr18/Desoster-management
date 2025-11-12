# Testing Guide - Real-World Data & Alert Details

## ✅ What's Been Fixed

### 1. **Real-World Data Integration** 
- ✅ Switched from OpenWeather API (requires paid key) to **Open-Meteo API** (completely free)
- ✅ Monitors **18 cities worldwide** including 5 in India:
  - **India**: Delhi, Mumbai, Bangalore, Chennai, Kolkata
  - **USA**: New York, Los Angeles, San Francisco, Chicago
  - **Europe**: London, Paris, Berlin
  - **Asia**: Tokyo, Singapore, Beijing, Hong Kong
  - **Australia**: Sydney, Melbourne
- ✅ Fetches real earthquake data from **USGS** (magnitude 4.0+)
- ✅ Fetches real weather data from **Open-Meteo** (temperature, wind, weather conditions)
- ✅ Updates automatically every 5 minutes

### 2. **Alert Details Modal**
- ✅ Created comprehensive modal showing full alert information
- ✅ Click any alert card in sidebar to view details
- ✅ Shows: title, severity, description, location, metadata, safety tips
- ✅ Different view for real-world alerts vs database alerts

---

## 🧪 How to Test

### **Step 1: Access the Dashboard**
1. Open browser to: `http://localhost:5174` (or whatever port Vite shows)
2. Click **"Sign In"** button
3. Use demo credentials:
   - Email: `john@example.com`
   - Password: `password123`
4. Click **"Sign in"** - you should be redirected to Dashboard

### **Step 2: Test Real-World Data Loading**
1. Look for the **"Real Data"** button in the top-right area (next to search)
2. Click **"Real Data"** button
3. Wait 2-5 seconds for data to load
4. **What to expect:**
   - Toast notification appears: "Real-World Data Loaded" with count
   - Badge on "Real Data" button updates with number (e.g., "12")
   - Green pulsing "Live Monitoring" indicator appears
   - New alert cards appear in sidebar with 🌍 globe icon
   - Map markers appear for new alerts

5. **For India specifically:**
   - Look for alerts with locations: Delhi, Mumbai, Bangalore, Chennai, or Kolkata
   - Should see weather alerts if temperature > 35°C or wind > 50 km/h
   - Should see earthquake alerts if any recent earthquakes nearby (magnitude 4.0+)

### **Step 3: Test Alert Details Modal**
1. **Click any alert card** in the left sidebar
2. **What to expect:**
   - Modal popup appears with gradient header (color matches severity)
   - Shows full alert information:
     - 📍 **Title and Description**
     - 🚨 **Severity Badge** (Critical/High/Medium/Low)
     - 📊 **Alert Type** (earthquake/weather/flood/etc.)
     - 🕐 **Timestamp** (e.g., "2 hours ago")
     - 🌍 **Source** (USGS/Open-Meteo/Database)
   - **Location Section:**
     - Latitude and Longitude coordinates
   - **Metadata Section:**
     - For earthquakes: Magnitude, Depth, Place
     - For weather: Temperature, Wind Speed, Weather Description
   - **Safety Recommendations:**
     - Bullet list of safety tips
   - **Action Buttons:**
     - "Got It" - closes modal
     - "More Info" - opens external link (for earthquakes)

3. **Test different alert types:**
   - Click a database alert (no 🌍 icon) - should show database data
   - Click a real-world alert (🌍 icon) - should show real-world data
   - Click an earthquake alert - should have "More Info" button linking to USGS

### **Step 4: Test Map Integration**
1. Look at the map on the right side
2. **What to expect:**
   - Red markers for each alert location
   - Markers appear for both database alerts AND real-world alerts
   - Click a marker to see popup with basic info
   - Markers should appear for India cities if real-world alerts loaded

### **Step 5: Test Real-Time Features**
1. Leave dashboard open for 5 minutes
2. **What to expect:**
   - Every 5 minutes, `loadRealWorldData()` runs automatically
   - If new alerts detected, toast notification appears
   - Sound alert plays (short beep)
   - Badge counter updates
   - New alert cards appear in sidebar

---

## 🐛 Troubleshooting

### **Issue: No India Data Showing**
**Possible Causes:**
1. No current severe weather in India cities (temp < 35°C, wind < 50 km/h)
2. No recent earthquakes near India (magnitude 4.0+)
3. API request failing

**How to Check:**
1. Open browser **Developer Console** (F12)
2. Click "Real Data" button
3. Look for console logs:
   ```
   Loaded X real-world alerts
   Earthquake data: {...}
   Weather alerts: [...]
   ```
4. Check Network tab for API requests to:
   - `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.0_day.geojson`
   - `api.open-meteo.com/v1/forecast?latitude=...`

**Solution:**
- If weather conditions don't meet thresholds, lower them temporarily in `realWeatherService.ts`:
  ```typescript
  // Line ~60-70 - change thresholds:
  if (temperature > 30) { // Changed from 35
    // ...
  }
  if (windSpeed > 40) { // Changed from 50
    // ...
  }
  ```

### **Issue: Modal Not Opening on Click**
**Possible Causes:**
1. JavaScript error in console
2. handleAlertClick not firing

**How to Check:**
1. Open Developer Console (F12)
2. Click an alert card
3. Look for errors in console

**Solution:**
- Refresh page and try again
- Check console for specific error message

### **Issue: Backend Not Connected**
**Symptoms:**
- Can't login
- No database alerts showing
- Toast says "Failed to load alerts"

**How to Check:**
1. Open terminal in VS Code
2. Look for backend server output: `Server is running on port 3000`
3. Check MongoDB: Should say `MongoDB connected successfully`

**Solution:**
```powershell
# Restart backend
cd "c:\Natural desoster\smart-disaster-hub\backend"
npm run dev
```

---

## 📊 Expected Data

### **USGS Earthquake Data**
- **Source:** https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.0_day.geojson
- **Updates:** Every minute (cached for 5 minutes in app)
- **Filter:** Only earthquakes magnitude ≥ 4.0
- **Alert Example:**
  ```
  Title: Earthquake - Magnitude 5.2
  Description: A significant earthquake was detected...
  Location: 34.05, -118.24
  Metadata: 
    - Magnitude: 5.2
    - Depth: 10 km
    - Place: 5km NE of Los Angeles, CA
  ```

### **Open-Meteo Weather Data**
- **Source:** https://api.open-meteo.com/v1/forecast
- **Updates:** Hourly (cached for 5 minutes in app)
- **Alert Types:**
  1. **Heatwave** (Temperature > 35°C)
  2. **High Wind** (Wind Speed > 50 km/h)
  3. **Severe Weather** (Weather Code ≥ 95 - Thunderstorms)
- **Alert Example:**
  ```
  Title: 🌡️ Extreme Heat Warning
  Description: High temperatures detected in Delhi, India...
  Location: 28.6139, 77.2090
  Metadata:
    - Temperature: 38.5°C
    - Wind Speed: 15 km/h
    - Weather: Clear sky
  ```

### **Database Alerts** (Seeded)
- 5 sample alerts from seed script:
  1. Earthquake - San Francisco, CA
  2. Flood Warning - Los Angeles, CA
  3. Wildfire - Palo Alto, CA
  4. Severe Thunderstorm - Chicago, IL
  5. Air Quality Alert - Seattle, WA

---

## 🎯 Success Criteria

✅ **Real-World Data Works** if:
- Clicking "Real Data" button shows toast notification
- Badge counter updates with number
- New alert cards appear with 🌍 icon
- Console logs show "Loaded X real-world alerts"

✅ **India Data Works** if:
- Alert cards show locations: Delhi, Mumbai, Bangalore, Chennai, or Kolkata
- OR console shows weather data fetched for India coordinates

✅ **Alert Details Works** if:
- Clicking any alert card opens modal
- Modal shows all sections: title, description, location, metadata, safety tips
- "Got It" button closes modal
- Real-world alerts show Open-Meteo/USGS data

---

## 📝 Notes

### **Why Open-Meteo Instead of OpenWeather?**
- OpenWeather requires API key (free tier limited to 60 calls/hour)
- User might not have API key configured
- Open-Meteo is completely free, no registration needed
- Open-Meteo provides same data: temperature, wind, weather conditions

### **Weather Code Mapping (WMO Codes)**
The `getWeatherDescription()` method maps WMO codes to descriptions:
- **0** = Clear sky
- **1-3** = Mainly clear, Partly cloudy, Overcast
- **45-48** = Fog
- **51-67** = Drizzle, Rain, Snow
- **71-86** = Snow showers, Rain showers
- **95-99** = Thunderstorm, Hail

### **Data Freshness**
- Real-world data cached for 5 minutes
- After 5 minutes, next load fetches fresh data
- Automatic refresh runs every 5 minutes in background
- Manual refresh available via "Real Data" button

---

## 🚀 Next Steps After Testing

1. **If everything works:**
   - Test on different devices/browsers
   - Add more monitored cities if needed
   - Customize alert thresholds
   - Add more safety recommendations

2. **If issues found:**
   - Check Developer Console for errors
   - Verify API endpoints in Network tab
   - Check backend logs in terminal
   - Review this guide's troubleshooting section

3. **Future enhancements:**
   - Add user preferences for alert types
   - Allow users to add custom monitored locations
   - Historical data visualization
   - Email/SMS notifications for critical alerts

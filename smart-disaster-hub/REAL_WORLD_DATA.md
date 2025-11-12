# Real-World Disaster Data Integration

## 🌍 Data Sources

The Smart Disaster Hub now integrates **real-time disaster data** from multiple global sources:

### 1. **USGS Earthquake Data** 🌋
- **Source**: U.S. Geological Survey
- **URL**: https://earthquake.usgs.gov/
- **Data**: Real-time earthquake alerts worldwide (magnitude 4.0+)
- **Update Frequency**: Updated every 5 minutes
- **Coverage**: Global
- **No API Key Required** ✅

### 2. **OpenWeather API** 🌤️
- **Source**: OpenWeatherMap
- **URL**: https://openweathermap.org/
- **Data**: 
  - Extreme temperature alerts (heatwaves)
  - High wind warnings (windstorms)
  - Severe weather (thunderstorms, tornadoes)
- **Update Frequency**: Every 5 minutes
- **Coverage**: 18+ major cities worldwide
- **API Key**: Optional (free tier available)

## 🌍 Monitored Locations

### India
- New Delhi, Mumbai, Bangalore, Chennai, Kolkata

### USA
- New York, Los Angeles, Chicago, Miami

### Europe
- London, Paris, Berlin

### Asia
- Tokyo, Beijing, Dubai, Singapore

### Australia
- Sydney, Melbourne

## 🚀 How It Works

1. **Automatic Fetching**: Data is automatically fetched when you open the dashboard
2. **Real-Time Updates**: Refreshes every 5 minutes
3. **Instant Notifications**: Toast notifications appear for new alerts
4. **Map Integration**: All alerts appear as markers on the map
5. **Sound Alerts**: Audio notification when new disasters are detected

## 🎯 Features

✅ **Live Earthquake Monitoring** - Real USGS earthquake data
✅ **Weather Alerts** - Heatwaves, windstorms, severe weather
✅ **Global Coverage** - Data from multiple continents
✅ **Severity Classification** - Automatic severity assessment
✅ **Toast Notifications** - Beautiful slide-in alerts
✅ **Sound Notifications** - Audio beep for new alerts
✅ **Badge Counter** - Shows count of new alerts
✅ **Manual Refresh** - "Real Data" button to fetch latest data

## 🔑 Setup (Optional - for Weather Data)

To get weather data, you need an OpenWeather API key (free):

1. Go to: https://home.openweathermap.org/users/sign_up
2. Sign up for a free account
3. Get your API key from the dashboard
4. Create a `.env` file in the `frontend` directory:
   ```
   VITE_OPENWEATHER_API_KEY=your-api-key-here
   ```
5. Restart the frontend server

**Note**: Earthquake data works without any API key!

## 📊 Alert Types

| Type | Source | Criteria |
|------|--------|----------|
| **Earthquake** | USGS | Magnitude ≥ 4.0 |
| **Heatwave** | OpenWeather | Temperature ≥ 35°C |
| **Windstorm** | OpenWeather | Wind Speed ≥ 60 km/h |
| **Storm** | OpenWeather | Thunderstorms, Tornadoes |

## 🎨 UI Features

- **Blue "Real Data" Button**: Click to manually fetch latest data
- **Live Monitoring Badge**: Shows count of real-world alerts
- **Toast Notifications**: Appear for new disasters
- **Map Markers**: All alerts shown on interactive map
- **Sidebar Integration**: Real-world alerts mixed with database alerts
- **Filter Support**: Filter by severity (high, medium, low)

## 🔄 Data Flow

```
USGS API → Fetch Earthquakes → Filter by magnitude → Convert to alerts
                                                              ↓
OpenWeather API → Fetch Weather → Check thresholds → Create alerts
                                                              ↓
                                        Combine all alerts → Display on map
                                                              ↓
                                        Show notifications → Update UI
```

## 🆓 Free Data Sources

Both data sources have **free tiers**:

- **USGS**: Completely free, no registration
- **OpenWeather**: Free tier includes 1,000 calls/day

## 🌐 Expanding Data Sources

Want to add more data sources? You can extend `realWeatherService.ts` to include:

- NASA natural disaster data
- NOAA weather alerts
- European weather services
- Local meteorological departments
- Forest fire tracking systems

## 🎯 Coming Soon

- 🌊 Tsunami warnings (NOAA)
- 🔥 Wildfire tracking (NASA FIRMS)
- 🌀 Hurricane tracking (NOAA)
- ❄️ Blizzard alerts
- 🌋 Volcanic activity (USGS)

## 📱 Mobile Support

All real-time features work perfectly on mobile devices with responsive design!

---

**Last Updated**: November 12, 2025

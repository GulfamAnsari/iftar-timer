
import { format, addDays } from 'date-fns';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PrayerTime {
  name: string;
  time: string;
  timestamp: number;
}

interface DailyPrayers {
  date: string;
  formattedDate: string;
  prayers: PrayerTime[];
}

// Fetch prayer times from the Aladhan API
const fetchPrayerTimesFromAPI = async (
  date: Date,
  coordinates: Coordinates
): Promise<PrayerTime[]> => {
  try {
    const dateStr = format(date, 'dd-MM-yyyy');
    const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&method=2`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch prayer times from API');
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.timings) {
      throw new Error('Invalid response format from prayer times API');
    }
    
    const timings = data.data.timings;
    
    // Map API response to our format
    const prayerMappings = [
      { name: 'Fajr', key: 'Fajr' },
      { name: 'Sunrise', key: 'Sunrise' },
      { name: 'Dhuhr', key: 'Dhuhr' },
      { name: 'Asr', key: 'Asr' },
      { name: 'Maghrib', key: 'Maghrib' },
      { name: 'Isha', key: 'Isha' }
    ];
    
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    return prayerMappings.map(({ name, key }) => {
      // Convert API time format (HH:MM) to Date object
      const [hours, minutes] = timings[key].split(':').map(Number);
      const timestamp = new Date(baseDate);
      timestamp.setHours(hours, minutes, 0, 0);
      
      return {
        name,
        time: format(timestamp, 'h:mm a'),
        timestamp: timestamp.getTime(),
      };
    });
  } catch (error) {
    console.error('Error fetching prayer times from API:', error);
    // Fall back to simplified calculation if API fails
    return calculateFallbackPrayerTimes(date, coordinates);
  }
};

// Fallback calculation for demo purposes when API fails
const calculateFallbackPrayerTimes = (
  date: Date, 
  coordinates: Coordinates
): PrayerTime[] => {
  // This would typically use the coordinates for exact calculations
  // For demo purposes, we'll just use a simplified approach
  
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  // Sample prayer times as fallback
  const times = [
    { name: 'Fajr', hour: 5, minute: 15 },
    { name: 'Sunrise', hour: 6, minute: 30 },
    { name: 'Dhuhr', hour: 12, minute: 15 },
    { name: 'Asr', hour: 15, minute: 45 },
    { name: 'Maghrib', hour: 18, minute: 10 },
    { name: 'Isha', hour: 19, minute: 30 },
  ];
  
  return times.map(({ name, hour, minute }) => {
    const timestamp = new Date(baseDate);
    timestamp.setHours(hour, minute);
    
    return {
      name,
      time: format(timestamp, 'h:mm a'),
      timestamp: timestamp.getTime(),
    };
  });
};

// Calculate Sehri and Iftar times based on Fajr and Maghrib
const calculateRamadanTimes = (prayers: PrayerTime[]): { sehri: PrayerTime; iftar: PrayerTime } => {
  const fajr = prayers.find(prayer => prayer.name === 'Fajr');
  const maghrib = prayers.find(prayer => prayer.name === 'Maghrib');
  
  if (!fajr || !maghrib) {
    throw new Error('Fajr or Maghrib prayer times not found');
  }
  
  // Sehri ends 10 minutes before Fajr
  const sehriTime = new Date(fajr.timestamp - 10 * 60 * 1000);
  
  return {
    sehri: {
      name: 'Sehri',
      time: format(sehriTime, 'h:mm a'),
      timestamp: sehriTime.getTime(),
    },
    iftar: {
      name: 'Iftar',
      time: maghrib.time,
      timestamp: maghrib.timestamp,
    },
  };
};

// Get prayer times for the next few days
export const getPrayerTimesForPeriod = async (
  coordinates: Coordinates,
  days: number = 7
): Promise<DailyPrayers[]> => {
  const result: DailyPrayers[] = [];
  const today = new Date();
  
  // Use Promise.all to fetch all days in parallel
  const promises = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i);
    return fetchPrayerTimesFromAPI(date, coordinates)
      .then(prayers => ({
        date: format(date, 'yyyy-MM-dd'),
        formattedDate: format(date, 'EEEE, MMMM d'),
        prayers,
      }));
  });
  
  return Promise.all(promises);
};

// Get Ramadan specific times (Sehri and Iftar)
export const getRamadanTimes = async (
  coordinates: Coordinates,
  days: number = 7
): Promise<{ date: string; formattedDate: string; sehri: PrayerTime; iftar: PrayerTime }[]> => {
  const prayerTimes = await getPrayerTimesForPeriod(coordinates, days);
  
  return prayerTimes.map(({ date, formattedDate, prayers }) => {
    const { sehri, iftar } = calculateRamadanTimes(prayers);
    return {
      date,
      formattedDate,
      sehri,
      iftar,
    };
  });
};

// Get the next prayer time
export const getNextPrayer = (prayers: PrayerTime[]): PrayerTime | null => {
  const now = Date.now();
  const upcoming = prayers.find(prayer => prayer.timestamp > now);
  return upcoming || null;
};

// Get current location
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unknown error occurred';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          console.warn(`Using default coordinates. Reason: ${errorMessage}`);
          
          // Default to Mecca coordinates if location access is denied
          resolve({
            latitude: 21.3891,
            longitude: 39.8579,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  });
};

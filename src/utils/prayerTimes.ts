
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

// This is a simplified calculation for demo purposes
// In a real app, we would use proper astronomical calculations or an API
const calculatePrayerTimes = (
  date: Date, 
  coordinates: Coordinates
): PrayerTime[] => {
  // This would typically use the coordinates for exact calculations
  // For demo purposes, we'll just use a simplified approach
  
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  // Sample prayer times - in a real app these would be calculated based on location and date
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
  
  // Sehri ends 10 minutes before Fajr
  const sehriTime = new Date(fajr!.timestamp - 10 * 60 * 1000);
  
  return {
    sehri: {
      name: 'Sehri',
      time: format(sehriTime, 'h:mm a'),
      timestamp: sehriTime.getTime(),
    },
    iftar: {
      name: 'Iftar',
      time: maghrib!.time,
      timestamp: maghrib!.timestamp,
    },
  };
};

// Get prayer times for the next few days
export const getPrayerTimesForPeriod = (
  coordinates: Coordinates,
  days: number = 7
): DailyPrayers[] => {
  const result: DailyPrayers[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const prayers = calculatePrayerTimes(date, coordinates);
    
    result.push({
      date: format(date, 'yyyy-MM-dd'),
      formattedDate: format(date, 'EEEE, MMMM d'),
      prayers,
    });
  }
  
  return result;
};

// Get Ramadan specific times (Sehri and Iftar)
export const getRamadanTimes = (
  coordinates: Coordinates,
  days: number = 7
): { date: string; formattedDate: string; sehri: PrayerTime; iftar: PrayerTime }[] => {
  const prayerTimes = getPrayerTimesForPeriod(coordinates, days);
  
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
          // Default to Mecca coordinates if location access is denied
          resolve({
            latitude: 21.3891,
            longitude: 39.8579,
          });
        }
      );
    }
  });
};

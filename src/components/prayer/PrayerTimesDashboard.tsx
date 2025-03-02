
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, MapPin, AlarmClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentLocation, getRamadanTimes, getNextPrayer } from '@/utils/prayerTimes';

const PrayerTimesDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ramadanTimes, setRamadanTimes] = useState<any[]>([]);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [locationName, setLocationName] = useState('Loading location...');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [nextTime, setNextTime] = useState<{ name: string; time: string; timestamp: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get user's location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoadingLocation(true);
        const position = await getCurrentLocation();
        setCoordinates(position);
        
        // Reverse geocoding to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}&zoom=10`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch location data');
          }
          
          const data = await response.json();
          
          // Try to extract the most specific location name available
          let locationName = 'Unknown location';
          
          if (data && data.address) {
            // Priority order for location names
            const locationPriority = [
              'city',
              'town',
              'village',
              'suburb',
              'county',
              'state',
              'country'
            ];
            
            for (const key of locationPriority) {
              if (data.address[key]) {
                locationName = data.address[key];
                break;
              }
            }
            
            // If we still don't have a location name, try to use the display_name
            if (locationName === 'Unknown location' && data.display_name) {
              // Extract just the first part of the display name (usually the most specific)
              locationName = data.display_name.split(',')[0];
            }
          }
          
          setLocationName(locationName);
        } catch (error) {
          console.error('Error getting location name:', error);
          setLocationName(`Location at ${position.latitude.toFixed(2)}, ${position.longitude.toFixed(2)}`);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        toast({
          title: "Location Error",
          description: "Could not access your location. Using default coordinates.",
          variant: "destructive",
        });
        setLocationName('Default location');
      } finally {
        setLoadingLocation(false);
      }
    };
    
    fetchLocation();
  }, [toast]);

  // Calculate prayer times based on location
  useEffect(() => {
    if (coordinates.latitude && coordinates.longitude) {
      const times = getRamadanTimes(coordinates);
      setRamadanTimes(times);
    }
  }, [coordinates]);

  // Determine next prayer time and progress
  useEffect(() => {
    if (ramadanTimes.length > 0) {
      const today = ramadanTimes[0];
      const times = [today.sehri, today.iftar];
      const next = getNextPrayer(times);
      setNextTime(next);
      
      if (next) {
        const now = currentTime.getTime();
        const previous = times.find(t => t.timestamp < next.timestamp)?.timestamp || now - 12 * 60 * 60 * 1000;
        const total = next.timestamp - previous;
        const elapsed = now - previous;
        const calculatedProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        setProgress(calculatedProgress);
      }
    }
  }, [ramadanTimes, currentTime]);

  const handleSetAlarm = (type: 'sehri' | 'iftar') => {
    if (ramadanTimes.length > 0) {
      const time = type === 'sehri' ? ramadanTimes[0].sehri.time : ramadanTimes[0].iftar.time;
      toast({
        title: `${type === 'sehri' ? 'Sehri' : 'Iftar'} Alarm`,
        description: `Alarm will be set for ${time}`,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Current Time and Date */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-1">
          {format(currentTime, 'h:mm')}
          <span className="text-lg ml-1">{format(currentTime, 'a')}</span>
        </h1>
        <p className="text-muted-foreground flex items-center justify-center">
          <Calendar className="w-4 h-4 mr-1" />
          {format(currentTime, 'EEEE, MMMM d, yyyy')}
        </p>
        <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-1" />
          {loadingLocation ? 'Locating...' : locationName}
        </div>
      </div>

      {/* Next Prayer Time Card */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6">
          {nextTime ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">Next</h3>
                  <h2 className="text-3xl font-bold">{nextTime.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Today at</p>
                  <p className="text-2xl font-semibold">{nextTime.time}</p>
                </div>
              </div>
              <Progress value={progress} className="h-2 mb-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p>No upcoming times available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Sehri and Iftar */}
      {ramadanTimes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg text-muted-foreground">Today's</h3>
                  <h2 className="text-2xl font-semibold">Sehri</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleSetAlarm('sehri')}
                  className="rounded-full"
                >
                  <AlarmClock className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-xl font-medium">{ramadanTimes[0]?.sehri?.time}</span>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => handleSetAlarm('sehri')}
                  className="rounded-full"
                >
                  Set Alarm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg text-muted-foreground">Today's</h3>
                  <h2 className="text-2xl font-semibold">Iftar</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleSetAlarm('iftar')}
                  className="rounded-full"
                >
                  <AlarmClock className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-xl font-medium">{ramadanTimes[0]?.iftar?.time}</span>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => handleSetAlarm('iftar')}
                  className="rounded-full"
                >
                  Set Alarm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Days */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Upcoming Days</h2>
        <div className="space-y-4">
          {ramadanTimes.slice(1, 4).map((day, index) => (
            <Card key={index} className="glass-card overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{day.formattedDate}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Sehri</p>
                    <p className="font-medium">{day.sehri.time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Iftar</p>
                    <p className="font-medium">{day.iftar.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrayerTimesDashboard;

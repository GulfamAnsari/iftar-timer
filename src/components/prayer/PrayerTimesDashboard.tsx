
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, MapPin, AlarmClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getCurrentLocation, getRamadanTimes, getNextPrayer } from '@/utils/prayerTimes';

const PrayerTimesDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [ramadanTimes, setRamadanTimes] = useState<any[]>([]);
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [locationName, setLocationName] = useState('Loading location...');
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [nextTime, setNextTime] = useState<{ name: string; time: string; timestamp: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlarmDialog, setShowAlarmDialog] = useState(false);
  const [alarmType, setAlarmType] = useState<'sehri' | 'iftar'>('sehri');
  const [alarmTime, setAlarmTime] = useState('');
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
          description: "Could not access your location. Please check your browser permissions.",
          variant: "destructive",
        });
        setLocationName('Location unavailable');
      } finally {
        setLoadingLocation(false);
      }
    };
    
    fetchLocation();
  }, [toast]);

  // Calculate prayer times based on location
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      if (coordinates.latitude && coordinates.longitude) {
        setIsLoading(true);
        try {
          const times = await getRamadanTimes(coordinates);
          setRamadanTimes(times);
        } catch (error) {
          console.error('Error fetching prayer times:', error);
          toast({
            title: "Error",
            description: "Failed to fetch prayer times. Please check your internet connection and try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchPrayerTimes();
  }, [coordinates, toast]);

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
      setAlarmType(type);
      setAlarmTime(time);
      setShowAlarmDialog(true);
    }
  };

  const confirmSetAlarm = () => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Convert time string to Date object for scheduling
          const [hourStr, minuteStr] = alarmTime.split(':');
          const [minutePart, periodPart] = minuteStr.split(' ');
          
          let hour = parseInt(hourStr, 10);
          const minute = parseInt(minutePart, 10);
          
          if (periodPart.toLowerCase() === 'pm' && hour < 12) {
            hour += 12;
          } else if (periodPart.toLowerCase() === 'am' && hour === 12) {
            hour = 0;
          }
          
          const alarmDate = new Date();
          alarmDate.setHours(hour, minute, 0, 0);
          
          // If the time has already passed today, schedule for tomorrow
          if (alarmDate < new Date()) {
            alarmDate.setDate(alarmDate.getDate() + 1);
          }
          
          const timeUntilAlarm = alarmDate.getTime() - new Date().getTime();
          
          // Register for alarm notification
          if ('wakeLock' in navigator || 'setAlarm' in window) {
            // Use wake lock API if available (not standard yet)
            console.log('Setting alarm with wake lock for', alarmDate);
          }
          
          // Fallback to setTimeout (won't work if app is closed)
          const alarmTimeout = setTimeout(() => {
            new Notification(`${alarmType === 'sehri' ? 'Sehri' : 'Iftar'} Time`, {
              body: `It's time for ${alarmType === 'sehri' ? 'Sehri' : 'Iftar'}!`,
              icon: '/favicon.ico',
            });
            
            // Play sound
            const audio = new Audio('/alarm-sound.mp3');
            audio.loop = true;
            audio.play().catch(error => {
              console.error('Error playing alarm sound:', error);
            });
            
            // Stop sound after 30 seconds if not manually stopped
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
            }, 30000);
            
          }, timeUntilAlarm);
          
          // Save alarm data to localStorage
          const alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
          alarms.push({
            id: Date.now(),
            type: alarmType,
            time: alarmTime,
            date: alarmDate.toISOString(),
            timeoutId: String(alarmTimeout),
          });
          localStorage.setItem('alarms', JSON.stringify(alarms));
          
          toast({
            title: `${alarmType === 'sehri' ? 'Sehri' : 'Iftar'} Alarm Set`,
            description: `Alarm will notify you at ${alarmTime}`,
          });
        } else {
          toast({
            title: "Permission Denied",
            description: "Notification permission is required to set alarms.",
            variant: "destructive",
          });
        }
      });
    } else {
      toast({
        title: "Not Supported",
        description: "Alarms require notification support, which your browser doesn't provide.",
        variant: "destructive",
      });
    }
    
    setShowAlarmDialog(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading Prayer Times</h2>
          <p className="text-muted-foreground mb-6">Please wait while we fetch the latest data...</p>
          <Progress value={50} className="w-64 h-2 mb-4" />
          <p className="text-sm text-muted-foreground">
            {loadingLocation ? 'Determining your location...' : `Location: ${locationName}`}
          </p>
        </div>
      </div>
    );
  }

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

      {/* Alarm Dialog */}
      <Dialog open={showAlarmDialog} onOpenChange={setShowAlarmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alarmType === 'sehri' ? 'Sehri' : 'Iftar'} Alarm</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Set alarm for {alarmType === 'sehri' ? 'Sehri' : 'Iftar'} at {alarmTime}?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your device must be on for the alarm to work. We recommend keeping the device plugged in.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAlarmDialog(false)}>Cancel</Button>
            <Button onClick={confirmSetAlarm}>Set Alarm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrayerTimesDashboard;

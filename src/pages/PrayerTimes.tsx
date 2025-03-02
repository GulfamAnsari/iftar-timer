
import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import { getCurrentLocation, getPrayerTimesForPeriod } from '@/utils/prayerTimes';

const PrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setIsLoading(true);
        const location = await getCurrentLocation();
        
        // Fetch location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch location data');
          }
          
          const data = await response.json();
          
          let locationName = '';
          
          if (data && data.address) {
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
            
            if (!locationName && data.display_name) {
              locationName = data.display_name.split(',')[0];
            }
          }
          
          setLocationName(locationName || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`);
        } catch (error) {
          console.error('Error getting location name:', error);
          setLocationName(`${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`);
        }
        
        const times = await getPrayerTimesForPeriod(location, 7);
        setPrayerTimes(times);
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        toast({
          title: "Error",
          description: "Failed to fetch prayer times. Please ensure location access is enabled.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [toast]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
            <h2 className="text-xl font-semibold">Loading Prayer Times</h2>
            <p className="text-muted-foreground mt-2">Please wait while we fetch the latest data</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Prayer Times</h1>
        {locationName && (
          <p className="text-muted-foreground mb-6">Location: {locationName}</p>
        )}
        
        <Tabs defaultValue="daily" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-6">
            {prayerTimes.length > 0 && (
              <Card className="glass-card overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">{prayerTimes[0].formattedDate}</h2>
                  <div className="space-y-4">
                    {prayerTimes[0].prayers.map((prayer: any, index: number) => (
                      <React.Fragment key={prayer.name}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                            <span className="font-medium">{prayer.name}</span>
                          </div>
                          <span className="text-lg">{prayer.time}</span>
                        </div>
                        {index < prayerTimes[0].prayers.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-6">
            {prayerTimes.map((day, dayIndex) => (
              <Card key={dayIndex} className="glass-card overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-3">{day.formattedDate}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {day.prayers.map((prayer: any) => (
                      <div key={prayer.name} className="flex justify-between">
                        <span className="text-muted-foreground">{prayer.name}</span>
                        <span>{prayer.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PrayerTimes;

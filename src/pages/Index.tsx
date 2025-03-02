
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlarmClock, Compass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import PrayerTimesDashboard from '@/components/prayer/PrayerTimesDashboard';

const Index = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <PrayerTimesDashboard />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/times">
            <Card className="glass-card overflow-hidden h-full transition-all hover:shadow-lg">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="p-3 rounded-full bg-secondary w-fit mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Prayer Times</h3>
                <p className="text-muted-foreground text-sm flex-grow">
                  View detailed prayer times for the entire week. Plan your schedule around the five daily prayers.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/alarms">
            <Card className="glass-card overflow-hidden h-full transition-all hover:shadow-lg">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="p-3 rounded-full bg-secondary w-fit mb-4">
                  <AlarmClock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Set Alarms</h3>
                <p className="text-muted-foreground text-sm flex-grow">
                  Never miss Sehri or Iftar again. Set up custom alarms with notifications for important prayer times.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/qibla">
            <Card className="glass-card overflow-hidden h-full transition-all hover:shadow-lg">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="p-3 rounded-full bg-secondary w-fit mb-4">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Qibla Direction</h3>
                <p className="text-muted-foreground text-sm flex-grow">
                  Find the direction of the Kaaba with our precision compass. Includes AR camera mode for visual guidance.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;

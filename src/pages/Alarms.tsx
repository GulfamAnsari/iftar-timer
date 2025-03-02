
import React, { useState } from 'react';
import { Bell, Plus, AlarmClock, Moon, Sun, Trash2, Volume2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import AppLayout from '@/components/layout/AppLayout';

interface Alarm {
  id: string;
  time: string;
  label: string;
  type: 'sehri' | 'iftar' | 'custom';
  active: boolean;
  days: string[];
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Alarms = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([
    {
      id: '1',
      time: '04:30',
      label: 'Sehri Time',
      type: 'sehri',
      active: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    {
      id: '2',
      time: '18:45',
      label: 'Iftar Time',
      type: 'iftar',
      active: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAlarm, setNewAlarm] = useState<Omit<Alarm, 'id'>>({
    time: '12:00',
    label: '',
    type: 'custom',
    active: true,
    days: [...days]
  });
  
  const { toast } = useToast();

  const handleToggleAlarm = (id: string) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, active: !alarm.active } : alarm
    ));
    
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      toast({
        title: alarm.active ? "Alarm Deactivated" : "Alarm Activated",
        description: `${alarm.label} is now ${alarm.active ? 'off' : 'on'}`,
      });
    }
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
    toast({
      title: "Alarm Deleted",
      description: "The alarm has been removed.",
    });
  };

  const handleAddAlarm = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlarms([...alarms, { ...newAlarm, id }]);
    setDialogOpen(false);
    
    toast({
      title: "Alarm Added",
      description: `${newAlarm.label || 'New alarm'} has been set.`,
    });
    
    // Reset new alarm form
    setNewAlarm({
      time: '12:00',
      label: '',
      type: 'custom',
      active: true,
      days: [...days]
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAlarm({ ...newAlarm, time: e.target.value });
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAlarm({ ...newAlarm, label: e.target.value });
  };

  const handleTypeChange = (type: 'sehri' | 'iftar' | 'custom') => {
    let label = newAlarm.label;
    if (type === 'sehri') label = 'Sehri Time';
    if (type === 'iftar') label = 'Iftar Time';
    
    setNewAlarm({ ...newAlarm, type, label });
  };

  const handleDayToggle = (day: string) => {
    const days = [...newAlarm.days];
    if (days.includes(day)) {
      setNewAlarm({ ...newAlarm, days: days.filter(d => d !== day) });
    } else {
      setNewAlarm({ ...newAlarm, days: [...days, day] });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sehri': return <Moon className="h-5 w-5" />;
      case 'iftar': return <Sun className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Alarms</h1>
          <Button 
            onClick={() => setDialogOpen(true)}
            className="rounded-full"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Alarm
          </Button>
        </div>

        {/* Alarm Cards */}
        <div className="space-y-4">
          {alarms.map(alarm => (
            <Card key={alarm.id} className={`glass-card overflow-hidden transition-all duration-300 ${!alarm.active ? 'opacity-70' : ''}`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full mr-4 ${alarm.active ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                      {getTypeIcon(alarm.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{alarm.label}</h3>
                      <p className="text-muted-foreground text-sm">
                        {alarm.days.length === 7 ? 'Every day' : alarm.days.join(', ')}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold">{alarm.time}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 px-5 py-3 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteAlarm(alarm.id)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center">
                  <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Switch 
                    checked={alarm.active} 
                    onCheckedChange={() => handleToggleAlarm(alarm.id)}
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {alarms.length === 0 && (
            <div className="text-center py-10">
              <AlarmClock className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No alarms set</h3>
              <p className="text-muted-foreground">Add an alarm to get notified for Sehri and Iftar times</p>
            </div>
          )}
        </div>

        {/* Add Alarm Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Alarm</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="flex justify-center">
                <input
                  type="time"
                  value={newAlarm.time}
                  onChange={handleTimeChange}
                  className="text-4xl font-semibold bg-transparent border-none text-center focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Alarm Label</label>
                <input
                  type="text"
                  placeholder="Label your alarm"
                  value={newAlarm.label}
                  onChange={handleLabelChange}
                  className="w-full p-2 rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Alarm Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={newAlarm.type === 'sehri' ? "default" : "outline"}
                    onClick={() => handleTypeChange('sehri')}
                    className="justify-start"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Sehri
                  </Button>
                  <Button 
                    variant={newAlarm.type === 'iftar' ? "default" : "outline"}
                    onClick={() => handleTypeChange('iftar')}
                    className="justify-start"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Iftar
                  </Button>
                  <Button 
                    variant={newAlarm.type === 'custom' ? "default" : "outline"}
                    onClick={() => handleTypeChange('custom')}
                    className="justify-start"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Custom
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium mb-2 block">Repeat</label>
                <div className="flex justify-between">
                  {days.map(day => (
                    <Button
                      key={day}
                      variant={newAlarm.days.includes(day) ? "default" : "outline"}
                      onClick={() => handleDayToggle(day)}
                      className="w-10 h-10 rounded-full p-0"
                      size="icon"
                    >
                      {day.charAt(0)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAlarm}>Save Alarm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Alarms;


import React, { useState, useEffect } from 'react';
import { Bell, Plus, AlarmClock, Moon, Sun, Trash2, Volume2, Music } from 'lucide-react';
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
import { ringtones, getDefaultRingtone, setDefaultRingtone, getRingtoneFile } from '@/data/ringtones';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Alarm {
  id: string;
  time: string;
  label: string;
  type: 'sehri' | 'iftar' | 'custom';
  active: boolean;
  days: string[];
  ringtone: string;
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Alarms = () => {
  // Get alarms from localStorage or use defaults
  const getInitialAlarms = (): Alarm[] => {
    const storedAlarms = localStorage.getItem('alarms');
    if (storedAlarms) {
      try {
        const parsed = JSON.parse(storedAlarms);
        // Ensure each alarm has a ringtone property
        return parsed.map((alarm: any) => ({
          ...alarm,
          ringtone: alarm.ringtone || getDefaultRingtone()
        }));
      } catch (e) {
        console.error('Error parsing stored alarms:', e);
      }
    }
    
    // Default alarms
    return [
      {
        id: '1',
        time: '04:30',
        label: 'Sehri Time',
        type: 'sehri',
        active: true,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        ringtone: getDefaultRingtone()
      },
      {
        id: '2',
        time: '18:45',
        label: 'Iftar Time',
        type: 'iftar',
        active: true,
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        ringtone: getDefaultRingtone()
      }
    ];
  };
  
  const [alarms, setAlarms] = useState<Alarm[]>(getInitialAlarms);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ringtoneDialogOpen, setRingtoneDialogOpen] = useState(false);
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [playingRingtoneId, setPlayingRingtoneId] = useState<string | null>(null);
  
  const [newAlarm, setNewAlarm] = useState<Omit<Alarm, 'id'>>({
    time: '12:00',
    label: '',
    type: 'custom',
    active: true,
    days: [...days],
    ringtone: getDefaultRingtone()
  });
  
  const { toast } = useToast();

  // Save alarms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
    };
  }, [activeAudio]);

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
      days: [...days],
      ringtone: getDefaultRingtone()
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

  const openRingtoneDialog = (alarmId: string) => {
    setSelectedAlarmId(alarmId);
    setRingtoneDialogOpen(true);
  };

  const handleRingtoneChange = (ringtoneId: string) => {
    // Update the alarm's ringtone
    if (selectedAlarmId) {
      setAlarms(alarms.map(alarm => 
        alarm.id === selectedAlarmId ? { ...alarm, ringtone: ringtoneId } : alarm
      ));
    } else {
      // If no alarm selected, we're updating the new alarm's ringtone
      setNewAlarm({ ...newAlarm, ringtone: ringtoneId });
    }
  };

  const playRingtone = (ringtoneId: string) => {
    // Stop any currently playing audio
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    
    // Play the selected ringtone
    const audioFile = getRingtoneFile(ringtoneId);
    const audio = new Audio(audioFile);
    audio.loop = false;
    audio.play().catch(error => {
      console.error('Error playing ringtone:', error);
      toast({
        title: "Playback Error",
        description: "Could not play the selected ringtone.",
        variant: "destructive"
      });
    });
    
    setActiveAudio(audio);
    setPlayingRingtoneId(ringtoneId);
    
    // Stop after 3 seconds
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      setPlayingRingtoneId(null);
    }, 3000);
  };

  const saveRingtone = () => {
    // If this was set as the default ringtone
    if (selectedAlarmId === 'default') {
      const alarm = alarms.find(a => a.id === selectedAlarmId);
      if (alarm) {
        setDefaultRingtone(alarm.ringtone);
      }
    }
    
    setRingtoneDialogOpen(false);
    toast({
      title: "Ringtone Updated",
      description: "Your alarm ringtone has been changed."
    });
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
            <Card 
              key={alarm.id} 
              className={`glass-card overflow-hidden transition-all duration-300 
                ${!alarm.active ? 'opacity-70' : ''} 
                ${alarm.active ? 'border-primary/50 shadow-md shadow-primary/10' : ''}
              `}
            >
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteAlarm(alarm.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openRingtoneDialog(alarm.id)}
                  >
                    <Music className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Switch 
                    checked={alarm.active} 
                    onCheckedChange={() => handleToggleAlarm(alarm.id)}
                  />
                </div>
              </CardFooter>
              {alarm.active && (
                <div className="h-1 bg-primary w-full" />
              )}
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
              
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Ringtone</label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setSelectedAlarmId(null) || setRingtoneDialogOpen(true)}
                  >
                    <Music className="h-3 w-3 mr-1" />
                    Change
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {ringtones.find(r => r.id === newAlarm.ringtone)?.name || "Default Alarm"}
                </p>
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

        {/* Ringtone Selection Dialog */}
        <Dialog open={ringtoneDialogOpen} onOpenChange={setRingtoneDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Ringtone</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <RadioGroup 
                value={selectedAlarmId 
                  ? (alarms.find(a => a.id === selectedAlarmId)?.ringtone || getDefaultRingtone())
                  : newAlarm.ringtone
                }
                onValueChange={handleRingtoneChange}
                className="space-y-2"
              >
                {ringtones.map(ringtone => (
                  <div 
                    key={ringtone.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border 
                    ${playingRingtoneId === ringtone.id ? 'border-primary bg-primary/10' : 'border-input'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={ringtone.id} id={`ringtone-${ringtone.id}`} />
                      <Label htmlFor={`ringtone-${ringtone.id}`} className="flex-grow cursor-pointer">
                        {ringtone.name}
                      </Label>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => playRingtone(ringtone.id)}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setRingtoneDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveRingtone}>Save Ringtone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Alarms;

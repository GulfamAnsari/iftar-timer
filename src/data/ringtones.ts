
export interface Ringtone {
  id: string;
  name: string;
  file: string;
}

export const ringtones: Ringtone[] = [
  {
    id: "default",
    name: "Default Alarm",
    file: "/alarm-sound.mp3"
  },
  {
    id: "adhan1",
    name: "Adhan - Classic",
    file: "/ringtones/adhan1.mp3"
  },
  {
    id: "adhan2",
    name: "Adhan - Makkah",
    file: "/ringtones/adhan2.mp3"
  },
  {
    id: "gentle",
    name: "Gentle Reminder",
    file: "/ringtones/gentle.mp3"
  },
  {
    id: "nature",
    name: "Nature Sounds",
    file: "/ringtones/nature.mp3"
  }
];

export const getDefaultRingtone = (): string => {
  const savedRingtone = localStorage.getItem('preferred-ringtone');
  return savedRingtone || "default";
};

export const setDefaultRingtone = (id: string): void => {
  localStorage.setItem('preferred-ringtone', id);
};

export const getRingtoneFile = (id: string): string => {
  const ringtone = ringtones.find(r => r.id === id);
  return ringtone ? ringtone.file : "/alarm-sound.mp3";
};

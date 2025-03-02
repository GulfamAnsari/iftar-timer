
import React, { useState, useEffect, useRef } from 'react';
import { Compass, Map as MapIcon, Camera, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { toast } from "@/components/ui/use-toast";
import AppLayout from '@/components/layout/AppLayout';
import { getCurrentLocation } from '@/utils/prayerTimes';

const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262
};

const Qibla = () => {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [activeTab, setActiveTab] = useState('compass');
  const compassRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const kaabaRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const calculateQiblaDirection = async () => {
      try {
        const position = await getCurrentLocation();
        
        // Calculate Qibla direction using the Haversine formula
        const lat1 = position.latitude * (Math.PI / 180);
        const lon1 = position.longitude * (Math.PI / 180);
        const lat2 = KAABA_COORDS.latitude * (Math.PI / 180);
        const lon2 = KAABA_COORDS.longitude * (Math.PI / 180);
        
        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        let qibla = Math.atan2(y, x) * (180 / Math.PI);
        qibla = (qibla + 360) % 360;
        
        setQiblaDirection(qibla);
      } catch (error) {
        console.error('Error calculating Qibla direction:', error);
        toast({
          title: "Error",
          description: "Could not calculate Qibla direction. Please check your location settings.",
          variant: "destructive"
        });
      }
    };
    
    calculateQiblaDirection();
  }, [toast]);

  useEffect(() => {
    let deviceOrientationHandler: any = null;
    
    const requestPermissions = async () => {
      setIsCalibrating(true);
      
      try {
        // For iOS 13+ devices
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            setHasPermission(true);
            initCompass();
          } else {
            setHasPermission(false);
            toast({
              title: "Permission Denied",
              description: "Compass requires device orientation access to function.",
              variant: "destructive"
            });
          }
        } else {
          // For other devices that don't need explicit permission
          setHasPermission(true);
          initCompass();
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
        toast({
          title: "Error",
          description: "Could not access device orientation. The compass may not work.",
          variant: "destructive"
        });
      } finally {
        setIsCalibrating(false);
      }
    };
    
    const initCompass = () => {
      deviceOrientationHandler = (event: DeviceOrientationEvent) => {
        // For devices that support deviceorientationabsolute
        if ((event as any).webkitCompassHeading) {
          // iOS compass heading (inverted)
          setCurrentHeading((event as any).webkitCompassHeading);
        } else if (event.alpha !== null) {
          // Android compass heading
          // The alpha value is in degrees in the range [0, 360]
          setCurrentHeading(360 - event.alpha);
        }
      };
      
      window.addEventListener('deviceorientation', deviceOrientationHandler);
    };
    
    requestPermissions();
    
    return () => {
      if (deviceOrientationHandler) {
        window.removeEventListener('deviceorientation', deviceOrientationHandler);
      }
    };
  }, [toast]);
  
  useEffect(() => {
    if (needleRef.current && qiblaDirection !== null) {
      const needleRotation = qiblaDirection - currentHeading;
      needleRef.current.style.transform = `rotate(${needleRotation}deg)`;
      
      if (kaabaRef.current) {
        kaabaRef.current.style.transform = `rotate(${needleRotation}deg)`;
      }
    }
    
    if (compassRef.current) {
      compassRef.current.style.transform = `rotate(${-currentHeading}deg)`;
    }
  }, [currentHeading, qiblaDirection]);

  const handleCalibrate = () => {
    setIsCalibrating(true);
    toast({
      title: "Calibrating Compass",
      description: "Please rotate your device in a figure-8 motion for better accuracy.",
    });
    
    setTimeout(() => {
      setIsCalibrating(false);
      toast({
        title: "Calibration Complete",
        description: "Your compass is now calibrated.",
      });
    }, 3000);
  };

  const handleRequestCameraAccess = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          const videoElement = document.getElementById('ar-camera') as HTMLVideoElement;
          if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play();
          }
          toast({
            title: "Camera Access Granted",
            description: "Point your camera around to see the Qibla direction overlay.",
          });
        })
        .catch(error => {
          console.error('Error accessing camera:', error);
          toast({
            title: "Camera Access Denied",
            description: "Please allow camera access to use the AR mode.",
            variant: "destructive"
          });
        });
    } else {
      toast({
        title: "Not Supported",
        description: "Your device doesn't support camera access required for AR mode.",
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Qibla Direction</h1>
        
        <Tabs defaultValue="compass" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="compass">Compass</TabsTrigger>
            <TabsTrigger value="camera">Camera AR</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compass" className="space-y-6">
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 mb-4">
                  {/* Compass Background */}
                  <div 
                    ref={compassRef}
                    className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out"
                  >
                    <div className="w-full h-full rounded-full border-2 border-border relative">
                      {/* Cardinal directions */}
                      {['N', 'E', 'S', 'W'].map((direction, index) => (
                        <div 
                          key={direction}
                          className="absolute font-bold text-lg"
                          style={{
                            top: direction === 'N' ? '10px' : direction === 'S' ? 'calc(100% - 30px)' : 'calc(50% - 10px)',
                            left: direction === 'W' ? '10px' : direction === 'E' ? 'calc(100% - 20px)' : 'calc(50% - 6px)',
                          }}
                        >
                          {direction}
                        </div>
                      ))}
                      
                      {/* Compass ticks */}
                      {Array.from({ length: 72 }).map((_, i) => {
                        const isMajor = i % 9 === 0;
                        const rotationDeg = i * 5;
                        return (
                          <div 
                            key={i}
                            className={`absolute top-0 left-1/2 -ml-0.5 w-1 bg-foreground origin-bottom ${isMajor ? 'h-3' : 'h-1.5'}`}
                            style={{ transform: `rotate(${rotationDeg}deg) translateY(2px)` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Qibla Needle */}
                  <div 
                    ref={needleRef}
                    className="absolute inset-0 flex justify-center pointer-events-none transition-transform duration-300 ease-out"
                  >
                    <div className="w-1 bg-primary" style={{ height: '50%' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-md" />
                    
                    {/* Kaaba Image at the end of the needle */}
                    <img 
                      ref={kaabaRef}
                      src="https://png.pngtree.com/png-vector/20220814/ourmid/pngtree-kaba-house-png-image_6104065.png" 
                      alt="Kaaba" 
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-12 h-12 object-contain"
                      onError={(e) => {
                        // If image fails to load, show a replacement
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <p className="text-xl font-semibold">
                    {qiblaDirection !== null
                      ? `${Math.round(qiblaDirection)}°`
                      : 'Calculating...'}
                  </p>
                  <p className="text-muted-foreground">Qibla Direction</p>
                </div>
                
                <Button 
                  onClick={handleCalibrate}
                  disabled={isCalibrating}
                  className="rounded-full"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  {isCalibrating ? 'Calibrating...' : 'Calibrate Compass'}
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-full bg-secondary text-foreground">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">How to use the Qibla Compass</h3>
                    <p className="text-muted-foreground text-sm">
                      Hold your device flat with the screen facing up. The Kaaba icon points toward the Kaaba in Mecca. For best results, calibrate your compass regularly and keep it away from magnetic objects.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="camera" className="space-y-6">
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
                  <video 
                    id="ar-camera" 
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                    muted
                  ></video>
                  
                  {qiblaDirection !== null && (
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ transform: `translate(-50%, -50%) rotate(${qiblaDirection - currentHeading}deg)` }}
                    >
                      <div className="relative">
                        <div className="w-1 h-32 bg-primary mx-auto"></div>
                        <img 
                          src="/kaba.png" 
                          alt="Kaaba" 
                          className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                        <div className="text-xs font-bold text-white bg-primary/70 px-2 py-1 rounded absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          Kaaba Direction
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'camera' && !document.getElementById('ar-camera')?.srcObject && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                      <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Camera-based Qibla Finder</h3>
                      <p className="text-muted-foreground max-w-md mx-auto text-center mb-6">
                        Use your camera to see the direction of Qibla with augmented reality.
                      </p>
                      <Button 
                        onClick={handleRequestCameraAccess}
                        className="rounded-full"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Access Camera
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-full bg-secondary text-foreground">
                    <MapIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">About AR Mode</h3>
                    <p className="text-muted-foreground text-sm">
                      The camera mode uses augmented reality to visually guide you toward the Qibla direction. Make sure you're in an open area with good lighting for the best experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Qibla;

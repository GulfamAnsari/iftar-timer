
import React, { useState } from 'react';
import { X, Download, Smartphone, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InstallGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Install App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install as App</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="android" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="ios">iOS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="android" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Open in Chrome</h3>
                  <p className="text-sm text-muted-foreground">Make sure you're using Chrome browser</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Tap the menu icon</h3>
                  <p className="text-sm text-muted-foreground">Open Chrome's menu (three dots at top-right)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Select "Add to Home screen"</h3>
                  <p className="text-sm text-muted-foreground">Tap "Install" when prompted</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ios" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Open in Safari</h3>
                  <p className="text-sm text-muted-foreground">This only works with Safari browser</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Tap the share icon</h3>
                  <p className="text-sm text-muted-foreground">Look for the share button at the bottom of Safari</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary rounded-full p-2">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Select "Add to Home Screen"</h3>
                  <p className="text-sm text-muted-foreground">Tap "Add" in the top right corner</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 flex items-start p-3 bg-muted/50 rounded-lg gap-3">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Installing as an app provides a better experience with full-screen mode and ensures alarms work reliably.
          </p>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallGuide;

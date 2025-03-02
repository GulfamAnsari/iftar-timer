
import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Moon, AlarmClock, Clock, Compass, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/times', icon: Clock, label: 'Prayer Times' },
  { path: '/alarms', icon: AlarmClock, label: 'Alarms' },
  { path: '/qibla', icon: Compass, label: 'Qibla' },
];

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handlePWAInstall = () => {
    toast({
      title: "Install App",
      description: "You can install this app on your home screen for a better experience.",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Moon className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-semibold tracking-tight">Iftar Timer</span>
          </Link>
          
          <button 
            onClick={toggleMenu} 
            className="lg:hidden p-2 rounded-full hover:bg-secondary transition-all-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-full flex items-center space-x-2 transition-all-200",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
            
            <button 
              onClick={handlePWAInstall}
              className="ml-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-all-200"
            >
              Install App
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-md animate-fade-in">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "p-4 rounded-lg flex items-center space-x-4 transition-all-200",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <item.icon size={24} />
                  <span className="text-lg">{item.label}</span>
                </Link>
              ))}
              
              <button 
                onClick={handlePWAInstall}
                className="mt-4 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-all-200 flex items-center justify-center"
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "py-3 flex flex-1 flex-col items-center justify-center transition-all-200",
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;

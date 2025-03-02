
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glass-card p-8 rounded-xl max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Page not found
          </p>
          
          <Button asChild className="rounded-full">
            <Link to="/">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;

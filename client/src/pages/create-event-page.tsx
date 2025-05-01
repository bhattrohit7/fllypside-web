import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import EventForm from "@/components/forms/event-form";

export default function CreateEventPage() {
  const [, navigate] = useLocation();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MobileMenu />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="page-container">
              <div className="page-header flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/events")}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold text-gray-900">Create New Event</h1>
              </div>
              
              <div className="page-content">
                <EventForm 
                  onSuccess={() => {
                    navigate("/events");
                  }}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

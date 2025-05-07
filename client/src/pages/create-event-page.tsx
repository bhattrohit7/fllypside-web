import { useLocation, useParams } from "wouter";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import EventForm from "@/components/forms/event-form";
import { useQuery } from "@tanstack/react-query";

export default function CreateEventPage() {
  const [, navigate] = useLocation();
  const params = useParams();
  const eventId = params?.id ? parseInt(params.id) : undefined;
  const isEditMode = !!eventId;

  // Fetch event data if in edit mode
  const { data: eventData, isLoading } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}`).then(res => res.json()),
    enabled: !!eventId
  });

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
                <h1 className="text-2xl font-semibold text-gray-900">
                  {isEditMode ? 'Edit Event' : 'Create New Event'}
                </h1>
              </div>
              
              <div className="page-content">
                {isEditMode && isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <EventForm 
                    onSuccess={() => {
                      navigate("/events");
                    }}
                    existingData={eventData}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCard from "@/components/event-card";
import { PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type EventTab = "upcoming" | "past" | "draft";

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<EventTab>("upcoming");
  const [, navigate] = useLocation();
  const { businessPartner } = useAuth();
  
  // Fetch events based on the active tab
  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events", activeTab],
    enabled: !!businessPartner,
  });

  return (
    <div className="h-screen flex flex-col">
      <MobileMenu />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="page-container">
              <div className="page-header flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
                <Button onClick={() => navigate("/events/create")}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                </Button>
              </div>
              
              <div className="page-content">
                <Tabs 
                  defaultValue="upcoming" 
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as EventTab)}
                  className="mb-6"
                >
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                        <Skeleton className="w-full h-48" />
                        <div className="px-4 py-5">
                          <Skeleton className="h-6 w-3/4 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4 mb-4" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event: any) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No events found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === "upcoming" ? "You don't have any upcoming events." : 
                       activeTab === "past" ? "You don't have any past events." : 
                       "You don't have any draft events."}
                    </p>
                    <div className="mt-6">
                      <Link href="/events/create">
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" /> Create Event
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

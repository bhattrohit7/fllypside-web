import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/event-card";
import { Calendar } from "lucide-react";

export default function OfferEventsPage() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const offerId = id ? parseInt(id) : undefined;

  // Fetch offer data
  const { data: offer, isLoading: isOfferLoading } = useQuery({
    queryKey: ['/api/offers', offerId],
    queryFn: ({ queryKey }) => fetch(`/api/offers/${queryKey[1]}`).then(res => res.json()),
    enabled: !!offerId,
  });

  // Fetch events linked to this offer
  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/offers', offerId, 'events'],
    queryFn: ({ queryKey }) => fetch(`/api/offers/${queryKey[1]}/events`).then(res => res.json()),
    enabled: !!offerId,
  });

  const isLoading = isOfferLoading || isEventsLoading;

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
                  onClick={() => navigate("/offers")}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {isOfferLoading ? (
                  <Skeleton className="h-8 w-48" />
                ) : (
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Events with "{offer?.text}" Offer
                  </h1>
                )}
              </div>
              
              <div className="page-content">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="h-40 bg-gray-200">
                          <Skeleton className="h-full w-full" />
                        </div>
                        <div className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
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
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <Calendar className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No events found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      There are no events linked to this promotional offer.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => navigate("/events/create")}>
                        Create an Event
                      </Button>
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
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  AlertTriangle,
  Ban,
  HelpCircle
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import EventAnalytics from "@/components/event-analytics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

// Helper function to get currency symbol
const getCurrencySymbol = (currency?: string): string => {
  switch (currency) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    case 'AUD':
      return 'A$';
    default:
      return '$';
  }
};

export default function EventDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const eventId = Number(id);

  const { data: event, isLoading } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}`).then(res => res.json()),
    enabled: !!eventId
  });
  
  const { data: participants, isLoading: isParticipantsLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'participants'],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}/participants`).then(res => res.json()),
    enabled: !!eventId
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      window.location.href = '/events';
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Link href="/events" className="flex items-center text-primary hover:text-primary/80 transition-colors mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to events</span>
          </Link>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-64 bg-gray-100">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          </div>
          
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold text-red-500">Event not found</h1>
        <p className="mt-2">The event you're looking for doesn't exist or has been removed.</p>
        <Link href="/events" className="mt-4 inline-block text-primary hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  // Default image for when a banner is not provided
  const defaultImage = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container py-8">
              <div className="flex items-center justify-between mb-6">
                <Link href="/events" className="flex items-center text-primary hover:text-primary/80 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Back to events</span>
                </Link>
                <div className="flex space-x-2">
                  <Link href={`/events/${eventId}/edit`}>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex items-center" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card className="overflow-hidden">
                    <div className="h-64 relative overflow-hidden">
                      <img 
                        className="w-full h-full object-cover" 
                        src={event.bannerImage || defaultImage} 
                        alt={event.name} 
                      />
                    </div>
                    <div className="p-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.name}</h1>
                      <p className="text-gray-600 whitespace-pre-line mb-6">{event.description}</p>
                      
                      <Separator className="my-6" />
                      
                      {event.price > 0 ? (
                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg px-4 py-3 inline-flex items-center shadow-sm">
                          <span className="text-green-800 font-semibold">
                            Price: {getCurrencySymbol(event.currency)}{event.price}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-3 inline-flex items-center shadow-sm">
                          <span className="text-blue-800 font-semibold">
                            Free event
                          </span>
                        </div>
                      )}

                      {/* Event Analytics */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Event Analytics</h3>
                        <EventAnalytics eventId={eventId} />
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div>
                  <Card className="p-6 shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-primary mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Date & Time</p>
                          <p className="text-gray-600">{formatDate(event.startDate)}</p>
                          {event.endDate && (
                            <p className="text-gray-600">
                              To: {formatDate(event.endDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Location</p>
                          <p className="text-gray-600">{event.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Users className="h-5 w-5 text-primary mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Participants</p>
                          <p className="text-gray-600">
                            {event.currentParticipants} / {event.maxParticipants} registered
                          </p>
                          {event.requireIdVerification && (
                            <p className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 mt-1 rounded inline-block">
                              ID Verification Required
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Participants section */}
                  <Card className="p-6 shadow-md mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Registered Participants</h3>
                      <div className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-2.5 py-0.5 rounded-full text-xs font-semibold">
                        {event.currentParticipants} Total
                      </div>
                    </div>
                    
                    {isParticipantsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : participants && participants.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {participants.map((participant: any) => (
                          <div key={participant.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base font-medium mr-3">
                              {participant.firstName?.charAt(0)}{participant.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{participant.firstName} {participant.lastName}</div>
                              <div className="text-sm text-gray-500">{participant.email || participant.phone}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No participants have registered yet</p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
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
  ArrowLeft, 
  AlertTriangle,
  Ban,
  HelpCircle,
  Share2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import EventAnalytics from "@/components/event-analytics";
import { ShareDialog } from "@/components/share-dialog";
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const { data: event, isLoading, refetch } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}`).then(res => res.json()),
    enabled: !!eventId
  });
  
  const { data: participants, isLoading: isParticipantsLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'participants'],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}/participants`).then(res => res.json()),
    enabled: !!eventId
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancellationReason.trim()) {
        throw new Error("Cancellation reason is required");
      }
      
      await apiRequest('POST', `/api/events/${eventId}/cancel`, { 
        reason: cancellationReason 
      });
    },
    onSuccess: () => {
      toast({
        title: "Event cancelled",
        description: "The event has been cancelled successfully. Participants will be notified.",
      });
      setCancelDialogOpen(false);
      setCancellationReason("");
      refetch(); // Refresh event data to show cancelled status
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  
  const handleCancelEvent = () => {
    setCancelDialogOpen(true);
  };
  
  // Check if event can be cancelled (created within the last 24 hours)
  const canCancel = () => {
    if (!event || event.status === 'cancelled') return false;
    
    const now = new Date();
    const creationTime = new Date(event.createdAt);
    const timeDifference = now.getTime() - creationTime.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    
    return hoursDifference <= 24;
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
                  {/* Event Status Badge */}
                  {event.status === 'cancelled' && (
                    <div className="bg-red-100 border border-red-200 text-red-800 px-3 py-1 rounded-md flex items-center">
                      <Ban className="h-4 w-4 mr-1" />
                      <span className="font-medium">Cancelled</span>
                    </div>
                  )}
                  
                  <Link href={`/events/${eventId}/edit`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center"
                      disabled={event.status === 'cancelled'}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  
                  {/* Share Button */}
                  <ShareDialog
                    title={event.name}
                    description={event.description}
                    url={window.location.href}
                    image={event.bannerImage || defaultImage}
                    trigger={
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Share2 className="h-4 w-4 mr-1" /> Share
                      </Button>
                    }
                  />
                  
                  {/* Cancel Button with Tooltip if needed */}
                  {event.status !== 'cancelled' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={handleCancelEvent}
                              disabled={!canCancel()}
                            >
                              <Ban className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!canCancel() && (
                          <TooltipContent className="max-w-xs">
                            <p>Events can only be cancelled within 24 hours of creation</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )}
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

      {/* Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Cancel Event
            </DialogTitle>
            <DialogDescription>
              This action will cancel the event "{event?.name}" and notify all participants.
              <div className="text-amber-600 font-medium mt-2 flex items-center">
                <HelpCircle className="h-4 w-4 mr-1" />
                <span>Please provide a reason for cancellation.</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 mb-5">
            <Textarea
              placeholder="Explain why this event is being cancelled..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending || !cancellationReason.trim()}
              className="flex items-center"
            >
              {cancelMutation.isPending ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-opacity-20 border-t-white rounded-full" />
                  Processing...
                </>
              ) : (
                <>Cancel Event</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
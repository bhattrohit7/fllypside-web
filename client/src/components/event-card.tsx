import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Edit, Ban } from "lucide-react";
import { Link } from "wouter";

interface EventCardProps {
  event: {
    id: number;
    name: string;
    bannerImage?: string;
    startDate: string;
    location: string;
    maxParticipants: number;
    currentParticipants: number;
    price: number;
    currency: string;
    status?: string;
    cancellationReason?: string;
    cancelledAt?: string;
  };
}

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

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  // Default image for when a banner is not provided
  const defaultImage = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

  const isCancelled = event.status === "cancelled";
  
  return (
    <Card className={`flex flex-col h-full overflow-hidden hover:translate-y-[-4px] transition-all duration-300 hover:shadow-xl card-gradient animate-fade-in ${isCancelled ? 'opacity-70' : ''}`}>
      {/* Fixed height image container with rounded top corners */}
      <div className="w-full h-48 relative overflow-hidden rounded-t-xl group">
        <img 
          className={`w-full h-full object-cover transform transition-transform duration-700 ${isCancelled ? 'grayscale' : 'group-hover:scale-110'}`} 
          src={event.bannerImage || defaultImage} 
          alt={event.name} 
        />
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent"></div>
        
        {/* Cancelled status overlay */}
        {isCancelled && (
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
            <div className="bg-red-600/90 text-white px-4 py-2 rounded-md flex items-center shadow-lg transform -rotate-12">
              <Ban className="h-5 w-5 mr-2" />
              <span className="font-bold uppercase tracking-wider">Cancelled</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Content section with flex-grow to fill available space */}
      <div className="px-5 py-5 flex-grow flex flex-col">
        {/* Event title with fixed height and ellipsis for overflow */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14 tracking-tight">
            {event.name}
          </h3>
          {isCancelled && (
            <Badge variant="destructive" className="ml-2 shrink-0">
              Cancelled
            </Badge>
          )}
        </div>
        
        {/* Details section */}
        <div className="space-y-3 flex-grow mt-2">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="flex-shrink-0 mr-2 h-4 w-4 text-primary/70" />
            <p className="truncate">{formatDate(event.startDate)}</p>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="flex-shrink-0 mr-2 h-4 w-4 text-primary/70" />
            <p className="truncate">{event.location}</p>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="flex-shrink-0 mr-2 h-4 w-4 text-primary/70" />
            <p className="truncate">
              {event.currentParticipants !== undefined ? event.currentParticipants : 0} / {event.maxParticipants} participants
            </p>
          </div>
          
          {/* Show cancellation reason if available */}
          {isCancelled && event.cancellationReason && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md mt-2">
              <p className="font-medium">Reason:</p> 
              <p className="italic">{event.cancellationReason}</p>
            </div>
          )}
        </div>
        
        {/* Footer section with actions - always at bottom */}
        <div className="mt-5 pt-3 flex items-center justify-between border-t border-gray-100">
          <Badge 
            variant="outline" 
            className={isCancelled 
              ? "bg-gray-100 text-gray-600 font-medium border-gray-300 py-1.5"
              : "bg-gradient-to-r from-green-50 to-green-100 text-green-800 font-medium border-green-200 shadow-sm py-1.5"
            }
          >
            {event.price > 0 ? `${getCurrencySymbol(event.currency)}${event.price}` : 'Free'}
          </Badge>
          <Link href={`/events/${event.id}`}>
            <Button variant="outline" size="sm" className="btn-outline group hover:shadow-lg">
              <Edit className="h-4 w-4 mr-1 group-hover:text-primary transition-colors duration-200" /> Manage
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

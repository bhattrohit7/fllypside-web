import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Edit } from "lucide-react";
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
  };
}

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

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:translate-y-[-4px] transition-all duration-300">
      {/* Fixed height image container with rounded top corners */}
      <div className="w-full h-48 relative overflow-hidden rounded-t-xl">
        <img 
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" 
          src={event.bannerImage || defaultImage} 
          alt={event.name} 
        />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent"></div>
      </div>
      
      {/* Content section with flex-grow to fill available space */}
      <div className="px-5 py-5 flex-grow flex flex-col">
        {/* Event title with fixed height and ellipsis for overflow */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 h-14 tracking-tight">
          {event.name}
        </h3>
        
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
            <p className="truncate">{event.currentParticipants} / {event.maxParticipants} participants</p>
          </div>
        </div>
        
        {/* Footer section with actions - always at bottom */}
        <div className="mt-5 pt-3 flex items-center justify-between border-t border-gray-100">
          <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-green-100 text-green-800 font-medium border-green-200 shadow-sm">
            {event.price > 0 ? `$${event.price}` : 'Free'}
          </Badge>
          <Link href={`/events/${event.id}`}>
            <Button variant="outline" size="sm" className="shadow-sm">
              <Edit className="h-4 w-4" /> Manage
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

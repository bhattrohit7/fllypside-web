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
    <Card className="flex flex-col h-full overflow-hidden shadow">
      {/* Fixed height image container */}
      <div className="w-full h-48">
        <img 
          className="w-full h-full object-cover" 
          src={event.bannerImage || defaultImage} 
          alt={event.name} 
        />
      </div>
      
      {/* Content section with flex-grow to fill available space */}
      <div className="px-4 py-5 flex-grow flex flex-col">
        {/* Event title with fixed height and ellipsis for overflow */}
        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 h-14">
          {event.name}
        </h3>
        
        {/* Details section */}
        <div className="space-y-2 flex-grow">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            <p className="truncate">{formatDate(event.startDate)}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            <p className="truncate">{event.location}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            <p className="truncate">{event.currentParticipants} / {event.maxParticipants} participants</p>
          </div>
        </div>
        
        {/* Footer section with actions - always at bottom */}
        <div className="mt-4 pt-2 flex items-center justify-between">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {event.price > 0 ? `$${event.price}` : 'Free'}
          </Badge>
          <Link href={`/events/${event.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" /> Manage
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

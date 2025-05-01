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
    <Card className="overflow-hidden shadow">
      <div className="relative pb-1/2">
        <img 
          className="absolute h-48 w-full object-cover" 
          src={event.bannerImage || defaultImage} 
          alt={event.name} 
        />
      </div>
      <div className="px-4 py-5">
        <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p>{formatDate(event.startDate)}</p>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p>{event.location}</p>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p>{event.currentParticipants} / {event.maxParticipants} participants</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
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

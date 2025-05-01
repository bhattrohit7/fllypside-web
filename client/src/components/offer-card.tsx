import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Edit, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";

interface OfferCardProps {
  offer: {
    id: number;
    text: string;
    percentage: number;
    startDate: string;
    expiryDate?: string;
    status: 'Active' | 'Expired';
    linkedEvents?: number;
  };
}

export default function OfferCard({ offer }: OfferCardProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No expiry";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden shadow border-l-4 border-secondary">
      <div className="px-4 py-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{offer.text.split(' ')[0]}</h3>
          <Badge variant={offer.status === 'Active' ? 'default' : 'secondary'} className={
            offer.status === 'Active' 
              ? 'bg-green-100 text-green-800 hover:bg-green-100'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
          }>
            {offer.status}
          </Badge>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p className="text-lg font-bold text-secondary">{offer.percentage}% OFF</p>
        </div>
        <p className="mt-2 text-sm text-gray-500">{offer.text}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Started:</span>
            <p className="font-medium">{formatDate(offer.startDate)}</p>
          </div>
          <div>
            <span className="text-gray-500">Expires:</span>
            <p className="font-medium">{formatDate(offer.expiryDate)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <LinkIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <p>
            {offer.linkedEvents 
              ? `Linked to ${offer.linkedEvents} event${offer.linkedEvents !== 1 ? 's' : ''}`
              : 'Not linked to any events'}
          </p>
        </div>
        <div className="mt-5 flex space-x-3">
          <Link href={`/offers/${offer.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Link href={`/offers/${offer.id}/events`}>
            <Button variant="outline" size="sm">
              <LinkIcon className="mr-1 h-4 w-4" /> View Events
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

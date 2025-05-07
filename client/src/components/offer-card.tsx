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
    <Card className="overflow-hidden border-l-4 border-secondary hover:translate-y-[-4px] transition-all duration-300">
      <div className="px-5 py-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{offer.text.split(' ')[0]}</h3>
          <Badge variant={offer.status === 'Active' ? 'default' : 'secondary'} className={
            offer.status === 'Active' 
              ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 font-medium border-green-200 shadow-sm'
              : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium border-gray-200 shadow-sm'
          }>
            {offer.status}
          </Badge>
        </div>
        
        <div className="mt-3 flex items-center text-sm">
          <div className="flex items-center p-1.5 bg-secondary/10 rounded-lg">
            <Tag className="flex-shrink-0 h-4 w-4 text-secondary" />
          </div>
          <p className="ml-2 text-xl font-bold bg-gradient-to-br from-secondary to-secondary/80 bg-clip-text text-transparent">
            {offer.percentage}% OFF
          </p>
        </div>
        
        <p className="mt-3 text-sm text-gray-600">{offer.text}</p>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
          <div>
            <span className="text-gray-500 text-xs">Started:</span>
            <p className="font-medium text-gray-800">{formatDate(offer.startDate)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Expires:</span>
            <p className="font-medium text-gray-800">{formatDate(offer.expiryDate)}</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
          <LinkIcon className="flex-shrink-0 mr-2 h-4 w-4 text-primary/70" />
          <p>
            {offer.linkedEvents 
              ? `Linked to ${offer.linkedEvents} event${offer.linkedEvents !== 1 ? 's' : ''}`
              : 'Not linked to any events'}
          </p>
        </div>
        
        <div className="mt-5 pt-3 flex space-x-3 border-t border-gray-100">
          <Link href={`/offers/${offer.id}/edit`}>
            <Button variant="outline" size="sm" className="shadow-sm">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </Link>
          <Link href={`/offers/${offer.id}/events`}>
            <Button variant="outline" size="sm" className="shadow-sm">
              <LinkIcon className="h-4 w-4" /> View Events
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

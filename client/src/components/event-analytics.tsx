import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, Target, Map, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth';

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

interface EventAnalyticsProps {
  eventId: number;
}

const EventAnalytics: React.FC<EventAnalyticsProps> = ({ eventId }) => {
  const { businessPartner } = useAuth();
  
  const { data: eventAnalytics, isLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'analytics'],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}/analytics`).then(res => res.json()),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Event Performance</h3>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eventAnalytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500 py-8">
            <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Analytics data is not available for this event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Event Performance</h3>
          <span className="text-xs text-gray-500 flex items-center">
            <span className="animate-bounce inline-block mr-1">↓</span> Scroll for more
          </span>
        </div>
        
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scroll-smooth">
          {/* Attendance Rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium">Attendance Rate</span>
              </div>
              <span className="text-sm font-bold">{eventAnalytics.attendanceRate || 0}%</span>
            </div>
            <Progress value={eventAnalytics.attendanceRate || 0} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {eventAnalytics.attendedParticipants || 0} out of {eventAnalytics.totalParticipants || 0} participants attended
            </p>
          </div>
          
          {/* Registration Completion */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm font-medium">Registration Goal</span>
              </div>
              <span className="text-sm font-bold">{eventAnalytics.registrationRate || 0}%</span>
            </div>
            <Progress value={eventAnalytics.registrationRate || 0} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {eventAnalytics.totalParticipants || 0} out of {eventAnalytics.maxParticipants || 0} maximum capacity
            </p>
          </div>
          
          {/* Revenue Analysis */}
          {eventAnalytics.isPaidEvent && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <span className="text-sm font-bold">
                  {getCurrencySymbol(businessPartner?.preferredCurrency || 'USD')}{eventAnalytics.totalRevenue || 0}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Average per participant: {getCurrencySymbol(businessPartner?.preferredCurrency || 'USD')}{eventAnalytics.averageRevenue || 0}</span>
                <span>{eventAnalytics.totalParticipants || 0} paying participants</span>
              </div>
            </div>
          )}
          
          {/* Demographics */}
          {eventAnalytics.demographics && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Map className="h-4 w-4 mr-2 text-indigo-500" />
                Participant Demographics
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(eventAnalytics.demographics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-md p-2">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm font-medium">{String(value)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Engagement Stats */}
          {eventAnalytics.engagement && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                Engagement
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(eventAnalytics.engagement).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-md p-2 text-center">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventAnalytics;
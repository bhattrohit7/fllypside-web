import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// Import base Progress component
import { Progress as BaseProgress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Create a custom Progress component that correctly displays 0%
const Progress = React.forwardRef<
  React.ElementRef<typeof BaseProgress>,
  React.ComponentPropsWithoutRef<typeof BaseProgress>
>(({ className, value, ...props }, ref) => {
  // Ensure the value is between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value || 0));
  
  return (
    <BaseProgress
      ref={ref}
      className={cn(className, clampedValue === 0 ? "bg-gray-100" : "")}
      // For 0% display empty bar (value of 0)
      value={clampedValue}
      {...props}
    />
  );
});
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
  
  // Also fetch the event to get its currency
  const { data: event } = useQuery({
    queryKey: ['/api/events', eventId],
    queryFn: ({ queryKey }) => fetch(`/api/events/${queryKey[1]}`).then(res => res.json()),
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
    <Card className="card-gradient shadow-lg border-0">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">Event Performance</h3>
          <span className="text-xs text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded-full shadow-sm">
            <span className="animate-bounce inline-block mr-1">↓</span> Scroll for more
          </span>
        </div>
        
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scroll-smooth">
          {/* Attendance Rate */}
          <div className="bg-white/60 p-3 rounded-lg shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="bg-blue-100 p-1.5 rounded-md mr-2">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Attendance Rate</span>
              </div>
              <span className="text-sm font-bold bg-blue-50 px-2 py-1 rounded-full">{eventAnalytics.attendanceRate || 0}%</span>
            </div>
            <Progress value={eventAnalytics.attendanceRate || 0} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {eventAnalytics.attendedParticipants || 0} out of {eventAnalytics.totalParticipants || 0} participants attended
            </p>
          </div>
          
          {/* Registration Completion */}
          <div className="bg-white/60 p-3 rounded-lg shadow-sm animate-fade-in stagger-1">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="bg-green-100 p-1.5 rounded-md mr-2">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm font-medium">Registration Goal</span>
              </div>
              <span className="text-sm font-bold bg-green-50 px-2 py-1 rounded-full">{eventAnalytics.registrationRate || 0}%</span>
            </div>
            <Progress value={eventAnalytics.registrationRate || 0} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {eventAnalytics.totalParticipants || 0} out of {eventAnalytics.maxParticipants || 0} maximum capacity
            </p>
          </div>
          
          {/* Revenue Analysis */}
          {eventAnalytics.isPaidEvent && (
            <div className="bg-white/60 p-3 rounded-lg shadow-sm animate-fade-in stagger-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-1.5 rounded-md mr-2">
                    <DollarSign className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <span className="text-sm font-bold bg-yellow-50 px-2 py-1 rounded-full">
                  {getCurrencySymbol(event?.currency || 'USD')}{eventAnalytics.totalRevenue || 0}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs p-2 bg-gray-50/60 rounded-md">
                <span>Average per participant: <span className="font-medium">{getCurrencySymbol(event?.currency || 'USD')}{eventAnalytics.averageRevenue || 0}</span></span>
                <span className="bg-primary/10 px-2 py-1 rounded-full text-primary font-medium">{eventAnalytics.totalParticipants || 0} paying participants</span>
              </div>
            </div>
          )}
          
          {/* Demographics */}
          {eventAnalytics.demographics && (
            <div className="bg-white/60 p-3 rounded-lg shadow-sm animate-fade-in stagger-3">
              <div className="flex items-center mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-md mr-2">
                  <Map className="h-4 w-4 text-indigo-500" />
                </div>
                <h4 className="text-sm font-medium">Participant Demographics</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(eventAnalytics.demographics).map(([key, value], index) => (
                  <div key={key} className="bg-gray-50/60 rounded-md p-2 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm font-medium">{String(value)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Engagement Stats */}
          {eventAnalytics.engagement && (
            <div className="bg-white/60 p-3 rounded-lg shadow-sm animate-fade-in stagger-4">
              <div className="flex items-center mb-3">
                <div className="bg-pink-100 p-1.5 rounded-md mr-2">
                  <Calendar className="h-4 w-4 text-pink-500" />
                </div>
                <h4 className="text-sm font-medium">Engagement Metrics</h4>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(eventAnalytics.engagement).map(([key, value], index) => (
                  <div key={key} className="bg-gray-50/60 rounded-md p-2 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="text-sm font-medium text-pink-600">{String(value)}</div>
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
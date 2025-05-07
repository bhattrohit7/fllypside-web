import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from "recharts";
import { 
  Users, CalendarCheck, Tag, DollarSign, 
  ArrowUp, Calendar, MapPin, Clock, Check 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

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

// Sample chart colors
const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function AnalyticsPage() {
  const { businessPartner } = useAuth();
  
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: !!businessPartner,
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MobileMenu />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="page-container">
              <div className="page-header">
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              </div>
              
              <div className="page-content">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {isLoading ? (
                    Array(4).fill(0).map((_, index) => (
                      <Card key={index}>
                        <CardContent className="px-4 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 rounded-md p-3 bg-gray-200">
                              <Skeleton className="h-5 w-5" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-6 w-16" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-2 w-full mt-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <>
                      <Card>
                        <CardContent className="px-4 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-primary rounded-md p-3">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Total Participants
                              </p>
                              <p className="text-lg font-medium text-gray-900">
                                {analyticsData?.participants?.total || 0}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <Badge className="bg-blue-100 text-blue-600 border-blue-200">
                                  Growth
                                </Badge>
                                <p className="text-xs font-semibold text-blue-600">
                                  <ArrowUp className="h-3 w-3 inline mr-1" />
                                  {analyticsData?.participants?.growth || 0}% from last month
                                </p>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                                <div 
                                  style={{ width: `${analyticsData?.participants?.growth || 0}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="px-4 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                              <CalendarCheck className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Events Completed
                              </p>
                              <p className="text-lg font-medium text-gray-900">
                                {analyticsData?.events?.completed || 0}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <Badge className="bg-green-100 text-green-600 border-green-200">
                                  Growth
                                </Badge>
                                <p className="text-xs font-semibold text-green-600">
                                  <ArrowUp className="h-3 w-3 inline mr-1" />
                                  {analyticsData?.events?.growth || 0}% from last month
                                </p>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                                <div 
                                  style={{ width: `${analyticsData?.events?.growth || 0}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="px-4 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-accent rounded-md p-3">
                              <Tag className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Offer Redemptions
                              </p>
                              <p className="text-lg font-medium text-gray-900">
                                {analyticsData?.offers?.redemptions || 0}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <Badge className="bg-purple-100 text-purple-600 border-purple-200">
                                  Growth
                                </Badge>
                                <p className="text-xs font-semibold text-purple-600">
                                  <ArrowUp className="h-3 w-3 inline mr-1" />
                                  {analyticsData?.offers?.growth || 0}% from last month
                                </p>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-200">
                                <div 
                                  style={{ width: `${analyticsData?.offers?.growth || 0}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="px-4 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                              <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Total Revenue
                              </p>
                              <p className="text-lg font-medium text-gray-900">
                                {getCurrencySymbol(businessPartner?.preferredCurrency || 'USD')}{analyticsData?.revenue?.total || 0}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="relative pt-1">
                              <div className="flex mb-2 items-center justify-between">
                                <Badge className="bg-yellow-100 text-yellow-600 border-yellow-200">
                                  Growth
                                </Badge>
                                <p className="text-xs font-semibold text-yellow-600">
                                  <ArrowUp className="h-3 w-3 inline mr-1" />
                                  {analyticsData?.revenue?.growth || 0}% from last month
                                </p>
                              </div>
                              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
                                <div 
                                  style={{ width: `${analyticsData?.revenue?.growth || 0}%` }} 
                                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                                ></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
                
                {/* Charts Section */}
                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Participant Trends */}
                  <Card>
                    <CardContent className="px-4 py-5">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Participant Trends</h3>
                      {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : analyticsData?.charts?.participantTrends ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={analyticsData.charts.participantTrends}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="participants" 
                                stroke="#3B82F6" 
                                activeDot={{ r: 8 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center text-gray-500">
                          <p className="text-sm">No data available for participant trends</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Event Performance */}
                  <Card>
                    <CardContent className="px-4 py-5">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Event Attendance</h3>
                      {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Skeleton className="h-full w-full" />
                        </div>
                      ) : analyticsData?.charts?.eventAttendance ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={analyticsData.charts.eventAttendance}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="event" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="capacity" fill="#8884d8" />
                              <Bar dataKey="attended" fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center text-gray-500">
                          <p className="text-sm">No data available for event attendance</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Top Performing Events */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Events</h3>
                  <Card>
                    <ul role="list" className="divide-y divide-gray-200">
                      {isLoading ? (
                        Array(3).fill(0).map((_, index) => (
                          <li key={index} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between mb-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-5 w-24" />
                            </div>
                            <div className="sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <Skeleton className="h-4 w-28 mr-6" />
                                <Skeleton className="h-4 w-28" />
                              </div>
                              <Skeleton className="h-4 w-28 mt-2 sm:mt-0" />
                            </div>
                          </li>
                        ))
                      ) : analyticsData?.topEvents && analyticsData.topEvents.length > 0 ? (
                        analyticsData.topEvents.map((event: any, idx: number) => (
                          <li key={idx}>
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-primary truncate">
                                  {event.name}
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <Badge className="bg-green-100 text-green-800">
                                    {event.attendanceRate}% attendance
                                  </Badge>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                    {event.date}
                                  </p>
                                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                    <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                    {event.participants} participants
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  <p>
                                    {getCurrencySymbol(businessPartner?.preferredCurrency || 'USD')}{event.revenue} revenue
                                  </p>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-6 text-center text-gray-500">
                          No event data available yet.
                        </li>
                      )}
                    </ul>
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

import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, Tag, Users, Activity, Edit } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, businessPartner } = useAuth();
  
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !!businessPartner,
  });

  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!businessPartner,
  });
  
  // Helper function to render loading skeleton stats
  const renderStatsSkeleton = () => {
    return Array(3).fill(0).map((_, i) => (
      <Card key={i}>
        <CardContent className="px-4 py-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary rounded-md p-3">
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <Skeleton className="h-5 w-16 mb-1" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-4">
          <Skeleton className="h-4 w-32" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MobileMenu />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="page-container">
              <div className="page-header">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              
              <div className="page-content">
                {/* Welcome card */}
                <Card className="mb-6 border-l-4 border-primary">
                  <CardContent className="px-5 py-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Welcome, {businessPartner?.firstName || user?.username}!
                    </h2>
                    <p className="text-sm text-gray-600">
                      Manage your business profile, create events, and track performance all in one place.
                    </p>
                  </CardContent>
                </Card>
                
                {/* Stats cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {isStatsLoading ? (
                    renderStatsSkeleton()
                  ) : (
                    <>
                      {/* Total events */}
                      <Card className="stats-card overflow-hidden">
                        <CardContent className="px-5 py-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-3 shadow-md">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Total Events
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {stats?.totalEvents || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 px-5 py-4 rounded-b-xl border-t border-gray-100">
                          <Link href="/events" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200">
                            View all events <span aria-hidden="true" className="ml-1 transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                          </Link>
                        </CardFooter>
                      </Card>
                      
                      {/* Active offers */}
                      <Card className="stats-card overflow-hidden">
                        <CardContent className="px-5 py-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl p-3 shadow-md">
                              <Tag className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Active Offers
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {stats?.activeOffers || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 px-5 py-4 rounded-b-xl border-t border-gray-100">
                          <Link href="/offers" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200">
                            View all offers <span aria-hidden="true" className="ml-1 transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                          </Link>
                        </CardFooter>
                      </Card>
                      
                      {/* Total participants */}
                      <Card className="stats-card overflow-hidden">
                        <CardContent className="px-5 py-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-gradient-to-br from-accent to-accent/80 rounded-xl p-3 shadow-md">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <p className="text-sm font-medium text-gray-500 truncate">
                                Total Participants
                              </p>
                              <p className="text-2xl font-semibold text-gray-900 mt-1">
                                {stats?.totalParticipants || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 px-5 py-4 rounded-b-xl border-t border-gray-100">
                          <Link href="/analytics" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200">
                            View analytics <span aria-hidden="true" className="ml-1 transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                          </Link>
                        </CardFooter>
                      </Card>
                    </>
                  )}
                </div>
                
                {/* Recent Activity */}
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                  
                  <Card>
                    <ul role="list" className="divide-y divide-gray-200">
                      {isActivitiesLoading ? (
                        Array(3).fill(0).map((_, i) => (
                          <li key={i} className="px-4 py-4">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                            <div className="mt-2 flex justify-between">
                              <div className="flex">
                                <Skeleton className="h-4 w-24 mr-6" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </li>
                        ))
                      ) : activities && activities.length > 0 ? (
                        activities.map((activity: any, index: number) => (
                          <li key={index}>
                            <Link href={activity.link || "#"} className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-primary truncate">
                                    {activity.title}
                                  </p>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                      ${activity.status === 'Upcoming' ? 'bg-green-100 text-green-800' : 
                                        activity.status === 'Offer Active' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-gray-100 text-gray-800'}`}>
                                      {activity.status}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      {activity.type === 'event' ? (
                                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      ) : (
                                        <Tag className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      )}
                                      {activity.primaryInfo}
                                    </p>
                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                      {activity.type === 'event' ? (
                                        <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      ) : (
                                        <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      )}
                                      {activity.secondaryInfo}
                                    </p>
                                  </div>
                                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                    <p>{activity.timeInfo}</p>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-6 text-center text-gray-500">
                          No recent activity to display.
                        </li>
                      )}
                    </ul>
                  </Card>
                </div>
                
                {/* Quick actions */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href="/events/create" className="block">
                      <div className="card relative group px-6 py-6 flex items-center space-x-4 hover:border-primary/20 transition-all duration-300">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="absolute inset-0" aria-hidden="true"></span>
                          <p className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                            Create Event
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Set up a new event for your customers
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link href="/offers/create" className="block">
                      <div className="card relative group px-6 py-6 flex items-center space-x-4 hover:border-secondary/20 transition-all duration-300">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <Tag className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="absolute inset-0" aria-hidden="true"></span>
                          <p className="text-base font-semibold text-gray-900 group-hover:text-secondary transition-colors duration-200">
                            Create Offer
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Set up a promotional discount
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    <Link href="/profile" className="block">
                      <div className="card relative group px-6 py-6 flex items-center space-x-4 hover:border-accent/20 transition-all duration-300">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          <Edit className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="absolute inset-0" aria-hidden="true"></span>
                          <p className="text-base font-semibold text-gray-900 group-hover:text-accent transition-colors duration-200">
                            Edit Profile
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Update your business information
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

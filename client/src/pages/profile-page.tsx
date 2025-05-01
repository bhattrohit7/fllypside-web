import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, CheckCircle } from "lucide-react";
import ProfileForm from "@/components/forms/profile-form";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, businessPartner } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
                <h1 className="text-2xl font-semibold text-gray-900">Business Profile</h1>
              </div>
              
              <div className="page-content">
                <Card>
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Partner Information</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal and business details.</p>
                    </div>
                    <Button 
                      onClick={() => setIsEditing(!isEditing)} 
                      variant={isEditing ? "outline" : "default"}
                    >
                      {isEditing ? (
                        "Cancel"
                      ) : (
                        <>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <div className="border-t border-gray-200">
                      <ProfileForm 
                        onCancel={() => setIsEditing(false)} 
                        onSuccess={() => setIsEditing(false)}
                        existingData={profile}
                      />
                    </div>
                  ) : (
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Full name</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.firstName && profile?.lastName ? (
                              `${profile.firstName} ${profile.lastName}`
                            ) : (
                              "Not provided"
                            )}
                          </dd>
                        </div>
                        
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Contact number</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.contactNumber || "Not provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Email address</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : user?.email || "Not provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Gender</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-20" />
                            ) : profile?.sex || "Not provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.dob ? formatDate(profile.dob) : "Not provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">ID number</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-40" />
                            ) : (
                              <div className="flex items-center">
                                <span>{profile?.idNumber || "Not provided"}</span>
                                {profile?.idVerified && (
                                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                  </Badge>
                                )}
                              </div>
                            )}
                          </dd>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Business status</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.isBusiness ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                Registered Business
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                Individual
                              </Badge>
                            )}
                          </dd>
                        </div>
                        
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Current city</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.currentCity || "Not provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Relationship status</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.relationshipStatus || "Not provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Looking for</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <Skeleton className="h-5 w-32" />
                            ) : profile?.lookingFor === "serious" ? (
                              "Business partnerships (Serious)"
                            ) : profile?.lookingFor === "fun" ? (
                              "Networking (Fun)"
                            ) : (
                              "Not specified"
                            )}
                          </dd>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Interests</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <div className="flex flex-wrap gap-2">
                                {[1, 2, 3].map(i => (
                                  <Skeleton key={i} className="h-6 w-20" />
                                ))}
                              </div>
                            ) : profile?.interests && profile.interests.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-gray-100 text-gray-800">
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "No interests specified"
                            )}
                          </dd>
                        </div>
                        
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">About</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                              </>
                            ) : profile?.info || "No information provided"}
                          </dd>
                        </div>
                        
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Social info</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isLoading ? (
                              <>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                              </>
                            ) : profile?.socialInfo || "No social information provided"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

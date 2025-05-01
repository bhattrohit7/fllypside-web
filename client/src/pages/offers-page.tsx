import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OfferCard from "@/components/offer-card";
import { PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type OfferTab = "active" | "expired";

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState<OfferTab>("active");
  const [, navigate] = useLocation();
  const { businessPartner } = useAuth();
  
  // Fetch offers based on the active tab
  const { data: offers, isLoading } = useQuery({
    queryKey: ["/api/offers", activeTab],
    enabled: !!businessPartner,
  });

  return (
    <div className="h-screen flex flex-col">
      <MobileMenu />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="page-container">
              <div className="page-header flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Promotional Offers</h1>
                <Button onClick={() => navigate("/offers/create")}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Offer
                </Button>
              </div>
              
              <div className="page-content">
                <Tabs 
                  defaultValue="active" 
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as OfferTab)}
                  className="mb-6"
                >
                  <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="expired">Expired</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-secondary">
                        <div className="px-4 py-5">
                          <div className="flex justify-between items-start">
                            <Skeleton className="h-6 w-1/3 mb-2" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                          <Skeleton className="h-8 w-20 my-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <Skeleton className="h-4 w-full mb-1" />
                              <Skeleton className="h-5 w-1/2" />
                            </div>
                            <div>
                              <Skeleton className="h-4 w-full mb-1" />
                              <Skeleton className="h-5 w-1/2" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-2/3 mb-4" />
                          <div className="flex space-x-3">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : offers && offers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {offers.map((offer: any) => (
                      <OfferCard key={offer.id} offer={offer} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No offers found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === "active" ? "You don't have any active offers." : "You don't have any expired offers."}
                    </p>
                    <div className="mt-6">
                      <Link href="/offers/create">
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" /> Create Offer
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

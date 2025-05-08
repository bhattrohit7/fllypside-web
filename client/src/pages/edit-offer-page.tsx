import { useLocation, useParams } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import OfferForm from "@/components/forms/offer-form";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditOfferPage() {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const offerId = id ? parseInt(id) : undefined;

  // Fetch offer data
  const { data: offer, isLoading } = useQuery({
    queryKey: ['/api/offers', offerId],
    queryFn: ({ queryKey }) => fetch(`/api/offers/${queryKey[1]}`).then(res => res.json()),
    enabled: !!offerId,
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MobileMenu />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="page-container">
              <div className="page-header flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/offers")}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold text-gray-900">Edit Offer</h1>
              </div>
              
              <div className="page-content">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : offer ? (
                  <OfferForm 
                    existingData={offer}
                    onSuccess={() => {
                      navigate("/offers");
                    }}
                  />
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Offer not found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      The offer you're looking for doesn't exist or has been removed.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => navigate("/offers")}>
                        Back to Offers
                      </Button>
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
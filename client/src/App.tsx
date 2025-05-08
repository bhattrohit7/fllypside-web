import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import EventsPage from "@/pages/events-page";
import CreateEventPage from "@/pages/create-event-page";
import EventDetailPage from "@/pages/event-detail-page";
import OffersPage from "@/pages/offers-page";
import CreateOfferPage from "@/pages/create-offer-page";
import EditOfferPage from "@/pages/edit-offer-page";
import OfferEventsPage from "@/pages/offer-events-page";
import AnalyticsPage from "@/pages/analytics-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./lib/auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/events" component={EventsPage} />
      <ProtectedRoute path="/events/create" component={CreateEventPage} />
      <ProtectedRoute path="/events/:id/edit" component={CreateEventPage} />
      <ProtectedRoute path="/events/:id" component={EventDetailPage} />
      <ProtectedRoute path="/offers" component={OffersPage} />
      <ProtectedRoute path="/offers/create" component={CreateOfferPage} />
      <ProtectedRoute path="/offers/:id/edit" component={EditOfferPage} />
      <ProtectedRoute path="/offers/:id/events" component={OfferEventsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

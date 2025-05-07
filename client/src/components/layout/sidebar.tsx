import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  Calendar, 
  Tag, 
  LineChart, 
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, businessPartner, logoutMutation } = useAuth();
  
  const getInitials = () => {
    if (businessPartner?.firstName && businessPartner?.lastName) {
      return `${businessPartner.firstName[0]}${businessPartner.lastName[0]}`;
    }
    return user?.username?.substring(0, 2).toUpperCase() || "U";
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="sidebar flex flex-col h-0 flex-1">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900 shadow-md">
            <span className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Flypside</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-3 py-6 space-y-2">
              <Link href="/">
                <div className={`sidebar-link ${location === '/' ? 'active' : ''}`}>
                  <Home className="h-5 w-5" />
                  Dashboard
                </div>
              </Link>
              
              <Link href="/profile">
                <div className={`sidebar-link ${location === '/profile' ? 'active' : ''}`}>
                  <User className="h-5 w-5" />
                  Profile
                </div>
              </Link>
              
              <Link href="/events">
                <div className={`sidebar-link ${location.startsWith('/events') ? 'active' : ''}`}>
                  <Calendar className="h-5 w-5" />
                  Events
                </div>
              </Link>
              
              <Link href="/offers">
                <div className={`sidebar-link ${location.startsWith('/offers') ? 'active' : ''}`}>
                  <Tag className="h-5 w-5" />
                  Offers
                </div>
              </Link>
              
              <Link href="/analytics">
                <div className={`sidebar-link ${location === '/analytics' ? 'active' : ''}`}>
                  <LineChart className="h-5 w-5" />
                  Analytics
                </div>
              </Link>
            </nav>
          </div>
          <div className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
            <div className="flex items-center">
              <Avatar className="border-2 border-primary/30 shadow-md hover:shadow-lg transition-shadow duration-200">
                <AvatarImage src="" alt={user?.username ?? "User"} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {businessPartner?.firstName ? `${businessPartner.firstName} ${businessPartner.lastName}` : user?.username}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs font-medium text-gray-300 hover:text-white p-0 transition-colors duration-200"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-3 w-3 mr-1" /> Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

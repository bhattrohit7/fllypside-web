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
        <div className="flex flex-col h-0 flex-1 bg-sidebar-background">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <span className="text-xl font-semibold text-white">Flypside</span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              <Link href="/">
                <a className={`sidebar-link ${location === '/' ? 'active' : ''}`}>
                  <Home className="mr-3 h-5 w-5" />
                  Dashboard
                </a>
              </Link>
              
              <Link href="/profile">
                <a className={`sidebar-link ${location === '/profile' ? 'active' : ''}`}>
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </a>
              </Link>
              
              <Link href="/events">
                <a className={`sidebar-link ${location.startsWith('/events') ? 'active' : ''}`}>
                  <Calendar className="mr-3 h-5 w-5" />
                  Events
                </a>
              </Link>
              
              <Link href="/offers">
                <a className={`sidebar-link ${location.startsWith('/offers') ? 'active' : ''}`}>
                  <Tag className="mr-3 h-5 w-5" />
                  Offers
                </a>
              </Link>
              
              <Link href="/analytics">
                <a className={`sidebar-link ${location === '/analytics' ? 'active' : ''}`}>
                  <LineChart className="mr-3 h-5 w-5" />
                  Analytics
                </a>
              </Link>
            </nav>
          </div>
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src="" alt={user?.username ?? "User"} />
                <AvatarFallback className="bg-primary text-white">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">
                  {businessPartner?.firstName ? `${businessPartner.firstName} ${businessPartner.lastName}` : user?.username}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs font-medium text-gray-300 hover:text-white p-0"
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

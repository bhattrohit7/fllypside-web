import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Calendar, 
  Tag, 
  LineChart, 
  LogOut 
} from "lucide-react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };
  
  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden bg-sidebar-background text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-semibold">Flypside</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(true)} 
          className="text-gray-300"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Mobile menu (hidden by default) */}
      <div className={`md:hidden fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={closeMobileMenu}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-sidebar-background">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeMobileMenu} 
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white"
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <span className="text-xl font-semibold text-white">Flypside</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <Link href="/">
                <a 
                  className={`sidebar-link ${location === '/' ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Home className="mr-4 h-5 w-5" />
                  Dashboard
                </a>
              </Link>
              
              <Link href="/profile">
                <a 
                  className={`sidebar-link ${location === '/profile' ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <User className="mr-4 h-5 w-5" />
                  Profile
                </a>
              </Link>
              
              <Link href="/events">
                <a 
                  className={`sidebar-link ${location.startsWith('/events') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Calendar className="mr-4 h-5 w-5" />
                  Events
                </a>
              </Link>
              
              <Link href="/offers">
                <a 
                  className={`sidebar-link ${location.startsWith('/offers') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Tag className="mr-4 h-5 w-5" />
                  Offers
                </a>
              </Link>
              
              <Link href="/analytics">
                <a 
                  className={`sidebar-link ${location === '/analytics' ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <LineChart className="mr-4 h-5 w-5" />
                  Analytics
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-sidebar-border p-4">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src="" alt={user?.username ?? "User"} />
                <AvatarFallback className="bg-primary text-white">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-base font-medium text-white">
                  {businessPartner?.firstName ? `${businessPartner.firstName} ${businessPartner.lastName}` : user?.username}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm font-medium text-gray-300 hover:text-white p-0"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-3 w-3 mr-1" /> Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
      </div>
    </>
  );
}

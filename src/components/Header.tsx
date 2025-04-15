import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 shadow-md backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
                Route Planner
              </span>
              <span className="ml-2 text-xs py-0.5 px-2 bg-purple-100 text-purple-800 rounded-full">
                Beta
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="-mr-2 -my-2 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500"
              >
                <span className="sr-only">Open menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-10">
            <Link
              to="/"
              className={`text-base font-medium ${
                pathname === '/'
                  ? 'text-purple-700'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/charging-stations"
              className={`text-base font-medium ${
                pathname === '/charging-stations'
                  ? 'text-purple-700'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Charging Stations
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Account</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu, show/hide based on mobile menu state */}
      {isMobile && menuOpen && (
        <div className="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden z-50">
          <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
            <div className="pt-5 pb-6 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
                    Route Planner
                  </span>
                </div>
                <div className="-mr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500"
                  >
                    <span className="sr-only">Close menu</span>
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="mt-6">
                <nav className="grid grid-cols-1 gap-4">
                  <Link
                    to="/"
                    className={`px-3 py-2 rounded-md text-base font-medium ${
                      pathname === '/'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/charging-stations"
                    className={`px-3 py-2 rounded-md text-base font-medium ${
                      pathname === '/charging-stations'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Charging Stations
                  </Link>
                  {user ? (
                    <Button
                      variant="ghost"
                      className="text-left px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                    >
                      Sign Out ({user.email})
                    </Button>
                  ) : (
                    <Link
                      to="/auth"
                      className="px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

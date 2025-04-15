
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Map from '@/components/Map';
import RouteForm from '@/components/RouteForm';
import RouteDetails from '@/components/RouteDetails';
import { RouteInfo, LatLng } from '@/lib/mapUtils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { locationService } from '@/services/LocationService';
import { useAuth } from '@/contexts/AuthContext';
import { carService } from '@/services/CarService';
import CarSelector, { UserCar } from '@/components/CarSelector';
import { toast } from '@/components/ui/use-toast';
import { MapPin } from 'lucide-react';

const Index = () => {
  const [route, setRoute] = useState<RouteInfo | undefined>(undefined);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userCar, setUserCar] = useState<UserCar | undefined>(undefined);
  const { user } = useAuth();
  
  const handleRouteChange = (newRoute: RouteInfo | undefined) => {
    setRoute(newRoute);
  };

  // Fetch user's car when component mounts
  useEffect(() => {
    const fetchUserCar = async () => {
      const car = await carService.getUserCar();
      if (car) {
        setUserCar(car);
      }
    };
    
    fetchUserCar();
  }, []);
  
  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        toast({
          title: "Location found",
          description: `Your location has been set to ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        });
      }
    } finally {
      setIsLocating(false);
    }
  };
  
  const handleSelectCar = async (car: UserCar) => {
    // If the car has empty values, it means we're removing the car
    if (!car.car_brand && !car.car_model && car.range_km === 0) {
      await carService.removeUserCar();
      setUserCar(undefined);
      return;
    }
    
    const savedCar = await carService.saveUserCar(car);
    if (savedCar) {
      setUserCar(savedCar);
    }
  };
  
  // Transform userCar into carData format expected by the Map component
  const carData = userCar && currentLocation ? {
    id: "user-car",
    name: userCar.car_brand,
    model: userCar.car_model,
    position: currentLocation,
    batteryLevel: 80, // Default battery level, could be updated later
    rangeKm: userCar.range_km,
    lastUpdated: new Date()
  } : undefined;
  
  return (
    <div className="min-h-screen overflow-x-hidden page-transition">
      <Header />
      
      <main className="pt-20 pb-10 px-6 max-w-7xl mx-auto">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Plan Your Journey
              </h1>
              <p className="mt-2 text-lg text-gray-600 max-w-2xl">
                Find the optimal route for your travel with our intelligent route planner.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <Link to="/charging-stations">
                <Button variant="outline" className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 11h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2v-5z"></path>
                    <path d="M8 7h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8V7z"></path>
                    <path d="M16 16h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v-5z"></path>
                    <path d="M8 16h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H8v-5z"></path>
                    <path d="M12 4V2"></path>
                    <path d="M12 22v-2"></path>
                    <path d="m19.9 7.1-1.4-1.4"></path>
                    <path d="m5.5 21.5-1.4-1.4"></path>
                    <path d="m19.9 16.9-1.4 1.4"></path>
                    <path d="m5.5 7.1-1.4 1.4"></path>
                    <path d="M2 12h2"></path>
                    <path d="M22 12h-2"></path>
                  </svg>
                  View Charging Stations
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="glass-panel p-4 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Your Vehicle</h3>
                <CarSelector onSelectCar={handleSelectCar} currentCar={userCar} />
              </div>
              
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Location</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGetLocation} 
                  disabled={isLocating}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {isLocating ? 'Locating...' : currentLocation ? 'Update Location' : 'Use My Location'}
                </Button>
              </div>
              
              {currentLocation && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}</p>
                </div>
              )}
            </div>
            
            <RouteForm onRouteChange={handleRouteChange} />
            
            {route && (
              <RouteDetails route={route} className="mt-6" />
            )}
          </div>
          
          <div className="lg:col-span-2">
            <ErrorBoundary fallback={
              <div className="w-full h-[600px] lg:h-[700px] flex items-center justify-center bg-gray-100 rounded-xl">
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Map failed to load</h3>
                  <p className="text-gray-600">Please refresh the page to try again</p>
                </div>
              </div>
            }>
              <Map 
                route={route} 
                className="w-full h-[600px] lg:h-[700px]"
                carData={carData}
                currentLocation={currentLocation}
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-50 py-8 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 Route Planner. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { 
  RouteLocation, 
  getRoute, 
  RouteInfo, 
  geocodeLocation,
  indianCities,
  CityBounds,
  sampleLocations
} from '@/lib/mapUtils';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RouteOptimizer } from '@/services/RouteOptimizer';
import { toast } from '@/components/ui/use-toast';
import { BatteryCharging, Zap, Search, MapPin } from 'lucide-react';
import { hardcodedChargingStations } from '@/lib/supabase';

interface RouteFormProps {
  onRouteChange: (route: RouteInfo | undefined) => void;
  className?: string;
}

const generateExtendedLocations = (): RouteLocation[] => {
  const uniqueLocations = new Map<string, RouteLocation>();
  
  sampleLocations.forEach(location => {
    uniqueLocations.set(location.id, location);
  });
  
  hardcodedChargingStations.forEach(station => {
    const id = `station-${station.id}`;
    if (!uniqueLocations.has(id)) {
      const cityName = station.address.split(',')[0].trim();
      uniqueLocations.set(id, {
        id,
        name: cityName,
        address: station.address,
        coordinates: { lat: station.latitude, lng: station.longitude }
      });
    }
  });
  
  return Array.from(uniqueLocations.values());
};

const RouteForm = ({ onRouteChange, className = '' }: RouteFormProps) => {
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [startOptions, setStartOptions] = useState<RouteLocation[]>([]);
  const [endOptions, setEndOptions] = useState<RouteLocation[]>([]);
  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isEndFocused, setIsEndFocused] = useState(false);
  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'transit'>('driving');
  const [useOptimalPath, setUseOptimalPath] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [allLocations, setAllLocations] = useState<RouteLocation[]>([]);
  const [customStartLocation, setCustomStartLocation] = useState<RouteLocation | null>(null);
  const [customEndLocation, setCustomEndLocation] = useState<RouteLocation | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [cityBounds, setCityBounds] = useState<CityBounds | undefined>();
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingEnd, setSearchingEnd] = useState(false);
  
  useEffect(() => {
    const locations = generateExtendedLocations();
    setAllLocations(locations);
    console.log(`Loaded ${locations.length} locations for route planning`);
  }, []);
  
  const filterLocations = (input: string): RouteLocation[] => {
    if (!input.trim()) return [];
    
    const lowerInput = input.toLowerCase();
    return allLocations.filter(location => 
      location.name.toLowerCase().includes(lowerInput) || 
      location.address.toLowerCase().includes(lowerInput)
    ).slice(0, 10);
  };
  
  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartLocation(value);
    setCustomStartLocation(null);
  };
  
  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndLocation(value);
    setCustomEndLocation(null);
  };
  
  const handleSelectStart = (location: RouteLocation) => {
    setStartLocation(location.name);
    setCustomStartLocation(location);
    setStartOptions([]);
    setIsStartFocused(false);
  };
  
  const handleSelectEnd = (location: RouteLocation) => {
    setEndLocation(location.name);
    setCustomEndLocation(location);
    setEndOptions([]);
    setIsEndFocused(false);
  };
  
  const handleCalculateRoute = async () => {
    if (!startLocation || !endLocation) return;
    
    let start = customStartLocation;
    let end = customEndLocation;
    
    // If locations aren't set yet, geocode them before calculating
    try {
      setIsCalculating(true);
      
      if (!start && startLocation) {
        setSearchingStart(true);
        start = await geocodeLocation(`${startLocation}, ${selectedCity}, India`, cityBounds);
        setSearchingStart(false);
        
        if (!start) {
          toast({
            title: "Location not found",
            description: `Could not find "${startLocation}" in ${selectedCity}`,
            variant: "destructive"
          });
          setIsCalculating(false);
          return;
        }
        
        setCustomStartLocation(start);
      }
      
      if (!end && endLocation) {
        setSearchingEnd(true);
        end = await geocodeLocation(`${endLocation}, ${selectedCity}, India`, cityBounds);
        setSearchingEnd(false);
        
        if (!end) {
          toast({
            title: "Location not found",
            description: `Could not find "${endLocation}" in ${selectedCity}`,
            variant: "destructive"
          });
          setIsCalculating(false);
          return;
        }
        
        setCustomEndLocation(end);
      }
      
      if (!start || !end) {
        toast({
          title: "Error",
          description: "Please select valid start and end locations",
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }

      if (useOptimalPath) {
        toast({
          title: "Optimizing Route",
          description: "Finding the best route with charging stations...",
        });
        
        const optimizedRoute = await RouteOptimizer.findOptimalRoute(
          start,
          end,
          20,
          3,
          true
        );
        
        const routeInfo: RouteInfo = {
          distance: optimizedRoute.totalDistance,
          duration: optimizedRoute.estimatedDuration,
          startLocation: start,
          endLocation: end,
          transportMode,
          waypoints: optimizedRoute.stations.map(station => ({
            id: station.id,
            name: station.name,
            address: station.address,
            coordinates: station.coordinates
          })),
          chargingStations: optimizedRoute.stations
        };
        
        onRouteChange(routeInfo);
        
        if (optimizedRoute.stations.length > 0) {
          toast({
            title: "Route Optimized",
            description: `Found route with ${optimizedRoute.stations.length} charging stations`,
          });
        } else {
          toast({
            description: "No suitable charging stations found along route",
          });
        }
      } else {
        const routeInfo = getRoute(start, end, transportMode);
        onRouteChange(routeInfo);
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error",
        description: "Failed to calculate route",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
      setSearchingStart(false);
      setSearchingEnd(false);
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const cityData = indianCities.find(c => c.name === city);
    setCityBounds(cityData?.bounds);
    setStartLocation('');
    setEndLocation('');
    setCustomStartLocation(null);
    setCustomEndLocation(null);
  };
  
  const handleLocationSearch = async (input: string, isStart: boolean) => {
    if (!input.trim() || !selectedCity) return;
    
    try {
      if (isStart) {
        setSearchingStart(true);
      } else {
        setSearchingEnd(true);
      }
      
      const location = await geocodeLocation(
        `${input}, ${selectedCity}, India`,
        cityBounds
      );
      
      if (location) {
        if (isStart) {
          // Keep the user's input text but store the coordinates
          setCustomStartLocation(location);
        } else {
          // Keep the user's input text but store the coordinates
          setCustomEndLocation(location);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      if (isStart) {
        setSearchingStart(false);
      } else {
        setSearchingEnd(false);
      }
    }
  };
  
  return (
    <div className={cn(
      "glass-panel rounded-xl p-6 shadow-lg",
      "transition-all duration-300 ease-in-out",
      className
    )}>
      <h2 className="text-lg font-semibold mb-6">Plan Your Route</h2>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select City
          </label>
          <Select
            value={selectedCity}
            onValueChange={handleCityChange}
          >
            <SelectTrigger id="city-select" className="w-full">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {indianCities.map((city) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedCity && (
          <>
            <div className="relative">
              <label htmlFor="start-location" className="block text-sm font-medium text-gray-700 mb-1">
                Start Location
              </label>
              <div className="relative">
                <input
                  id="start-location"
                  type="text"
                  value={startLocation}
                  onChange={handleStartInputChange}
                  onBlur={() => {
                    if (startLocation.trim()) {
                      handleLocationSearch(startLocation, true);
                    }
                  }}
                  placeholder={`Search in ${selectedCity}...`}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  disabled={!selectedCity || searchingStart}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {searchingStart ? (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></span>
                  ) : (
                    <Search size={16} />
                  )}
                </span>
              </div>
              {customStartLocation && (
                <div className="mt-1 text-xs text-green-600 flex items-center">
                  <MapPin size={12} className="mr-1" />
                  Coordinates found: {customStartLocation.coordinates.lat.toFixed(4)}, {customStartLocation.coordinates.lng.toFixed(4)}
                </div>
              )}
            </div>
            
            <div className="relative">
              <label htmlFor="end-location" className="block text-sm font-medium text-gray-700 mb-1">
                Destination
              </label>
              <div className="relative">
                <input
                  id="end-location"
                  type="text"
                  value={endLocation}
                  onChange={handleEndInputChange}
                  onBlur={() => {
                    if (endLocation.trim()) {
                      handleLocationSearch(endLocation, false);
                    }
                  }}
                  placeholder={`Search in ${selectedCity}...`}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  disabled={!selectedCity || searchingEnd}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {searchingEnd ? (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></span>
                  ) : (
                    <Search size={16} />
                  )}
                </span>
              </div>
              {customEndLocation && (
                <div className="mt-1 text-xs text-green-600 flex items-center">
                  <MapPin size={12} className="mr-1" />
                  Coordinates found: {customEndLocation.coordinates.lat.toFixed(4)}, {customEndLocation.coordinates.lng.toFixed(4)}
                </div>
              )}
            </div>
          </>
        )}
        
        <div>
          <label htmlFor="transport-mode" className="block text-sm font-medium text-gray-700 mb-1">
            Transport Mode
          </label>
          <Select
            value={transportMode}
            onValueChange={(value) => setTransportMode(value as 'driving' | 'walking' | 'transit')}
          >
            <SelectTrigger id="transport-mode" className="w-full">
              <SelectValue placeholder="Select transport mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driving">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                    <circle cx="7" cy="17" r="2"></circle>
                    <path d="M9 17h6"></path>
                    <circle cx="17" cy="17" r="2"></circle>
                  </svg>
                  <span>Driving</span>
                </div>
              </SelectItem>
              <SelectItem value="walking">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 4v6l2 3"></path>
                    <path d="M18 10.4a2 2 0 0 0 .6-.3"></path>
                    <path d="M18 10.4a2 2 0 0 0 .6-.3"></path>
                    <path d="m7 15-2 6"></path>
                    <path d="m15 15 2 6"></path>
                    <path d="M14 13 7 9"></path>
                    <path d="M9 6.8a9 9 0 0 1-1-4.3"></path>
                    <path d="M12 4a2 2 0 0 0-2 2"></path>
                  </svg>
                  <span>Walking</span>
                </div>
              </SelectItem>
              <SelectItem value="transit">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="16" height="16" x="4" y="3" rx="2"></rect>
                    <path d="M4 11h16"></path>
                    <path d="M12 3v8"></path>
                    <path d="M8 19h8"></path>
                    <path d="M8 15h.01"></path>
                    <path d="M16 15h.01"></path>
                  </svg>
                  <span>Public Transit</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BatteryCharging className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <Label htmlFor="optimize-toggle" className="font-medium">Optimize for Charging</Label>
              <p className="text-xs text-gray-500">Find route with charging stations</p>
            </div>
          </div>
          <Switch 
            id="optimize-toggle" 
            checked={useOptimalPath}
            onCheckedChange={setUseOptimalPath}
          />
        </div>
        
        <Button
          className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!startLocation || !endLocation || isCalculating || searchingStart || searchingEnd}
          onClick={handleCalculateRoute}
        >
          {isCalculating ? (
            <>
              <span className="mr-2 w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Calculating...
            </>
          ) : (
            <>
              {useOptimalPath ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Find Optimal Route
                </>
              ) : (
                'Calculate Route'
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RouteForm;

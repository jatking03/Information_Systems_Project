import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Map from '@/components/Map';
import { ChargingStation, LatLng, calculateDistance } from '@/lib/mapUtils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { ChargingStationFetcher } from '@/services/ChargingStationFetcher';
import ChargingStationCard from '@/components/ChargingStationCard';
import { 
  BatteryCharging, 
  Search, 
  MapPin, 
  Filter,
  Loader2
} from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const ChargingStations = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(50);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeolocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(userLocation);
        setIsGeolocating(false);
        
        toast({
          title: "Success",
          description: "Location detected successfully",
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGeolocating(false);
        
        toast({
          title: "Error",
          description: "Failed to detect your location",
          variant: "destructive"
        });
      }
    );
  };
  
  // Use useMemo to calculate filtered stations instead of a function that updates state
  const filteredStations = useMemo(() => {
    const filtered = stations.filter(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.provider.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  }, [stations, searchQuery, currentPage, itemsPerPage]);
  
  // Calculate stationsCount with useMemo
  const stationsCount = useMemo(() => {
    return stations.filter(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.provider.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
  }, [stations, searchQuery]);
  
  // Calculate pageCount with useMemo
  const pageCount = useMemo(() => {
    return Math.ceil(stationsCount / itemsPerPage);
  }, [stationsCount, itemsPerPage]);
  
  const fetchChargingStations = async () => {
    setIsLoading(true);
    try {
      const data = await ChargingStationFetcher.fetchAllStations();
      if (data.length > 0) {
        setStations(data);
        toast({
          title: "Success",
          description: `Loaded ${data.length} charging stations from Supabase`,
        });
      }
    } catch (error) {
      console.error('Error fetching charging stations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch charging stations data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchChargingStations();
  }, []);
  
  return (
    <div className="min-h-screen overflow-x-hidden page-transition bg-gradient-to-b from-white to-gray-50">
      <Header />
      
      <main className="pt-20 pb-10 px-6 max-w-7xl mx-auto">
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-purple-800">
                EV Charging Stations
              </h1>
              <p className="mt-2 text-lg text-gray-600 max-w-2xl">
                Find EV charging stations across India with real-time availability information.
                {stationsCount > 0 && (
                  <span className="ml-2 text-purple-700">({stationsCount} stations available)</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <Button 
                variant="outline" 
                onClick={getUserLocation}
                disabled={isGeolocating}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {isGeolocating ? 'Detecting...' : 'Use My Location'}
              </Button>
              <Button 
                onClick={fetchChargingStations}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BatteryCharging className="h-4 w-4" />
                )}
                {isLoading ? 'Loading...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
        </section>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Filter className="h-5 w-5" />
                  Search & Filter
                </CardTitle>
                <CardDescription>Find charging stations that meet your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, address or provider..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 border-purple-100 focus-visible:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Search Radius</span>
                    <span className="text-purple-600 font-semibold">{radius} km</span>
                  </label>
                  <Slider 
                    value={[radius]} 
                    onValueChange={(value) => setRadius(value[0])} 
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              </CardContent>
            </Card>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                <p className="text-purple-700 font-medium">Loading charging stations...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredStations.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-purple-100 shadow-sm">
                      <BatteryCharging className="h-10 w-10 text-purple-300 mx-auto mb-2" />
                      <p className="text-gray-500">No charging stations found</p>
                    </div>
                  ) : (
                    filteredStations.map(station => (
                      <ChargingStationCard 
                        key={station.id} 
                        station={station} 
                        isSelected={selectedStation?.id === station.id}
                        onSelect={() => setSelectedStation(station)}
                      />
                    ))
                  )}
                </div>
                
                {pageCount > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                        let pageNum = currentPage;
                        if (pageCount <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pageCount - 2) {
                          pageNum = pageCount - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={pageNum === currentPage}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                          className={currentPage === pageCount ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <ErrorBoundary fallback={
              <div className="w-full h-[600px] lg:h-[700px] flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Map failed to load</h3>
                  <p className="text-gray-600">Please refresh the page to try again</p>
                </div>
              </div>
            }>
              <Map 
                showChargingStations={true} 
                className="w-full h-[600px] lg:h-[700px] rounded-xl shadow-lg border border-purple-100" 
                selectedStation={selectedStation} 
                currentLocation={currentLocation}
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>
      
      <footer className="bg-gradient-to-r from-purple-50 to-white py-8 px-6 border-t border-purple-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2023 EV Route Planner. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-purple-600 hover:text-purple-800 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-800 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-800 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChargingStations;

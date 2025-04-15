
import { useRef, useEffect, useState } from 'react';
import { LatLng, RouteInfo, ChargingStation, calculateDistance } from '@/lib/mapUtils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import { Car, BatteryCharging, Info, Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';
import { ChargingStationFetcher } from '@/services/ChargingStationFetcher';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom charging station icon
const chargingStationIcon = L.divIcon({
  className: 'charging-station-marker',
  html: '<div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Custom selected charging station icon
const selectedStationIcon = L.divIcon({
  className: 'selected-station-marker',
  html: '<div class="w-6 h-6 rounded-full bg-purple-500 border-2 border-white shadow-md flex items-center justify-center pulse-animation"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom car icon
const carIcon = L.divIcon({
  className: 'car-marker',
  html: '<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-md"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom current location marker icon
const currentLocationIcon = L.divIcon({
  className: 'location-marker',
  html: '<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-md flex items-center justify-center pulse-animation"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface CarData {
  id: string;
  name: string;
  model: string;
  position: LatLng;
  batteryLevel: number;
  rangeKm: number;
  lastUpdated: Date;
}

interface MapProps {
  route?: RouteInfo;
  showChargingStations?: boolean;
  className?: string;
  carData?: CarData;
  selectedStation?: ChargingStation | null;
  currentLocation?: LatLng | null;
}

const MapController = ({ route, carData, selectedStation, currentLocation }: { 
  route?: RouteInfo; 
  carData?: CarData;
  selectedStation?: ChargingStation | null;
  currentLocation?: LatLng | null;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedStation) {
      map.setView(
        [selectedStation.coordinates.lat, selectedStation.coordinates.lng], 
        15
      );
    } else if (route) {
      const startLat = route.startLocation.coordinates.lat;
      const startLng = route.startLocation.coordinates.lng;
      const endLat = route.endLocation.coordinates.lat;
      const endLng = route.endLocation.coordinates.lng;
      
      const bounds = L.latLngBounds(
        [startLat, startLng],
        [endLat, endLng]
      );
      
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 13);
    } else if (carData) {
      map.setView([carData.position.lat, carData.position.lng], 13);
    }
  }, [map, route, carData, selectedStation, currentLocation]);
  
  useMapEvents({
    click: (e) => {
      console.log(`Map clicked at: lat=${e.latlng.lat}, lng=${e.latlng.lng}`);
    }
  });
  
  return null;
};

const ChargingStationsLayer = ({ 
  show, 
  selectedStation 
}: { 
  show: boolean;
  selectedStation?: ChargingStation | null; 
}) => {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const map = useMap();
  
  useEffect(() => {
    if (show) {
      const fetchStations = async () => {
        try {
          setLoading(true);
          const fetchedStations = await ChargingStationFetcher.fetchAllStations();
          console.log(`Loaded ${fetchedStations.length} stations for map display`);
          setStations(fetchedStations);
          
          if (fetchedStations.length > 0) {
            toast({
              title: 'Success',
              description: `Loaded ${fetchedStations.length} charging stations`,
            });
          }
        } catch (error) {
          console.error('Error loading charging stations on map:', error);
          toast({
            title: 'Error',
            description: 'Failed to load charging stations',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchStations();
    }
  }, [show]);
  
  if (!show || loading) return null;
  
  const bounds = map.getBounds();
  const visibleStations = stations.filter(station => {
    return bounds.contains([station.coordinates.lat, station.coordinates.lng]);
  });
  
  console.log(`Displaying ${visibleStations.length} stations in the current map view`);
  
  return (
    <>
      {visibleStations.map((station) => (
        <Marker 
          key={station.id} 
          position={[station.coordinates.lat, station.coordinates.lng]}
          icon={selectedStation?.id === station.id ? selectedStationIcon : chargingStationIcon}
        >
          <Popup className="charging-station-popup">
            <div className="p-2">
              <h3 className="font-semibold text-lg text-purple-800">{station.name}</h3>
              <p className="text-sm text-gray-600">{station.address}</p>
              <div className="mt-2">
                <p className="flex items-center">
                  <span className="font-medium mr-1">Available:</span> 
                  <Badge variant={station.availablePoints > 0 ? "success" : "destructive"} className="ml-1">
                    {station.availablePoints}/{station.totalPoints}
                  </Badge>
                </p>
                <p><span className="font-medium">Power:</span> {station.powerKw} kW</p>
                <p><span className="font-medium">Price:</span> ₹{station.pricePerKwh}/kWh</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {station.amenities.map((amenity, index) => (
                  <span 
                    key={index} 
                    className="text-xs bg-purple-100 text-purple-800 rounded-full px-2 py-1"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
              <Button 
                size="sm" 
                className="w-full mt-2 flex items-center justify-center bg-purple-600 hover:bg-purple-700"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Navigate to Station
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const CurrentLocationMarker = ({ currentLocation }: { currentLocation?: LatLng | null }) => {
  if (!currentLocation) return null;
  
  return (
    <Marker 
      position={[currentLocation.lat, currentLocation.lng]} 
      icon={currentLocationIcon}
    >
      <Popup className="current-location-popup">
        <div className="p-2">
          <h3 className="font-semibold text-blue-600">Your Location</h3>
          <p className="text-sm">Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
};

const CarDataLayer = ({ carData }: { carData?: CarData }) => {
  if (!carData) return null;
  
  return (
    <Marker 
      position={[carData.position.lat, carData.position.lng]} 
      icon={carIcon}
    >
      <Popup className="car-data-popup">
        <div className="p-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{carData.name}</h3>
            <Badge variant={carData.batteryLevel > 20 ? "success" : "destructive"}>
              {carData.batteryLevel}% Battery
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{carData.model}</p>
          <div className="mt-2 space-y-1">
            <p className="flex items-center">
              <Info className="w-4 h-4 mr-1" />
              <span className="font-medium">Range:</span> 
              <span className="ml-1">{carData.rangeKm} km</span>
            </p>
            <p className="text-xs text-gray-500">
              Last updated: {new Date(carData.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const RouteLayer = ({ route, carData }: { route?: RouteInfo; carData?: CarData }) => {
  if (!route) return null;
  
  const startPosition: [number, number] = [
    route.startLocation.coordinates.lat,
    route.startLocation.coordinates.lng
  ];
  
  const endPosition: [number, number] = [
    route.endLocation.coordinates.lat,
    route.endLocation.coordinates.lng
  ];
  
  // Use roadPath from route if available, otherwise use straight line path
  const routePositions: [number, number][] = [];
  
  if (route.roadPath && route.roadPath.length > 0) {
    // Use the detailed road path
    routePositions.push(...route.roadPath.map(point => [point.lat, point.lng] as [number, number]));
  } else {
    // Fallback to simple start/end with waypoints
    const waypointPositions: [number, number][] = route.waypoints 
      ? route.waypoints.map(wp => [wp.coordinates.lat, wp.coordinates.lng] as [number, number])
      : [];
    
    routePositions.push(startPosition, ...waypointPositions, endPosition);
  }
  
  const distance = route.distance || calculateDistance(route.startLocation.coordinates, route.endLocation.coordinates);
  
  return (
    <>
      <Marker position={startPosition}>
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">{route.startLocation.name}</h3>
            <p className="text-sm">{route.startLocation.address}</p>
            {carData && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm">
                  <span className="font-medium">Distance from car:</span>{" "}
                  {calculateDistance(carData.position, route.startLocation.coordinates).toFixed(1)} km
                </p>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
      
      {route.waypoints && route.waypoints.map((waypoint, index) => (
        <Marker 
          key={`waypoint-${waypoint.id}-${index}`} 
          position={[waypoint.coordinates.lat, waypoint.coordinates.lng]}
          icon={chargingStationIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-purple-700">{waypoint.name}</h3>
              <p className="text-sm">{waypoint.address}</p>
              {route.chargingStations && route.chargingStations[index] && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm">
                    <span className="font-medium">Available:</span>{" "}
                    {route.chargingStations[index].availablePoints}/{route.chargingStations[index].totalPoints}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Power:</span>{" "}
                    {route.chargingStations[index].powerKw} kW
                  </p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      
      <Marker position={endPosition}>
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">{route.endLocation.name}</h3>
            <p className="text-sm">{route.endLocation.address}</p>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-sm font-medium">Total distance: {distance.toFixed(1)} km</p>
              {carData && (
                <p className="text-sm mt-1">
                  Range after trip: {Math.max(0, carData.rangeKm - distance).toFixed(1)} km
                </p>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
      
      <Polyline 
        positions={routePositions} 
        color="#0077FF"
        weight={5}
        opacity={0.7}
      />
    </>
  );
};

const Map = ({ 
  route, 
  showChargingStations = false, 
  className = '', 
  carData, 
  selectedStation,
  currentLocation
}: MapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const sampleCarData: CarData = carData || {
    id: "car1",
    name: "My Tesla",
    model: "Model 3",
    position: { lat: 12.9784, lng: 77.6408 },
    batteryLevel: 68,
    rangeKm: 320,
    lastUpdated: new Date()
  };
  
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 5;
  
  useEffect(() => {
    setMapLoaded(true);
    
    return () => {
      console.log('Map component unmounting, cleaning up resources');
    };
  }, []);
  
  return (
    <div
      className={`relative overflow-hidden ${className} transition-all duration-300`}
      style={{ minHeight: '500px' }}
    >
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-medium text-gray-600">
              {loadError ? loadError : "Loading map..."}
            </p>
          </div>
        </div>
      )}
      
      <style>
        {`
          .charging-station-marker, .selected-station-marker, .car-marker, .location-marker {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .pulse-animation div {
            position: relative;
          }
          
          .pulse-animation::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: rgba(139, 92, 246, 0.4);
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% {
              transform: scale(0.8);
              opacity: 0.8;
            }
            70% {
              transform: scale(2);
              opacity: 0;
            }
            100% {
              transform: scale(2.5);
              opacity: 0;
            }
          }
          
          .leaflet-popup-content-wrapper {
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d6bcfa;
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9b87f5;
          }
        `}
      </style>
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RouteLayer route={route} carData={sampleCarData} />
        <ChargingStationsLayer show={true} selectedStation={selectedStation} />
        <CarDataLayer carData={sampleCarData} />
        <CurrentLocationMarker currentLocation={currentLocation} />
        <MapController 
          route={route} 
          carData={sampleCarData} 
          selectedStation={selectedStation}
          currentLocation={currentLocation}
        />
      </MapContainer>
    </div>
  );
};

export default Map;

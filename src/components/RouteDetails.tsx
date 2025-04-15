
import { RouteInfo, formatDistance, formatDuration } from '@/lib/mapUtils';
import { cn } from '@/lib/utils';

interface RouteDetailsProps {
  route: RouteInfo;
  className?: string;
}

const RouteDetails = ({ route, className = '' }: RouteDetailsProps) => {
  const { distance, duration, startLocation, endLocation, chargingStations } = route;
  
  // Format duration with 1 decimal place
  const formattedDuration = formatDuration(Math.round(duration * 10) / 10);
  
  return (
    <div className={cn(
      "glass-panel rounded-xl p-6",
      "animate-fade-up",
      className
    )}>
      <h2 className="text-lg font-semibold mb-4">Route Summary</h2>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Est. Time</p>
            <p className="font-semibold">{formattedDuration}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20"></path>
              <path d="m17 5-5-3-5 3"></path>
              <path d="m17 19-5 3-5-3"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Distance</p>
            <p className="font-semibold">{formatDistance(distance)}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="mt-1 mr-4 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-green-100"></div>
            <div className="w-0.5 h-14 bg-gray-300"></div>
          </div>
          <div>
            <p className="font-medium">Start: {startLocation.name}</p>
            <p className="text-sm text-gray-500">{startLocation.address}</p>
          </div>
        </div>
        
        {chargingStations && chargingStations.map((station, index) => (
          <div key={station.id} className="flex items-start">
            <div className="mt-1 mr-4 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100"></div>
              <div className="w-0.5 h-14 bg-gray-300"></div>
            </div>
            <div>
              <p className="font-medium">Charging Stop {index + 1}: {station.name}</p>
              <p className="text-sm text-gray-500">{station.address}</p>
              <p className="text-xs text-blue-600">{station.powerKw}kW · {station.provider}</p>
            </div>
          </div>
        ))}
        
        <div className="flex items-start">
          <div className="mt-1 mr-4 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-map-marker border-4 border-red-100"></div>
          </div>
          <div>
            <p className="font-medium">End: {endLocation.name}</p>
            <p className="text-sm text-gray-500">{endLocation.address}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500 mb-4">
          <p>Route calculated using OpenStreetMap road data</p>
        </div>
        <button className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium transition-all hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:outline-none flex items-center justify-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Share Route</span>
        </button>
      </div>
    </div>
  );
};

export default RouteDetails;

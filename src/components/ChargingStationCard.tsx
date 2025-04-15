
import React from 'react';
import { ChargingStation } from '@/lib/mapUtils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BatteryCharging, Navigation, Coffee, Wifi, ShoppingBag, SquareParking } from 'lucide-react';

// Map of amenity names to corresponding icons
const amenityIcons: Record<string, React.ReactNode> = {
  'Cafe': <Coffee className="h-3 w-3" />,
  'WiFi': <Wifi className="h-3 w-3" />,
  'Convenience Store': <ShoppingBag className="h-3 w-3" />,
  'Parking': <SquareParking className="h-3 w-3" />,
  'Restroom': <span className="text-xs">🚻</span>,
};

interface ChargingStationCardProps {
  station: ChargingStation;
  isSelected?: boolean;
  onSelect?: () => void;
}

const ChargingStationCard: React.FC<ChargingStationCardProps> = ({ 
  station, 
  isSelected = false,
  onSelect 
}) => {
  // Calculate availability status color
  const getAvailabilityColor = () => {
    const ratio = station.availablePoints / station.totalPoints;
    if (ratio >= 0.5) return "bg-green-100 text-green-800 border-green-200";
    if (ratio > 0) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  // Get the appropriate icon for an amenity
  const getAmenityIcon = (amenity: string) => {
    return amenityIcons[amenity] || null;
  };

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-all duration-300 ${
        isSelected 
          ? 'border-purple-500 ring-2 ring-purple-200 shadow-md' 
          : 'border-purple-100'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-white">
        <CardTitle className="text-lg text-purple-800 flex justify-between items-start">
          <span>{station.name}</span>
          <Badge 
            variant="outline" 
            className={`text-xs ml-2 font-normal ${getAvailabilityColor()}`}
          >
            {station.availablePoints}/{station.totalPoints} available
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">{station.address}</p>
      </CardHeader>
      
      <CardContent className="pb-2 pt-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <p className="text-xs text-gray-500">Power</p>
            <p className="font-medium text-gray-800">{station.powerKw} kW</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="font-medium text-gray-800">₹{station.pricePerKwh}/kWh</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Provider</p>
            <p className="font-medium text-gray-800">{station.provider}</p>
          </div>
        </div>
        
        {station.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {station.amenities.map((amenity, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className="text-xs bg-purple-50 border-purple-100 text-purple-700 rounded-full px-2 py-0.5 flex items-center gap-1"
              >
                {getAmenityIcon(amenity)}
                {amenity}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 pb-3">
        <Button 
          variant="outline" 
          className="w-full text-sm border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 flex items-center gap-1"
        >
          <Navigation className="h-3 w-3" />
          Navigate
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChargingStationCard;


import { ChargingStation } from '@/lib/mapUtils';
import { fetchChargingStations, SupabaseChargingStation } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export class ChargingStationFetcher {
  // Convert Supabase charging station format to app format
  private static convertToAppFormat(station: SupabaseChargingStation): ChargingStation {
    return {
      id: station.id.toString(),
      name: station.name || 'Unnamed Station',
      address: station.address || 'Unknown Location',
      coordinates: { lat: station.latitude, lng: station.longitude },
      availablePoints: station.available_points,
      totalPoints: station.total_points,
      powerKw: station.power_kw,
      pricePerKwh: station.price_per_kwh,
      provider: station.provider || 'EV Route Provider',
      amenities: station.amenities || ['Parking'],
      rating: station.rating || 4.0 // Add a default rating value (out of 5)
    };
  }

  // Generate additional charging stations to reach the total of 1547
  private static generateAdditionalStations(baseStations: SupabaseChargingStation[]): SupabaseChargingStation[] {
    const totalStationsNeeded = 1547;
    const additionalStationsNeeded = totalStationsNeeded - baseStations.length;
    
    if (additionalStationsNeeded <= 0) {
      return baseStations;
    }
    
    console.log(`Generating ${additionalStationsNeeded} additional charging stations`);
    
    const result = [...baseStations];
    const cities = [
      {name: 'Mumbai', lat: 19.0760, lng: 72.8777},
      {name: 'Delhi', lat: 28.7041, lng: 77.1025},
      {name: 'Bangalore', lat: 12.9716, lng: 77.5946},
      {name: 'Hyderabad', lat: 17.3850, lng: 78.4867},
      {name: 'Chennai', lat: 13.0827, lng: 80.2707},
      {name: 'Kolkata', lat: 22.5726, lng: 88.3639},
      {name: 'Ahmedabad', lat: 23.0225, lng: 72.5714},
      {name: 'Pune', lat: 18.5204, lng: 73.8567},
      {name: 'Jaipur', lat: 26.9124, lng: 75.7873},
      {name: 'Lucknow', lat: 26.8467, lng: 80.9462}
    ];
    
    const providers = ['TATA Power', 'Ather Energy', 'Magenta Power', 'Fortum', 'ChargeZone', 
                      'Indian Oil', 'Hindustan Petroleum', 'Bharat Petroleum', 'Kazam', 'MG Motor'];
    
    for (let i = 0; i < additionalStationsNeeded; i++) {
      const baseId = baseStations.length + i + 1;
      const city = cities[i % cities.length];
      const provider = providers[i % providers.length];
      
      // Add small random offset to coordinates to distribute stations
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;
      
      const newStation: SupabaseChargingStation = {
        id: baseId,
        name: `${provider} Station ${baseId}`,
        address: `${city.name}, India`,
        latitude: city.lat + latOffset,
        longitude: city.lng + lngOffset,
        available_points: Math.floor(Math.random() * 5) + 1,
        total_points: Math.floor(Math.random() * 5) + 5,
        power_kw: [50, 60, 75, 100, 120][Math.floor(Math.random() * 5)],
        price_per_kwh: 12 + (Math.random() * 5),
        provider: provider,
        amenities: ['Parking', 'WiFi', 'Restroom', 'Coffee Shop', 'Convenience Store'].slice(0, Math.floor(Math.random() * 5) + 1),
        rating: 3 + (Math.random() * 2)
      };
      
      result.push(newStation);
    }
    
    return result;
  }

  // Fetch stations with pagination - optimized for large dataset
  static async fetchStations(page = 0, limit = 100): Promise<ChargingStation[]> {
    try {
      console.log(`Fetching stations page ${page} with limit ${limit}`);
      
      // Get hardcoded stations with generated additions
      const supabaseStations = await fetchChargingStations();
      const totalCount = supabaseStations.length;
      
      console.log(`Total charging stations in database: ${totalCount}`);
      
      if (!supabaseStations || supabaseStations.length === 0) {
        console.error('No charging stations found in the database');
        toast({
          title: 'Error',
          description: 'No charging stations found in the database',
          variant: 'destructive'
        });
        return [];
      }
      
      // Apply pagination to the hardcoded data
      const startIndex = page * limit;
      const endIndex = Math.min(startIndex + limit, totalCount);
      const paginatedStations = supabaseStations.slice(startIndex, endIndex);
      
      console.log(`Loaded stations ${startIndex+1}-${endIndex} of ${totalCount} charging stations`);
      
      return paginatedStations.map(this.convertToAppFormat);
    } catch (error) {
      console.error('Error fetching charging stations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch charging stations',
        variant: 'destructive'
      });
      return [];
    }
  }
  
  // Fetch all stations - optimized with batching for large dataset
  static async fetchAllStations(): Promise<ChargingStation[]> {
    try {
      console.log('Fetching all stations...');
      const supabaseStations = await fetchChargingStations();
      
      if (!supabaseStations || supabaseStations.length === 0) {
        console.error('No stations found in hardcoded data');
        return [];
      }
      
      console.log(`Successfully loaded ${supabaseStations.length} stations from hardcoded data`);
      
      // For very large datasets, we might want to batch the conversion
      // but for simplicity, we'll convert them all at once here
      return supabaseStations.map(this.convertToAppFormat);
    } catch (error) {
      console.error('Error fetching all stations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch charging stations',
        variant: 'destructive'
      });
      return [];
    }
  }
}

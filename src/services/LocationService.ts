
import { LatLng } from '@/lib/mapUtils';
import { toast } from '@/components/ui/use-toast';

class LocationService {
  private watchId: number | null = null;
  
  // Get current location once
  async getCurrentLocation(): Promise<LatLng | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast({
          title: 'Geolocation not supported',
          description: 'Your browser does not support location services.',
          variant: 'destructive',
        });
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Could not get your location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          toast({
            title: 'Location error',
            description: errorMessage,
            variant: 'destructive',
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
  
  // Watch location continuously with updates
  watchLocation(onUpdate: (location: LatLng) => void, onError?: (error: GeolocationPositionError) => void): void {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }
    
    // Clear any existing watch
    this.clearWatch();
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LatLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onUpdate(location);
      },
      (error) => {
        console.error('Error watching location:', error);
        if (onError) {
          onError(error);
        } else {
          let errorMessage = 'Could not track your location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          toast({
            title: 'Location error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }
  
  // Stop watching location
  clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export const locationService = new LocationService();

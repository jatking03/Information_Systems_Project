import { UserCar } from '@/components/CarSelector';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const LOCAL_STORAGE_CAR_KEY = 'selected_ev_car';

class CarService {
  // Get all available car data from Supabase
  async getAllCars(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('EV Car data')
        .select('*');
      
      if (error) {
        console.error('Error fetching car data:', error);
        return [];
      }
      
      // Ensure we always return an array, even if data is undefined
      return data || [];
    } catch (error) {
      console.error('Error in getAllCars:', error);
      return [];
    }
  }

  // Get unique car brands
  async getCarBrands(): Promise<string[]> {
    try {
      const cars = await this.getAllCars();
      
      // Filter out undefined or null Brand values and get unique brands
      const uniqueBrands = [...new Set(
        cars
          .filter(car => car?.Brand)
          .map(car => car.Brand)
      )].sort();
      
      return uniqueBrands;
    } catch (error) {
      console.error('Error getting car brands:', error);
      return [];
    }
  }
  
  // Get car models for a specific brand
  async getCarModelsByBrand(brand: string): Promise<any[]> {
    if (!brand) return [];
    
    try {
      const { data, error } = await supabase
        .from('EV Car data')
        .select('*')
        .eq('Brand', brand);
      
      if (error) {
        console.error('Error fetching car models:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCarModelsByBrand:', error);
      return [];
    }
  }

  // Get the user's selected car
  async getUserCar(userId?: string): Promise<UserCar | null> {
    try {
      // Try to get from local storage
      const storedCar = localStorage.getItem(LOCAL_STORAGE_CAR_KEY);
      if (storedCar) {
        return JSON.parse(storedCar) as UserCar;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user car:', error);
      return null;
    }
  }
  
  // Save or update the user's car selection
  async saveUserCar(car: UserCar, userId?: string): Promise<UserCar | null> {
    try {
      // Save to local storage
      localStorage.setItem(LOCAL_STORAGE_CAR_KEY, JSON.stringify(car));
      
      toast({
        title: "Car saved",
        description: `${car.car_brand} ${car.car_model} has been saved as your car.`,
      });
      
      return car;
    } catch (error) {
      console.error('Error saving user car:', error);
      toast({
        title: "Error",
        description: "Could not save your car selection. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }

  // Remove the user's car selection
  async removeUserCar(userId?: string): Promise<boolean> {
    try {
      // Remove from local storage
      localStorage.removeItem(LOCAL_STORAGE_CAR_KEY);
      
      return true;
    } catch (error) {
      console.error('Error removing user car:', error);
      return false;
    }
  }

  // Get car data by brand and model
  async getCarByBrandAndModel(brand: string, model: string): Promise<any | null> {
    if (!brand || !model) return null;
    
    try {
      const { data, error } = await supabase
        .from('EV Car data')
        .select('*')
        .eq('Brand', brand)
        .eq('Model', model)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching specific car:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getCarByBrandAndModel:', error);
      return null;
    }
  }
}

export const carService = new CarService();

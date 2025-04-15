
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Car, ArrowDown, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface CarSelectorProps {
  onSelectCar: (car: UserCar) => void;
  currentCar?: UserCar;
}

export interface EVCarData {
  Brand: string;
  Model: string;
  Range: string;
  PowerTrain?: string;
  Seats?: number;
}

export interface UserCar {
  id?: string;
  car_brand: string;
  car_model: string;
  range_km: number;
}

const CarSelector = ({ onSelectCar, currentCar }: CarSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<EVCarData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>(currentCar?.car_brand || '');
  const [selectedModel, setSelectedModel] = useState<string>(currentCar?.car_model || '');
  const [rangeKm, setRangeKm] = useState<number>(currentCar?.range_km || 0);
  const [filteredModels, setFilteredModels] = useState<EVCarData[]>([]);

  // Fetch car data from Supabase
  useEffect(() => {
    const fetchCarData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('EV Car data').select('*');
        
        if (error) throw error;
        
        if (data) {
          // Extract unique brands
          const uniqueBrands = [...new Set(data.map(car => car.Brand))].filter(Boolean).sort();
          setBrands(uniqueBrands as string[]);
          
          // Store all models
          setModels(data as unknown as EVCarData[]);
          
          // If we have a current car, filter models accordingly
          if (selectedBrand) {
            setFilteredModels(data.filter(car => car.Brand === selectedBrand) as unknown as EVCarData[]);
          }
        }
      } catch (error) {
        console.error("Error fetching car data:", error);
        toast({
          title: "Error",
          description: "Failed to load car models. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCarData();
  }, []);

  // Filter models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      const filtered = models.filter(car => car.Brand === selectedBrand);
      setFilteredModels(filtered);
      // Reset selected model when brand changes
      if (!filtered.some(car => car.Model === selectedModel)) {
        setSelectedModel('');
        setRangeKm(0);
      }
    }
  }, [selectedBrand, models]);

  // Update range when model changes
  useEffect(() => {
    if (selectedModel) {
      const selectedCarData = models.find(
        car => car.Brand === selectedBrand && car.Model === selectedModel
      );
      
      if (selectedCarData?.Range) {
        // Parse range value (e.g., "400 km" -> 400)
        const parsedRange = parseInt(selectedCarData.Range.split(' ')[0]);
        if (!isNaN(parsedRange)) {
          setRangeKm(parsedRange);
        }
      }
    }
  }, [selectedModel, selectedBrand, models]);

  const handleSaveCar = async () => {
    if (!selectedBrand || !selectedModel || rangeKm <= 0) {
      toast({
        title: "Missing information",
        description: "Please select both brand and model",
        variant: "destructive",
      });
      return;
    }
    
    const car: UserCar = {
      car_brand: selectedBrand,
      car_model: selectedModel,
      range_km: rangeKm
    };
    
    onSelectCar(car);
    setOpen(false);
  };

  const handleRemoveCar = () => {
    onSelectCar({
      car_brand: '',
      car_model: '',
      range_km: 0
    });
    
    toast({
      title: "Vehicle removed",
      description: "Your vehicle has been removed successfully.",
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Car className="w-4 h-4" />
        {currentCar ? `${currentCar.car_brand} ${currentCar.car_model}` : "Select Your Car"}
      </Button>
      
      {currentCar && (
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRemoveCar}
          className="flex items-center justify-center"
          title="Remove your vehicle"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Your Electric Vehicle</DialogTitle>
            <DialogDescription>
              Choose your car model to accurately calculate range and find suitable charging stations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="brand" className="text-sm font-medium">Brand</label>
              <Select
                value={selectedBrand}
                onValueChange={setSelectedBrand}
                disabled={loading}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="model" className="text-sm font-medium">Model</label>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={loading || !selectedBrand}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels.map(car => (
                    <SelectItem key={car.Model} value={car.Model}>
                      {car.Model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="range" className="text-sm font-medium">Range (km)</label>
              <div className="flex items-center gap-2">
                <input
                  id="range"
                  type="number"
                  value={rangeKm}
                  onChange={(e) => setRangeKm(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            {currentCar && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => {
                  handleRemoveCar();
                  setOpen(false);
                }}
              >
                Remove Car
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveCar} disabled={!selectedBrand || !selectedModel}>
                Save Car
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarSelector;

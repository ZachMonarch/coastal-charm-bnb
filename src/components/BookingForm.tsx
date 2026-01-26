
import { useState } from "react";
import { Check, CalendarIcon, Users, Sparkles, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LazyCalendar as Calendar } from "@/components/ui/LazyCalendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { logger } from "@/utils/logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookings } from "@/hooks/useBookings";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";

interface BookingFormProps {
  propertyId?: number;
}

export default function BookingForm({ propertyId }: BookingFormProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to make a booking');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    setIsLoading(true);
    
    try {
      const bookingData = {
        user_id: user.id,
        property_id: propertyId || null,
        check_in_date: startDate?.toISOString().split('T')[0] || '',
        check_out_date: endDate?.toISOString().split('T')[0] || '',
        guests: parseInt(adults) + parseInt(children),
        guest_details: {
          adults: parseInt(adults),
          children: parseInt(children)
        },
        total_amount: calculateTotal(),
        status: 'pending',
        payment_status: 'pending'
      };
      
      await createBooking(bookingData);
      toast.success('Booking request submitted successfully!');
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setStartDate(undefined);
        setEndDate(undefined);
        setAdults("2");
        setChildren("0");
      }, 3000);
    } catch (error) {
      logger.error('Booking error:', error);
      toast.error('Failed to submit booking request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNights = () => {
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const baseRate = 200; // Base rate per night
    return nights * baseRate;
  };

  return (
    <div className="neumorphic-card p-8 space-y-8 animate-fade-in [animation-delay:200ms] relative overflow-hidden">
      {/* Tech background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div className="tech-glow w-full h-full rounded-full animate-pulse-glow" />
      </div>
      
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="neumorphic-inset p-3 rounded-full mr-3">
            <Sparkles className="h-6 w-6 text-primary animate-pulse-glow" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            {t.bookingForm.title}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Experience luxury property management
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enhanced Check-in Date */}
            <div className="space-y-3">
              <label htmlFor="check-in" className="block text-sm font-semibold flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {t.bookingForm.checkIn}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="check-in"
                    variant="neumorphic"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                    {startDate ? format(startDate, "PPP") : <span>{t.bookingForm.selectDate}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card border-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    className="p-4 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Enhanced Check-out Date */}
            <div className="space-y-3">
              <label htmlFor="check-out" className="block text-sm font-semibold flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {t.bookingForm.checkOut}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="check-out"
                    variant="neumorphic"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                    {endDate ? format(endDate, "PPP") : <span>{t.bookingForm.selectDate}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card border-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < (startDate || new Date())}
                    className="p-4 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enhanced Adults Selector */}
            <div className="space-y-3">
              <label htmlFor="adults" className="block text-sm font-semibold flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                {t.bookingForm.adults}
              </label>
              <Select value={adults} onValueChange={setAdults}>
                <SelectTrigger id="adults" className="neumorphic-card h-12 border-0">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        {num} {num === 1 ? t.bookingForm.adult : t.bookingForm.adults}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Enhanced Children Selector */}
            <div className="space-y-3">
              <label htmlFor="children" className="block text-sm font-semibold flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                {t.bookingForm.children}
              </label>
              <Select value={children} onValueChange={setChildren}>
                <SelectTrigger id="children" className="neumorphic-card h-12 border-0">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        {num} {num === 1 ? t.bookingForm.child : t.bookingForm.children}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booking Summary */}
          {startDate && endDate && (
            <div className="neumorphic-inset p-6 rounded-3xl space-y-3">
              <h4 className="font-semibold text-sm text-primary">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{calculateNights()} nights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guests:</span>
                  <span className="font-medium">{adults} adults, {children} children</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Submit Button */}
        <Button 
          type="submit" 
          className="w-full btn-primary tech-glow h-14 text-lg group relative overflow-hidden"
          disabled={!startDate || !endDate || isLoading || !user}
        >
          <div className="flex items-center justify-center">
            {submitted ? (
              <>
                <Check className="mr-3 h-5 w-5 animate-pulse" />
                {t.bookingForm.bookingConfirmed}
              </>
            ) : (
              <>
                <Sparkles className="mr-3 h-5 w-5 group-hover:animate-pulse" />
                {t.bookingForm.checkAvailability}
              </>
            )}
          </div>
          
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-light/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </form>
    </div>
  );
}

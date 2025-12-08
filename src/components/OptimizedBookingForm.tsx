import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { logger } from '@/utils/logger';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptimizedBookings } from "@/hooks/useOptimizedBookings";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface BookingFormProps {
  propertyId?: number;
}

export default function OptimizedBookingForm({ propertyId }: BookingFormProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { createBooking } = useOptimizedBookings();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to make a booking");
      return;
    }

    if (!propertyId) {
      toast.error("Property ID is required");
      return;
    }

    setIsLoading(true);
    
    try {
      await createBooking({
        user_id: user.id,
        property_id: propertyId,
        check_in_date: startDate.toISOString().split('T')[0],
        check_out_date: endDate.toISOString().split('T')[0],
        guests: parseInt(adults) + parseInt(children),
        total_amount: 0, // Calculate based on property price and dates
        guest_details: {
          adults: parseInt(adults),
          children: parseInt(children),
        },
        status: 'pending',
        payment_status: 'pending',
      });
      
      setSubmitted(true);
      toast.success("Booking submitted successfully!");
    } catch (error) {
      logger.error("Booking failed:", error);
      // Error already shown by hook
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-success/10 border border-success/30 dark:bg-success/20 dark:border-success/40 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-success mb-2">
          Booking Submitted Successfully!
        </h3>
        <p className="text-success/80">
          We will contact you shortly to confirm your booking details.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-6 text-foreground">
        {t.booking.title}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check-in Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Check-in Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Check-out Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date() || (startDate && date <= startDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Adults */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Adults
            </label>
            <Select value={adults} onValueChange={setAdults}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "Adult" : "Adults"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Children
            </label>
            <Select value={children} onValueChange={setChildren}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "Child" : "Children"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Submit Booking"}
        </Button>
      </form>
    </div>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, MapPin } from "lucide-react";
import { format } from "date-fns";

// Extend the event schema for the form
const eventFormSchema = insertEventSchema.extend({
  bannerImage: z.instanceof(FileList).optional(),
  draftMode: z.boolean().default(false),
  startDateTime: z.string().min(1, "Start date and time is required"),
  endDateTime: z.string().min(1, "End date and time is required"),
  offerId: z.string().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AUD"]).default("INR"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess: () => void;
  existingData?: any;
}

export default function EventForm({ onSuccess, existingData }: EventFormProps) {
  const { businessPartner } = useAuth();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(existingData?.bannerImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available offers for the dropdown
  const { data: offers } = useQuery({
    queryKey: ["/api/offers", "active"],
    enabled: !!businessPartner,
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      hostId: businessPartner?.id,
      name: existingData?.name || "",
      description: existingData?.description || "",
      startDateTime: existingData?.startDate 
        ? format(new Date(existingData.startDate), "yyyy-MM-dd'T'HH:mm") 
        : "",
      endDateTime: existingData?.endDate 
        ? format(new Date(existingData.endDate), "yyyy-MM-dd'T'HH:mm") 
        : "",
      maxParticipants: existingData?.maxParticipants || 50,
      price: existingData?.price || 0,
      requireIdVerification: existingData?.requireIdVerification || false,
      location: existingData?.location || "",
      draftMode: false,
      offerId: existingData?.offerId || "",
      currency: existingData?.currency || "INR",
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending event creation request with data:", data);
      
      // Format the data properly for the API
      const formattedData = {
        ...data,
        maxParticipants: Number(data.maxParticipants),
        price: Number(data.price),
        requireIdVerification: Boolean(data.requireIdVerification),
        draftMode: Boolean(data.draftMode)
      };
      
      console.log("Formatted data for API:", formattedData);
      
      try {
        // Use apiRequest directly without try/catch (it will be caught by the mutation error handler)
        const res = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formattedData),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error response from API:", errorData);
          throw new Error(errorData.message || "Failed to create event");
        }
        
        const result = await res.json();
        console.log("Event creation response:", result);
        return result;
      } catch (error) {
        console.error("Error during API request:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Event created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Event creation mutation error:", error);
      toast({
        title: "Failed to create event",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
    onSettled: () => {
      console.log("Event creation mutation settled");
      setIsSubmitting(false);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      console.log("Updating event with id:", id, "and data:", data);
      
      // Format the data properly for the API
      const formattedData = {
        ...data,
        maxParticipants: Number(data.maxParticipants),
        price: Number(data.price),
        requireIdVerification: Boolean(data.requireIdVerification),
        draftMode: Boolean(data.draftMode)
      };
      
      console.log("Formatted data for API:", formattedData);
      
      try {
        const res = await fetch(`/api/events/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formattedData),
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Error response from API:", errorData);
          throw new Error(errorData.message || "Failed to update event");
        }
        
        const result = await res.json();
        console.log("Event update response:", result);
        return result;
      } catch (error) {
        console.error("Error during API request:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Event updated successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Event update mutation error:", error);
      toast({
        title: "Failed to update event",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
    onSettled: () => {
      console.log("Event update mutation settled");
      setIsSubmitting(false);
    }
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: EventFormValues) => {
    console.log("Form submission started with values:", values);
    setIsSubmitting(true);
    
    try {
      // Validate form before proceeding
      if (!values.startDateTime) {
        console.error("Start date is required");
        toast({
          title: "Validation Error",
          description: "Start date and time is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!values.endDateTime) {
        console.error("End date is required");
        toast({
          title: "Validation Error",
          description: "End date and time is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log("Dates from form:", {
        start: values.startDateTime,
        end: values.endDateTime
      });
      
      // Prepare data object with strictly correctly typed values
      const eventData: Record<string, any> = {
        // Required fields
        hostId: businessPartner?.id, // Ensure hostId is included
        name: values.name,
        startDate: new Date(values.startDateTime).toISOString(),
        endDate: new Date(values.endDateTime).toISOString(),
        
        // Optional fields with proper default values
        description: values.description || "",
        maxParticipants: typeof values.maxParticipants === 'number' ? values.maxParticipants : 50,
        price: typeof values.price === 'number' ? values.price : 0,
        currency: values.currency || "INR",
        requireIdVerification: Boolean(values.requireIdVerification),
        location: values.location || "",
        draftMode: Boolean(values.draftMode)
      };
      
      // Handle optional fields
      if (values.offerId && values.offerId !== '') {
        eventData.offerId = parseInt(values.offerId, 10);
      }
      
      // Handle banner image if available
      if (values.bannerImage && values.bannerImage.length > 0) {
        eventData.bannerImage = imagePreview;
      }
      
      console.log("Submitting event data:", JSON.stringify(eventData, null, 2));
      
      if (existingData?.id) {
        console.log("Updating existing event:", existingData.id);
        updateEventMutation.mutate({ id: existingData.id, data: eventData });
      } else {
        console.log("Creating new event with data:", eventData);
        createEventMutation.mutate(eventData);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting the form",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const saveDraft = () => {
    try {
      console.log("Saving draft...");
      // Get current values and explicitly set draftMode to true
      const currentValues = form.getValues();
      
      // Validate minimum required fields for a draft
      if (!currentValues.name) {
        toast({
          title: "Validation Error",
          description: "Event name is required, even for drafts",
          variant: "destructive",
        });
        return;
      }
      
      // Set draft mode to true
      form.setValue("draftMode", true);
      
      // Log values before submitting
      console.log("Draft values being submitted:", form.getValues());
      
      // Submit the form
      form.handleSubmit(onSubmit)();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "There was a problem saving the draft",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-6 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Event name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g. Business Networking Mixer" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4} 
                        placeholder="Provide details about your event..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bannerImage"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Banner image</FormLabel>
                    <FormControl>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          {imagePreview ? (
                            <div className="mb-4">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="max-h-40 mx-auto object-cover rounded"
                              />
                            </div>
                          ) : (
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          )}
                          <div className="flex text-sm text-gray-600">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                              <span>Upload a file</span>
                              <input
                                id="bannerImage"
                                {...field}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                  onChange(e.target.files);
                                  handleImageChange(e);
                                }}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Start date & time</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="datetime-local" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>End date & time</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="datetime-local" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Maximum participants</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        placeholder="e.g. 50"
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value, 10) || 1);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Price (if any)</FormLabel>
                    <div className="flex space-x-2">
                      <div className="relative rounded-md shadow-sm flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            {form.watch("currency") === "INR" ? "₹" : 
                            form.watch("currency") === "USD" ? "$" : 
                            form.watch("currency") === "EUR" ? "€" : 
                            form.watch("currency") === "GBP" ? "£" : 
                            form.watch("currency") === "AUD" ? "A$" : "₹"}
                          </span>
                        </div>
                        <FormControl>
                          <input 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-7"
                            type="text" 
                            placeholder="0.00"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                              // Only allow numbers and decimal points
                              const value = e.target.value.replace(/[^0-9.]/g, "");
                              
                              // Ensure only one decimal point
                              const parts = value.split(".");
                              const formattedValue = parts.length > 2 
                                ? `${parts[0]}.${parts.slice(1).join("")}`
                                : value;
                                
                              // Convert to number or 0 if empty
                              const numberValue = formattedValue === "" ? 0 : parseFloat(formattedValue);
                              field.onChange(numberValue);
                            }}
                          />
                        </FormControl>
                      </div>
                      <div className="w-24">
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field: currencyField }) => (
                            <Select
                              onValueChange={currencyField.onChange}
                              defaultValue={currencyField.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="INR" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="AUD">AUD</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter address or venue name" 
                      />
                    </FormControl>
                    <div className="mt-2 bg-gray-100 h-48 rounded-md flex items-center justify-center text-gray-500">
                      <MapPin className="mr-2 h-5 w-5" /> 
                      <span>Google Maps will be integrated here</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requireIdVerification"
                render={({ field }) => (
                  <FormItem className="col-span-6 flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Require ID verification from participants
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="offerId"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Attach promotional offer</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {offers?.map((offer: any) => (
                          <SelectItem key={offer.id} value={offer.id.toString()}>
                            {offer.text} - {offer.percentage}% off
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      You can create new offers from the Offers tab
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isSubmitting}
              className="mr-3"
            >
              Save as Draft
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingData?.id ? "Update" : "Create"} Event
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

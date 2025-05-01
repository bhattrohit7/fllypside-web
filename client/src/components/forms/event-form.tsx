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
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
      const res = await apiRequest("PUT", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
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
    setIsSubmitting(true);
    
    // Convert dates to proper format
    const formData = new FormData();
    formData.append("hostId", businessPartner?.id?.toString() || "");
    formData.append("name", values.name);
    formData.append("description", values.description || "");
    
    // Convert string dates to Date objects
    const startDate = new Date(values.startDateTime);
    const endDate = new Date(values.endDateTime);
    
    formData.append("startDate", startDate.toISOString());
    formData.append("endDate", endDate.toISOString());
    formData.append("maxParticipants", values.maxParticipants.toString());
    formData.append("price", values.price.toString());
    formData.append("requireIdVerification", values.requireIdVerification.toString());
    formData.append("location", values.location);
    formData.append("draftMode", values.draftMode.toString());
    
    if (values.offerId) {
      formData.append("offerId", values.offerId);
    }
    
    // Append banner image if available
    if (values.bannerImage && values.bannerImage.length > 0) {
      formData.append("bannerImage", values.bannerImage[0]);
    }
    
    if (existingData?.id) {
      updateEventMutation.mutate({ id: existingData.id, data: formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const saveDraft = () => {
    const currentValues = form.getValues();
    form.setValue("draftMode", true);
    form.handleSubmit(onSubmit)();
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
                    <FormControl>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            {form.watch("currency") === "INR" ? "₹" : 
                            form.watch("currency") === "USD" ? "$" : 
                            form.watch("currency") === "EUR" ? "€" : 
                            form.watch("currency") === "GBP" ? "£" : 
                            form.watch("currency") === "AUD" ? "A$" : "₹"}
                          </span>
                        </div>
                        <Input 
                          {...field}
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          className="pl-7 pr-12"
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">{form.watch("currency")}</span>
                        </div>
                      </div>
                    </FormControl>
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

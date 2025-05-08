import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfferSchema } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { format, addMonths } from "date-fns";

// Extend offer schema for form
const offerFormSchema = insertOfferSchema.extend({
  startDateOption: z.enum(["now", "custom"]),
  expiryDateOption: z.enum(["never", "custom"]),
  customStartDate: z.string().optional(),
  customExpiryDate: z.string().optional(),
  linkToAllEvents: z.boolean().default(false),
  offerCode: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

interface OfferFormProps {
  onSuccess: () => void;
  existingData?: any;
}

export default function OfferForm({ onSuccess, existingData }: OfferFormProps) {
  const { businessPartner } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default expiry date (3 months from now)
  const defaultExpiryDate = format(addMonths(new Date(), 3), "yyyy-MM-dd");
  
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      businessPartnerId: businessPartner?.id,
      name: existingData?.name || "",
      text: existingData?.text || "",
      percentage: existingData?.percentage || 10,
      startDate: existingData?.startDate ? new Date(existingData.startDate) : new Date(),
      expiryDate: existingData?.expiryDate ? new Date(existingData.expiryDate) : undefined,
      startDateOption: "now",
      expiryDateOption: existingData?.expiryDate ? "custom" : "never",
      customStartDate: existingData?.startDate ? format(new Date(existingData.startDate), "yyyy-MM-dd") : "",
      customExpiryDate: existingData?.expiryDate ? format(new Date(existingData.expiryDate), "yyyy-MM-dd") : defaultExpiryDate,
      linkToAllEvents: existingData?.linkToAllEvents || false,
      offerCode: existingData?.offerCode || "",
    }
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/offers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Offer created",
        description: "Your promotional offer has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to create offer",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/offers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Offer updated",
        description: "Your promotional offer has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update offer",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const { data: events } = useQuery({
    queryKey: ["/api/events", "upcoming"],
    enabled: !!businessPartner,
  });

  // Handle form submission
  const onSubmit = (values: OfferFormValues) => {
    setIsSubmitting(true);
    
    // Create the data object for API submission
    const submitData = {
      businessPartnerId: businessPartner?.id,
      text: values.text,
      percentage: values.percentage,
      startDate: values.startDateOption === "now" 
        ? new Date() 
        : new Date(values.customStartDate || ""),
      expiryDate: values.expiryDateOption === "custom" 
        ? new Date(values.customExpiryDate || "") 
        : undefined,
      linkToAllEvents: values.linkToAllEvents,
      offerCode: values.offerCode,
    };

    if (existingData?.id) {
      updateOfferMutation.mutate({ id: existingData.id, data: submitData });
    } else {
      createOfferMutation.mutate(submitData);
    }
  };

  // Watch form values to conditionally render fields
  const startDateOption = form.watch("startDateOption");
  const expiryDateOption = form.watch("expiryDateOption");

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
                    <FormLabel>Offer name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g. Early Bird Special"
                      />
                    </FormControl>
                    <FormDescription>
                      A short name to identify this offer in listings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Offer text</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={3} 
                        placeholder="Describe the offer..."
                      />
                    </FormControl>
                    <FormDescription>
                      This text will be displayed to customers. Be clear about what's included in the offer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Discount percentage</FormLabel>
                    <FormControl>
                      <div className="relative rounded-md shadow-sm">
                        <Input 
                          {...field} 
                          type="number" 
                          min="1" 
                          max="100"
                          placeholder="0"
                          className="pr-12"
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value, 10) || 1);
                          }}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="offerCode"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Offer code (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g. SUMMER20"
                      />
                    </FormControl>
                    <FormDescription>
                      A code that customers can enter to redeem this offer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDateOption"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-2"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="now" />
                          </FormControl>
                          <FormLabel className="font-normal">Start now</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="custom" />
                          </FormControl>
                          <FormLabel className="font-normal">Custom date</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {startDateOption === "custom" && (
                <FormField
                  control={form.control}
                  name="customStartDate"
                  render={({ field }) => (
                    <FormItem className="col-span-6 sm:col-span-3">
                      <FormLabel>Custom start date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="expiryDateOption"
                render={({ field }) => (
                  <FormItem className="col-span-6 sm:col-span-3">
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-2"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="never" />
                          </FormControl>
                          <FormLabel className="font-normal">No expiry</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="custom" />
                          </FormControl>
                          <FormLabel className="font-normal">Custom date</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {expiryDateOption === "custom" && (
                <FormField
                  control={form.control}
                  name="customExpiryDate"
                  render={({ field }) => (
                    <FormItem className="col-span-6 sm:col-span-3">
                      <FormLabel>Custom expiry date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="linkToAllEvents"
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
                        Link this offer to all of my events
                      </FormLabel>
                      <FormDescription>
                        This offer will be automatically attached to all your upcoming events
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingData?.id ? "Update" : "Create"} Offer
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

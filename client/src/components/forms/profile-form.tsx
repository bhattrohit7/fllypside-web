import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BusinessPartner, insertBusinessPartnerSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

// Extended schema for the profile form
const profileFormSchema = insertBusinessPartnerSchema.extend({
  interestsSelection: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  existingData?: Partial<BusinessPartner>;
}

// Available interests to select from
const availableInterests = [
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business Networking" },
  { id: "marketing", label: "Marketing" },
  { id: "social-media", label: "Social Media" },
  { id: "finance", label: "Finance" },
  { id: "travel", label: "Travel" },
  { id: "food", label: "Food & Beverage" },
  { id: "health", label: "Health & Wellness" },
  { id: "education", label: "Education" },
  { id: "entertainment", label: "Entertainment" }
];

export default function ProfileForm({ onCancel, onSuccess, existingData }: ProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Convert date to proper format for date input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "yyyy-MM-dd");
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      userId: user?.id,
      firstName: existingData?.firstName || "",
      lastName: existingData?.lastName || "",
      contactNumber: existingData?.contactNumber || "",
      sex: existingData?.sex || "M",
      dob: existingData?.dob ? new Date(existingData.dob) : undefined,
      info: existingData?.info || "",
      idNumber: existingData?.idNumber || "",
      idVerified: existingData?.idVerified || false,
      isBusiness: existingData?.isBusiness || false,
      isLost: existingData?.isLost || false,
      currentCity: existingData?.currentCity || "",
      relationshipStatus: existingData?.relationshipStatus || "",
      lookingFor: existingData?.lookingFor || "serious",
      socialInfo: existingData?.socialInfo || "",
      interestsSelection: existingData?.interests as string[] || []
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const { interestsSelection, ...profileData } = data;
      
      const payload = {
        ...profileData,
        interests: interestsSelection
      };

      if (existingData?.id) {
        // Update existing profile
        const res = await apiRequest("PUT", `/api/profile/${existingData.id}`, payload);
        return res.json();
      } else {
        // Create new profile
        const res = await apiRequest("POST", "/api/profile", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const onSubmit = (data: ProfileFormValues) => {
    setIsSubmitting(true);
    updateProfileMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-6 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>Contact number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="10-digit mobile number" />
                </FormControl>
                <FormDescription>Must be a 10-digit number</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    value={field.value ? formatDateForInput(field.value.toString()) : ""}
                    onChange={(e) => {
                      field.onChange(e.target.value ? new Date(e.target.value) : undefined);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>ID number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Must be 12-16 characters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currentCity"
            render={({ field }) => (
              <FormItem className="col-span-6 sm:col-span-3">
                <FormLabel>Current city</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="relationshipStatus"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Relationship status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="relationship">In a relationship</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="complicated">It's complicated</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lookingFor"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Looking for</FormLabel>
                <FormControl>
                  <RadioGroup 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="serious" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Business partnerships (Serious)
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="fun" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Networking (Fun)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="interestsSelection"
            render={() => (
              <FormItem className="col-span-6">
                <div className="mb-4">
                  <FormLabel className="text-base">Interests</FormLabel>
                  <FormDescription>
                    Select all interests that apply to you
                  </FormDescription>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableInterests.map((interest) => (
                    <FormField
                      key={interest.id}
                      control={form.control}
                      name="interestsSelection"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={interest.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(interest.id)}
                                onCheckedChange={(checked) => {
                                  const updatedInterests = checked
                                    ? [...(field.value || []), interest.id]
                                    : field.value?.filter((value) => value !== interest.id) || [];
                                  field.onChange(updatedInterests);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {interest.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isBusiness"
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
                    I am representing a registered business
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="info"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>About</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={3} 
                    placeholder="Tell us about yourself or your business..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="socialInfo"
            render={({ field }) => (
              <FormItem className="col-span-6">
                <FormLabel>Social info</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={2} 
                    placeholder="Social media accounts, website, etc."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}

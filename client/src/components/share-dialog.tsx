import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail, Share2, CopyCheck, Copy, Link } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface ShareDialogProps {
  title: string;
  description?: string;
  url: string;
  image?: string;
  trigger: React.ReactNode;
  eventId: number;
}

export function ShareDialog({ title, description, url, image, trigger, eventId }: ShareDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [recipient, setRecipient] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  
  const copyTimeout = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyTimeout();
      toast({
        title: "Link Copied",
        description: "Event link has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Try again.",
        variant: "destructive",
      });
    }
  };

  const shareEmail = useMutation({
    mutationFn: async (data: { to: string; from: string; message?: string }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/share`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.emailSent === false) {
        // Email couldn't be sent but we have fallback options
        toast({
          title: "Email not sent",
          description: data.message || "Email could not be sent. Try sharing the link directly.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation Sent",
          description: "Your event invitation has been sent successfully.",
        });
      }
      setOpen(false);
      setRecipient("");
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Sharing Failed",
        description: error.message || "Failed to share event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShareViaEmail = () => {
    if (!recipient) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    // Get sender email - either from businessPartner or user or use default email
    const fromEmail = user?.email || "noreply@flypside.com";

    shareEmail.mutate({
      to: recipient,
      from: fromEmail,
      message: message || undefined,
    });
  };

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    let shareUrl = '';
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description || '');

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }

    // Open in a new window
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share Event</DialogTitle>
          <DialogDescription className="text-center">
            Share this event with your network
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <Link className="mr-2 h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="mr-2 h-4 w-4" />
              Social
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="link">Event Link</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="link" 
                  value={url} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={copyToClipboard}
                >
                  {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input 
                id="recipient" 
                type="email"
                placeholder="colleague@company.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea 
                id="message" 
                placeholder="I thought you might be interested in this event..."
                className="min-h-[100px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <Button 
              type="button" 
              className="w-full"
              onClick={handleShareViaEmail}
              disabled={shareEmail.isPending}
            >
              {shareEmail.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center gap-2 p-6"
                onClick={() => handleSocialShare('facebook')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                <span>Facebook</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center gap-2 p-6"
                onClick={() => handleSocialShare('twitter')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                <span>Twitter</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center gap-2 p-6"
                onClick={() => handleSocialShare('linkedin')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                <span>LinkedIn</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
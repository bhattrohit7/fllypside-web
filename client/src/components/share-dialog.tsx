import { useState } from 'react';
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
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail, Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";

interface ShareDialogProps {
  title: string;
  description?: string;
  url: string;
  image?: string;
  trigger: React.ReactNode;
}

export function ShareDialog({ title, description, url, image, trigger }: ShareDialogProps) {
  const { toast } = useToast();
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState(`Check out this event: ${title}`);
  const [open, setOpen] = useState(false);
  
  // Function to handle copying to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: "You can now paste the link wherever you want",
        action: (
          <ToastAction altText="Close">Close</ToastAction>
        ),
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Permission denied. Please try again.",
        variant: "destructive",
      });
    });
  };
  
  // Function to handle email sharing
  const handleEmailShare = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailTo) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    const emailSubject = encodeURIComponent(`Invitation: ${title}`);
    const emailBody = encodeURIComponent(emailMessage);
    
    window.open(`mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}%0A%0A${encodeURIComponent(url)}`);
    
    toast({
      title: "Email client opened",
      description: "An email has been drafted with your invitation",
    });
    
    // Reset form
    setEmailTo('');
    setEmailMessage(`Check out this event: ${title}`);
    setOpen(false);
  };
  
  // Share on social media functions
  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check out this event: ${title} ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };
  
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };
  
  const shareOnLinkedIn = () => {
    const summary = encodeURIComponent(`Check out this event: ${title}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${summary}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this event</DialogTitle>
          <DialogDescription>
            Invite others to this event through different channels
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Event Link
              </Label>
              <Input
                id="link"
                value={url}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="px-3 flex-shrink-0"
              onClick={copyToClipboard}
            >
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Social Media Sharing */}
          <div className="space-y-2">
            <Label>Share on social media</Label>
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center bg-[#1DA1F2] text-white hover:bg-[#1a94df] border-none"
                onClick={shareOnTwitter}
              >
                <Twitter className="h-4 w-4 mr-2" />
                <span>Twitter</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center bg-[#3b5998] text-white hover:bg-[#344e86] border-none"
                onClick={shareOnFacebook}
              >
                <Facebook className="h-4 w-4 mr-2" />
                <span>Facebook</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex-1 flex items-center justify-center bg-[#0077b5] text-white hover:bg-[#006da7] border-none"
                onClick={shareOnLinkedIn}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                <span>LinkedIn</span>
              </Button>
            </div>
          </div>
          
          {/* Email Sharing Form */}
          <form onSubmit={handleEmailShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Share via Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="bg-gray-50"
              />
            </div>
            <Button type="submit" className="w-full flex items-center justify-center">
              <Mail className="h-4 w-4 mr-2" />
              <span>Send Email Invitation</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
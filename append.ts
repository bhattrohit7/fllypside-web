  
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Make sure the event belongs to the business partner
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent || existingEvent.hostId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
      
      await storage.deleteEvent(eventId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // Event cancellation endpoint
  app.post("/api/events/:id/cancel", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Cancellation reason is required" });
      }
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Make sure the event belongs to the business partner
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent || existingEvent.hostId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to cancel this event" });
      }
      
      // Check if event starts at least 24 hours from now
      const now = new Date();
      const eventStartTime = new Date(existingEvent.startDate);
      const timeDifference = eventStartTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      if (hoursDifference < 24) {
        return res.status(400).json({ 
          message: "Events can only be cancelled if they start more than 24 hours from now",
          hoursUntilStart: Math.round(hoursDifference)
        });
      }
      
      // Cancel the event
      const cancelledEvent = await storage.cancelEvent(eventId, reason);
      
      // Return success
      res.status(200).json({
        message: "Event cancelled successfully",
        event: cancelledEvent
      });
    } catch (error) {
      console.error("Error cancelling event:", error);
      res.status(500).json({ message: "Failed to cancel event", error: String(error) });
    }
  });
  
  // Offer routes
  app.get("/api/offers", async (req, res) => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string || "active"; // active, expired
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      const offers = await storage.getOffersByBusinessPartnerId(businessPartner.id, status);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });
  
  app.get("/api/offers/:id", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      const offer = await storage.getOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      // Check if the offer belongs to the business partner
      if (offer.businessPartnerId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to view this offer" });
      }
      
      res.json(offer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offer" });
    }
  });
  
  app.post("/api/offers", async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Prepare data with required fields
      const offerData = {
        businessPartnerId: businessPartner.id,
        text: req.body.text,
        percentage: req.body.percentage,
        startDate: new Date(req.body.startDate),
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null
      };
      
      // Validate the data
      const validatedData = insertOfferSchema.parse(offerData);
      
      // Create the offer
      const offer = await storage.createOffer(validatedData);
      
      // If linkToAllEvents is true, handle linking
      if (req.body.linkToAllEvents === true) {
        await storage.linkOfferToAllEvents(offer.id, businessPartner.id);
      }
      
      res.status(201).json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create offer" });
    }
  });
  
  app.put("/api/offers/:id", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Make sure the offer belongs to the business partner
      const existingOffer = await storage.getOffer(offerId);
      if (!existingOffer || existingOffer.businessPartnerId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to update this offer" });
      }
      
      // Update the offer
      const updatedOffer = await storage.updateOffer(offerId, req.body);
      
      // Handle linking to events if requested
      if (req.body.linkToAllEvents === true) {
        await storage.linkOfferToAllEvents(offerId, businessPartner.id);
      }
      
      res.json(updatedOffer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update offer" });
    }
  });
  
  app.delete("/api/offers/:id", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Make sure the offer belongs to the business partner
      const existingOffer = await storage.getOffer(offerId);
      if (!existingOffer || existingOffer.businessPartnerId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to delete this offer" });
      }
      
      await storage.deleteOffer(offerId);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete offer" });
    }
  });
  
  // Offer events route - get all events linked to a specific offer
  app.get("/api/offers/:id/events", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Make sure the offer belongs to the business partner
      const existingOffer = await storage.getOffer(offerId);
      if (!existingOffer || existingOffer.businessPartnerId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to view this offer's events" });
      }
      
      // Get events that use this offer
      const eventOffers = await storage.getEventsByOfferId(offerId);
      
      res.json(eventOffers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch offer events" });
    }
  });

  // Event invitation email route
  app.post("/api/events/:id/invite", async (req, res) => {
    try {
      const { recipients, message } = req.body;
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: "At least one recipient email is required" });
      }

      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }

      // Make sure the event belongs to the business partner
      const event = await storage.getEvent(eventId);
      if (!event || event.hostId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to send invitations for this event" });
      }

      // Format the dates for display
      const formatEventDate = (startDate: Date, endDate?: Date) => {
        const startFormatted = format(new Date(startDate), "MMM d, yyyy h:mm a");
        if (endDate) {
          const endFormatted = format(new Date(endDate), "MMM d, yyyy h:mm a");
          return `${startFormatted} to ${endFormatted}`;
        }
        return startFormatted;
      };

      const eventDate = formatEventDate(event.startDate, event.endDate);
      
      // Send invitation to each recipient
      const results = await Promise.all(
        recipients.map(async (email: string) => {
          try {
            const result = await sendEventInvitation({
              to: email,
              from: "noreply@flypside.com", // This should be a verified sender in your SendGrid account
              eventName: event.name,
              hostName: `${businessPartner.firstName} ${businessPartner.lastName}`,
              eventDate,
              location: event.location || "Location to be announced",
              price: event.price ? `${getCurrencySymbol(event.currency)}${event.price}` : "Free",
              personalMessage: message || "",
              eventLink: `${process.env.SITE_URL || "https://flypside.com"}/events/${event.id}`
            });
            
            return { email, success: result.success, message: result.message };
          } catch (error) {
            console.error(`Error sending invitation to ${email}:`, error);
            return { email, success: false, message: String(error) };
          }
        })
      );
      
      res.json({ 
        message: "Invitations processed", 
        results,
        successCount: results.filter(r => r.success).length,
        totalCount: results.length 
      });
    } catch (error) {
      console.error("Error processing invitations:", error);
      res.status(500).json({ message: "Failed to send invitations", error: String(error) });
    }
  });

  // Event participants route
  app.get("/api/events/:id/participants", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Make sure the event belongs to the business partner
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent || existingEvent.hostId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to view participants for this event" });
      }
      
      // Get event participants
      const participants = await storage.getEventParticipants(eventId);
      
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event participants" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/events", async (req, res) => {
    try {
      const userId = req.user!.id;
      const { period } = req.query;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Calculate date range based on period
      const now = new Date();
      let startDate;
      
      if (period === '3months') {
        startDate = subMonths(now, 3);
      } else if (period === '6months') {
        startDate = subMonths(now, 6);
      } else if (period === 'year') {
        startDate = subMonths(now, 12);
      } else {
        // Default to 1 month
        startDate = subMonths(now, 1);
      }
      
      // Preferably do analytics in the database
      // For now, we'll just return some basic stats
      const allEvents = await storage.getEventsByBusinessPartnerId(businessPartner.id, 'all');
      
      // Filter events within the date range
      const eventsInPeriod = allEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= startDate && eventDate <= now;
      });
      
      // Calculate stats
      const totalEvents = eventsInPeriod.length;
      const upcomingEvents = allEvents.filter(e => new Date(e.startDate) > now).length;
      const cancelledEvents = eventsInPeriod.filter(e => e.status === 'cancelled').length;
      const completedEvents = eventsInPeriod.filter(e => 
        e.status !== 'cancelled' && new Date(e.endDate) < now
      ).length;
      
      // Total participants across all completed events
      const totalParticipants = eventsInPeriod.reduce((sum, event) => {
        if (event.currentParticipants && event.status !== 'cancelled') {
          return sum + event.currentParticipants;
        }
        return sum;
      }, 0);
      
      // Calculate total revenue (in the event's currency)
      const revenueByEvent = eventsInPeriod.map(event => {
        if (event.status !== 'cancelled' && event.price && event.currentParticipants) {
          return { 
            currency: event.currency || businessPartner.preferredCurrency || 'INR',
            amount: event.price * event.currentParticipants
          };
        }
        return null;
      }).filter(Boolean);
      
      // Group revenue by currency
      const revenueByCurrency = revenueByEvent.reduce((acc, revenue) => {
        if (revenue) {
          if (!acc[revenue.currency]) {
            acc[revenue.currency] = 0;
          }
          acc[revenue.currency] += revenue.amount;
        }
        return acc;
      }, {} as Record<string, number>);
      
      // Months data for chart
      const labels = [];
      const participantsData = [];
      const revenueData = [];
      
      // Create 6 data points (e.g., for the last 6 months)
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthLabel = format(monthDate, 'MMM yyyy');
        labels.push(monthLabel);
        
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        // Events in this month
        const monthEvents = eventsInPeriod.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= monthStart && eventDate <= monthEnd && event.status !== 'cancelled';
        });
        
        // Participants in this month
        const monthParticipants = monthEvents.reduce((sum, event) => {
          return sum + (event.currentParticipants || 0);
        }, 0);
        participantsData.push(monthParticipants);
        
        // Revenue in this month (using a default currency for simplicity)
        const monthRevenue = monthEvents.reduce((sum, event) => {
          if (event.price && event.currentParticipants) {
            return sum + event.price * event.currentParticipants;
          }
          return sum;
        }, 0);
        revenueData.push(monthRevenue);
      }
      
      res.json({
        totalEvents,
        upcomingEvents,
        cancelledEvents,
        completedEvents,
        totalParticipants,
        revenueByCurrency,
        chart: {
          labels,
          datasets: [
            {
              name: 'Participants',
              data: participantsData
            },
            {
              name: 'Revenue',
              data: revenueData
            }
          ]
        }
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Share event via email
  app.post("/api/events/:id/share", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { email, message } = req.body;
      const userId = req.user!.id;
      
      if (!email) {
        return res.status(400).json({ message: "Recipient email is required" });
      }
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Get the event
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Format the dates for display
      const formatEventDate = (startDate: Date, endDate?: Date) => {
        const startFormatted = format(new Date(startDate), "MMM d, yyyy h:mm a");
        if (endDate) {
          const endFormatted = format(new Date(endDate), "MMM d, yyyy h:mm a");
          return `${startFormatted} to ${endFormatted}`;
        }
        return startFormatted;
      };

      const eventDate = formatEventDate(event.startDate, event.endDate);
      
      // Send the email
      const result = await sendEventInvitation({
        to: email,
        from: "noreply@flypside.com", // This should be a verified sender in your SendGrid account
        eventName: event.name,
        hostName: `${businessPartner.firstName} ${businessPartner.lastName}`,
        eventDate,
        location: event.location || "Location to be announced",
        price: event.price ? `${getCurrencySymbol(event.currency)}${event.price}` : "Free",
        personalMessage: message || "Check out this event I found on Flypside!",
        eventLink: `${process.env.SITE_URL || "https://flypside.com"}/events/${event.id}`,
        isShare: true
      });
      
      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      console.error("Share event error:", error);
      res.status(500).json({ message: "Failed to share event", error: String(error) });
    }
  });

  // Helper function to get currency symbol
  function getCurrencySymbol(currency: string | null): string {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AUD': return 'A$';
      case 'INR': 
      default:
        return '₹';
    }
  }

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

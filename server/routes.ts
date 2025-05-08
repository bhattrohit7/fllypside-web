import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { dbStorage } from "./storage-db";
import { z } from "zod";
import { insertBusinessPartnerSchema, insertEventSchema, insertOfferSchema } from "@shared/schema";
import { format, subMonths, addDays } from "date-fns";
import { sendEventInvitation } from "./utils/sendgrid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Business partner profile routes
  app.get("/api/profile", async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getBusinessPartnerByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  app.post("/api/profile", async (req, res) => {
    try {
      const userId = req.user!.id;
      req.body.userId = userId;
      
      const validatedData = insertBusinessPartnerSchema.parse(req.body);
      const profile = await storage.createBusinessPartner(validatedData);
      
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create profile" });
    }
  });
  
  app.put("/api/profile/:id", async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Make sure the profile belongs to the current user
      const existingProfile = await storage.getBusinessPartner(profileId);
      if (!existingProfile || existingProfile.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }
      
      req.body.userId = userId;
      const validatedData = insertBusinessPartnerSchema.parse(req.body);
      const updatedProfile = await storage.updateBusinessPartner(profileId, validatedData);
      
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string || "upcoming"; // upcoming, past, cancelled, draft
      
      console.log("GET /api/events with status:", status, "query params:", req.query);
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Get events from storage based on the requested status
      const events = await storage.getEventsByBusinessPartnerId(businessPartner.id, status);
      console.log(`Fetched ${events.length} events with status '${status}'`);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if the event belongs to the business partner
      if (event.hostId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to view this event" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });
  
  app.post("/api/events", async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("Creating event for user ID:", userId);
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      console.log("Found business partner:", businessPartner?.id);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Log received data for debugging
      console.log("Received event data:", JSON.stringify(req.body, null, 2));
      
      // Convert date strings from form to proper dates
      let startDate, endDate;
      try {
        if (req.body.startDate) {
          startDate = new Date(req.body.startDate);
        } else if (req.body.startDateTime) {
          startDate = new Date(req.body.startDateTime);
        } else {
          throw new Error("Start date is required");
        }
        
        if (req.body.endDate) {
          endDate = new Date(req.body.endDate);
        } else if (req.body.endDateTime) {
          endDate = new Date(req.body.endDateTime);
        } else {
          throw new Error("End date is required");
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      // Prepare data for validation
      const eventData: any = {
        hostId: businessPartner.id,
        name: req.body.name || "Untitled Event",
        startDate,
        endDate,
        description: req.body.description || null,
        price: typeof req.body.price === 'number' ? req.body.price : 0,
        maxParticipants: typeof req.body.maxParticipants === 'number' ? req.body.maxParticipants : 50,
        location: req.body.location || null,
        currency: req.body.currency || "INR",
        requireIdVerification: req.body.requireIdVerification === true,
        draftMode: req.body.draftMode === true,
        bannerImage: req.body.bannerImage || null
      };

      // Handle offer ID properly
      if (req.body.offerId !== undefined && req.body.offerId !== null && req.body.offerId !== '') {
        eventData.offerId = parseInt(req.body.offerId);
      } else {
        eventData.offerId = null;
      }
      
      console.log("Processed event data:", JSON.stringify(eventData, null, 2));
      
      try {
        // Validate the data against the schema
        const validatedData = insertEventSchema.parse(eventData);
        console.log("Validated data:", JSON.stringify(validatedData, null, 2));
        
        // Create the event
        const event = await storage.createEvent(validatedData);
        console.log("Event created successfully:", JSON.stringify(event, null, 2));
        
        // Return the created event with success status
        res.status(201).json({
          ...event,
          message: "Event created successfully"
        });
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation failed: " + validationError.errors[0].message,
            errors: validationError.errors,
            path: validationError.errors[0].path.join('.')
          });
        }
        throw validationError; // Re-throw if it's not a ZodError
      }
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(500).json({ 
        message: "Failed to create event", 
        error: String(error)
      });
    }
  });
  
  app.put("/api/events/:id", async (req, res) => {
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
        return res.status(403).json({ message: "Not authorized to update this event" });
      }
      
      // Log received data for debugging
      console.log("Received event update data:", JSON.stringify(req.body, null, 2));
      
      // Convert date strings from form to proper dates
      let startDate, endDate;
      try {
        if (req.body.startDate) {
          startDate = new Date(req.body.startDate);
        } else if (req.body.startDateTime) {
          startDate = new Date(req.body.startDateTime);
        } else {
          throw new Error("Start date is required");
        }
        
        if (req.body.endDate) {
          endDate = new Date(req.body.endDate);
        } else if (req.body.endDateTime) {
          endDate = new Date(req.body.endDateTime);
        } else {
          throw new Error("End date is required");
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      // Prepare data for validation
      const eventData: any = {
        hostId: businessPartner.id,
        name: req.body.name || existingEvent.name,
        startDate,
        endDate,
        description: req.body.description || existingEvent.description,
        price: typeof req.body.price === 'number' ? req.body.price : existingEvent.price,
        maxParticipants: typeof req.body.maxParticipants === 'number' ? req.body.maxParticipants : existingEvent.maxParticipants,
        location: req.body.location || existingEvent.location,
        currency: req.body.currency || existingEvent.currency,
        requireIdVerification: req.body.requireIdVerification === true,
        draftMode: req.body.draftMode === true,
        bannerImage: req.body.bannerImage || existingEvent.bannerImage
      };
      
      // Handle offer ID properly
      if (req.body.offerId !== undefined && req.body.offerId !== null && req.body.offerId !== '') {
        eventData.offerId = parseInt(req.body.offerId);
      } else {
        eventData.offerId = null;
      }
      
      console.log("Processed event update data:", JSON.stringify(eventData, null, 2));
      
      try {
        // For updates, we should use a partial schema that allows partial updates
        // Instead of using the strict insertEventSchema, we'll directly pass the data to updateEvent
        console.log("Sending data for update:", JSON.stringify(eventData, null, 2));
        
        // Update the event
        const event = await storage.updateEvent(eventId, eventData);
        console.log("Event updated successfully:", JSON.stringify(event, null, 2));
        
        // Return the updated event with success status
        res.status(200).json({
          ...event,
          message: "Event updated successfully"
        });
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation failed: " + validationError.errors[0].message,
            errors: validationError.errors,
            path: validationError.errors[0].path.join('.')
          });
        }
        throw validationError; // Re-throw if it's not a ZodError
      }
    } catch (error) {
      console.error("Event update error:", error);
      res.status(500).json({ 
        message: "Failed to update event", 
        error: String(error)
      });
    }
  });
  
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
      
      console.log("GET /api/offers with status:", status, "for user:", userId);
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      console.log("Business partner:", businessPartner?.id);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      console.log("Fetching offers for business partner:", businessPartner.id);
      const offers = await storage.getOffersByBusinessPartnerId(businessPartner.id, status);
      console.log("Found offers:", offers?.length || 0);
      
      res.json(offers);
    } catch (error) {
      console.error("Error in GET /api/offers:", error);
      res.status(500).json({ message: "Failed to fetch offers", error: String(error) });
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
      
      // Prepare data with required fields
      const offerData = {
        businessPartnerId: businessPartner.id,
        text: req.body.text || existingOffer.text,
        percentage: req.body.percentage !== undefined ? req.body.percentage : existingOffer.percentage,
        startDate: req.body.startDate ? new Date(req.body.startDate) : existingOffer.startDate,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : existingOffer.expiryDate
      };
      
      // Update the offer
      const offer = await storage.updateOffer(offerId, offerData);
      
      // If linkToAllEvents is true, handle linking
      if (req.body.linkToAllEvents === true) {
        await storage.linkOfferToAllEvents(offerId, businessPartner.id);
      }
      
      res.json(offer);
    } catch (error) {
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
  
  // Email invitation
  app.post("/api/events/:id/invite", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { email, personalMessage } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
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
      
      // Format the date for the email
      const formatEventDate = (startDate: Date, endDate?: Date) => {
        const startDateStr = format(new Date(startDate), "PPP");
        const startTimeStr = format(new Date(startDate), "p");
        
        if (!endDate) return `${startDateStr} at ${startTimeStr}`;
        
        const endDateStr = format(new Date(endDate), "PPP");
        const endTimeStr = format(new Date(endDate), "p");
        
        if (startDateStr === endDateStr) {
          return `${startDateStr} from ${startTimeStr} to ${endTimeStr}`;
        } else {
          return `${startDateStr} at ${startTimeStr} to ${endDateStr} at ${endTimeStr}`;
        }
      };
      
      // Generate a URL for the event (frontend would handle this)
      const eventUrl = `https://flypside.co/events/${event.id}`;
      
      // Send email invitation
      const result = await sendEventInvitation({
        to: email,
        from: "invitations@flypside.co",
        eventName: event.name,
        eventDate: formatEventDate(event.startDate, event.endDate),
        eventLocation: event.location || "TBA",
        eventUrl,
        personalMessage
      });
      
      if (result.success) {
        res.json({ message: "Invitation sent successfully" });
      } else {
        res.status(500).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation", error: String(error) });
    }
  });
  
  // Main Analytics Dashboard
  app.get("/api/analytics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(404).json({ message: "Business partner not found" });
      }
      
      // Get all events for business partner
      const allEvents = await storage.getEventsByBusinessPartnerId(businessPartner.id, 'all');
      const events = allEvents || [];
      
      // For demonstration purposes, we'll generate some sample data to make the analytics visually appealing
      // In a production environment, this would use real data
      
      // Generate better sample data for demo purposes
      const totalEvents = events.length > 0 ? events.length : 12;
      const pastEvents = Math.floor(totalEvents * 0.6);
      const upcomingEvents = Math.floor(totalEvents * 0.3);
      const cancelledEvents = totalEvents - pastEvents - upcomingEvents;
      const totalParticipants = 873;
      const totalRevenue = 426500;
      
      // Format data for charts - participant trends over last 6 months
      const participantTrends = [
        { month: 'Jan', participants: 120 },
        { month: 'Feb', participants: 145 },
        { month: 'Mar', participants: 162 },
        { month: 'Apr', participants: 178 },
        { month: 'May', participants: 205 },
        { month: 'Jun', participants: 238 }
      ];
      
      // Format data for charts - event attendance for top events
      const eventAttendance = [
        { event: 'Tech Summit', capacity: 200, attended: 183 },
        { event: 'Digital Marketing Workshop', capacity: 80, attended: 75 },
        { event: 'Product Launch', capacity: 150, attended: 140 },
        { event: 'Networking Mixer', capacity: 100, attended: 88 },
        { event: 'Innovation Conference', capacity: 250, attended: 215 }
      ];
      
      // Calculate top performing events
      const topEvents = [
        {
          id: 1,
          name: 'Tech Summit 2025',
          date: format(addDays(new Date(), -14), 'dd MMM yyyy'),
          attendanceRate: 92,
          participants: 183,
          revenue: 183000,
          currency: 'INR'
        },
        {
          id: 2,
          name: 'Digital Marketing Workshop',
          date: format(addDays(new Date(), -25), 'dd MMM yyyy'),
          attendanceRate: 94,
          participants: 75,
          revenue: 37500,
          currency: 'INR'
        },
        {
          id: 3,
          name: 'Product Launch Party',
          date: format(addDays(new Date(), -7), 'dd MMM yyyy'),
          attendanceRate: 93,
          participants: 140,
          revenue: 70000,
          currency: 'INR'
        },
        {
          id: 4,
          name: 'Networking Mixer',
          date: format(addDays(new Date(), -21), 'dd MMM yyyy'),
          attendanceRate: 88,
          participants: 88,
          revenue: 44000,
          currency: 'INR'
        },
        {
          id: 5,
          name: 'Innovation Conference',
          date: format(addDays(new Date(), -30), 'dd MMM yyyy'),
          attendanceRate: 86,
          participants: 215,
          revenue: 107500,
          currency: 'INR'
        }
      ];
      
      // Get preferred currency 
      const currency = businessPartner.preferredCurrency || 'INR';
      
      // Get offers or generate sample data
      const offers = await storage.getOffersByBusinessPartnerId(businessPartner.id, 'all');
      const totalOffers = offers.length > 0 ? offers.length : 8;
      const activeOffers = Math.floor(totalOffers * 0.75);
      
      // Growth metrics for display
      const participantsGrowth = 15;
      const eventGrowth = 8;
      const revenueGrowth = 12;
      const offerGrowth = 5;
      
      // Prepare response
      const responseData = {
        summary: {
          totalEvents,
          pastEvents,
          upcomingEvents,
          cancelledEvents,
          participantRate: 91,
          totalOffers,
          activeOffers
        },
        participants: {
          total: totalParticipants,
          growth: participantsGrowth
        },
        events: {
          total: totalEvents,
          completed: pastEvents,
          growth: eventGrowth
        },
        offers: {
          total: totalOffers,
          redemptions: 432,
          growth: offerGrowth
        },
        revenue: {
          total: totalRevenue,
          growth: revenueGrowth,
          currency
        },
        charts: {
          participantTrends,
          eventAttendance
        },
        topEvents
      };
      
      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error in analytics endpoint:", error);
      res.status(500).json({ error: "Failed to retrieve analytics data" });
    }
  });

  // Individual Events Analytics
  app.get("/api/analytics/events", async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // Get all events for the business partner
      const events = await storage.getEventsByBusinessPartnerId(businessPartner.id, "all");
      
      // Calculate metrics
      const currentDate = new Date();
      const threeMonthsAgo = subMonths(currentDate, 3);
      
      let totalEvents = 0;
      let pastEvents = 0;
      let upcomingEvents = 0;
      let cancelledEvents = 0;
      let totalParticipants = 0;
      let totalRevenue = 0;
      let recentEventSeries = Array(12).fill(0);
      
      // Calculate weeks for the past 3 months (approx 12 weeks)
      const weekDates = [];
      for (let i = 0; i < 12; i++) {
        weekDates.push(addDays(threeMonthsAgo, i * 7));
      }
      
      events.forEach(event => {
        totalEvents++;
        
        // Add participants and revenue
        const participants = event.currentParticipants || 0;
        totalParticipants += participants;
        
        // Add revenue based on participants and price
        const eventRevenue = participants * event.price;
        totalRevenue += eventRevenue;
        
        // Categorize by status
        const startDate = new Date(event.startDate);
        if (event.status === 'cancelled') {
          cancelledEvents++;
        } else if (startDate < currentDate) {
          pastEvents++;
        } else {
          upcomingEvents++;
        }
        
        // Add to event series for chart
        // Find which week this event belongs to
        for (let i = 0; i < weekDates.length; i++) {
          if (startDate >= weekDates[i] && (i === weekDates.length - 1 || startDate < weekDates[i + 1])) {
            recentEventSeries[i]++;
            break;
          }
        }
      });
      
      // Calculate participant rate (average filled capacity)
      const participantRate = pastEvents > 0 
        ? (totalParticipants / events.filter(e => new Date(e.startDate) < currentDate)
            .reduce((sum, event) => sum + event.maxParticipants, 0)) * 100
        : 0;
      
      // Format revenue based on business partner's preferred currency
      function getCurrencySymbol(currency: string | null): string {
        switch(currency) {
          case 'USD':
            return '$';
          case 'EUR':
            return '€';
          case 'GBP':
            return '£';
          case 'AUD':
            return 'A$';
          default:
            return '₹';
        }
      }
      
      // Format week labels for chart
      const weekLabels = weekDates.map(date => format(date, "MMM d"));
      
      res.json({
        totalEvents,
        pastEvents,
        upcomingEvents,
        cancelledEvents,
        totalParticipants,
        participantRate: Math.round(participantRate),
        totalRevenue,
        currencySymbol: getCurrencySymbol(businessPartner.preferredCurrency),
        eventSeries: {
          labels: weekLabels,
          data: recentEventSeries
        },
        events: events.map(event => ({
          id: event.id,
          name: event.name,
          date: format(new Date(event.startDate), "PPP"),
          participants: event.currentParticipants || 0,
          maxParticipants: event.maxParticipants,
          occupancyRate: event.maxParticipants > 0 
            ? Math.round((event.currentParticipants || 0) / event.maxParticipants * 100) 
            : 0,
          revenue: (event.currentParticipants || 0) * event.price,
          currencySymbol: getCurrencySymbol(event.currency),
          status: event.status
        }))
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics data", error: String(error) });
    }
  });
  
  // Individual event analytics
  app.get("/api/events/:id/analytics", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
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
      
      // Check if the event belongs to the business partner
      if (event.hostId !== businessPartner.id) {
        return res.status(403).json({ message: "Not authorized to view analytics for this event" });
      }
      
      // Get participants
      const participants = await storage.getEventParticipants(eventId);
      
      // Calculate analytics
      const totalParticipants = participants.length;
      const maxParticipants = event.maxParticipants;
      const registrationRate = maxParticipants > 0 
        ? Math.round((totalParticipants / maxParticipants) * 100) 
        : 0;
      
      // For paid events, calculate revenue metrics
      const isPaidEvent = event.price > 0;
      const totalRevenue = isPaidEvent ? totalParticipants * event.price : 0;
      const averageRevenue = totalParticipants > 0 ? totalRevenue / totalParticipants : 0;
      
      // Sample demographics data (placeholder for now)
      const demographics = {
        'Business': 60,
        'Education': 25,
        'Technology': 15
      };
      
      // Sample engagement metrics (placeholder for now)
      const engagement = {
        'Shares': totalParticipants > 0 ? Math.round(totalParticipants * 0.3) : 0,
        'Rating': '4.7/5',
        'Questions': totalParticipants > 0 ? Math.round(totalParticipants * 1.5) : 0
      };
      
      // Calculate attendance rate (percentage of registered participants who actually attended)
      const attendedParticipants = Math.round(totalParticipants * 0.8); // Estimation for now
      const attendanceRate = totalParticipants > 0 
        ? Math.round((attendedParticipants / totalParticipants) * 100) 
        : 0;

      res.json({
        totalParticipants,
        maxParticipants,
        registrationRate,
        isPaidEvent,
        totalRevenue,
        averageRevenue,
        attendedParticipants,
        attendanceRate,
        demographics,
        engagement
      });
    } catch (error) {
      console.error("Error fetching event analytics:", error);
      res.status(500).json({ message: "Failed to fetch event analytics", error: String(error) });
    }
  });

  // Share event via email
  app.post("/api/events/:id/share", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const { email, personalMessage } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      // Get the event
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Format the date for the email
      const formatEventDate = (startDate: Date, endDate?: Date) => {
        const startDateStr = format(new Date(startDate), "PPP");
        const startTimeStr = format(new Date(startDate), "p");
        
        if (!endDate) return `${startDateStr} at ${startTimeStr}`;
        
        const endDateStr = format(new Date(endDate), "PPP");
        const endTimeStr = format(new Date(endDate), "p");
        
        if (startDateStr === endDateStr) {
          return `${startDateStr} from ${startTimeStr} to ${endTimeStr}`;
        } else {
          return `${startDateStr} at ${startTimeStr} to ${endDateStr} at ${endTimeStr}`;
        }
      };
      
      // Generate a URL for the event (frontend would handle this)
      const eventUrl = `https://flypside.co/events/${event.id}`;
      
      // Send email invitation
      const result = await sendEventInvitation({
        to: email,
        from: "invitations@flypside.co",
        eventName: event.name,
        eventDate: formatEventDate(event.startDate, event.endDate),
        eventLocation: event.location || "TBA",
        eventUrl,
        personalMessage
      });
      
      if (result.success) {
        res.json({ message: "Event shared successfully via email" });
      } else {
        res.status(500).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      res.status(500).json({ message: "Failed to share event", error: String(error) });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
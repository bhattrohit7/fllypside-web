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
      const eventData = {
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

      // Handle offer ID if provided
      if (req.body.offerId) {
        eventData.offerId = parseInt(req.body.offerId);
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
      const eventData = {
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
      
      // Handle offer ID if provided
      if (req.body.offerId) {
        eventData.offerId = parseInt(req.body.offerId);
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
      
      // Set business partner ID
      req.body.businessPartnerId = businessPartner.id;
      
      const validatedData = insertOfferSchema.parse(req.body);
      const offer = await storage.createOffer(validatedData);
      
      // Link to all events if requested
      if (req.body.linkToAllEvents) {
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
      
      // Set business partner ID
      req.body.businessPartnerId = businessPartner.id;
      
      // For updates, we should directly pass the data to updateOffer
      const updatedOffer = await storage.updateOffer(offerId, req.body);
      
      // Update event links if requested
      if (req.body.linkToAllEvents) {
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
  
  // Get events linked to a specific offer
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
        return res.status(403).json({ message: "Not authorized to view events for this offer" });
      }
      
      // Get all event-offer links for this offer
      const eventOffers = await storage.getEventsByOfferId(offerId);
      
      res.json(eventOffers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events linked to offer" });
    }
  });
  
  // Event participants routes
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
      
      const participants = await storage.getEventParticipants(eventId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event participants" });
    }
  });
  
  // Event analytics
  app.get("/api/events/:id/analytics", async (req, res) => {
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
        return res.status(403).json({ message: "Not authorized to view analytics for this event" });
      }
      
      const participants = await storage.getEventParticipants(eventId);
      
      // Calculate analytics data
      const totalParticipants = existingEvent.currentParticipants;
      const maxParticipants = existingEvent.maxParticipants;
      const registrationRate = Math.round((totalParticipants / maxParticipants) * 100);
      
      // For demo purposes, generate attendance data
      const attendedParticipants = Math.floor(totalParticipants * 0.85); // 85% attendance rate
      const attendanceRate = Math.round((attendedParticipants / totalParticipants) * 100);
      
      // Revenue calculations
      const isPaidEvent = existingEvent.price > 0;
      const totalRevenue = existingEvent.price * totalParticipants;
      const averageRevenue = totalParticipants > 0 ? (totalRevenue / totalParticipants) : 0;
      
      // Demographics data (simulated for demo)
      const demographics = {
        'Local': 65,
        'Non-local': 35,
        'First-time': 40,
        'Returning': 60
      };
      
      // Engagement metrics (simulated for demo)
      const engagement = {
        'Shares': Math.floor(totalParticipants * 1.2),
        'Reviews': Math.floor(totalParticipants * 0.6),
        'Comments': Math.floor(totalParticipants * 2.5)
      };
      
      res.json({
        totalParticipants,
        maxParticipants,
        registrationRate,
        attendedParticipants,
        attendanceRate,
        isPaidEvent,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRevenue: Math.round(averageRevenue * 100) / 100,
        demographics,
        engagement
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event analytics" });
    }
  });
  
  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // For demonstration purposes, we'll return mock analytics data
      // In a real application, this would be calculated from actual data
      
      // Use the business partner's preferred currency or default to INR
      const currency = businessPartner.preferredCurrency || 'INR';
      
      const analyticsData = {
        participants: {
          total: 384,
          growth: 28
        },
        events: {
          completed: 12,
          growth: 33
        },
        offers: {
          redemptions: 86,
          growth: 21
        },
        revenue: {
          total: 8245,
          growth: 12,
          currency: currency
        },
        charts: {
          participantTrends: [
            { month: "Jan", participants: 20 },
            { month: "Feb", participants: 35 },
            { month: "Mar", participants: 50 },
            { month: "Apr", participants: 65 },
            { month: "May", participants: 80 },
            { month: "Jun", participants: 95 },
            { month: "Jul", participants: 120 }
          ],
          eventAttendance: [
            { event: "Event 1", capacity: 100, attended: 92 },
            { event: "Event 2", capacity: 50, attended: 48 },
            { event: "Event 3", capacity: 75, attended: 68 },
            { event: "Event 4", capacity: 120, attended: 110 }
          ]
        },
        topEvents: [
          {
            id: 1,
            name: "Business Networking Gala",
            date: "June 15, 2023",
            participants: 78,
            attendanceRate: 98,
            revenue: 3120,
            currency: currency
          },
          {
            id: 2,
            name: "Tech Startup Mixer",
            date: "May 28, 2023",
            participants: 46,
            attendanceRate: 92,
            revenue: 1150,
            currency: currency
          },
          {
            id: 3,
            name: "Summer Business Workshop",
            date: "July 3, 2023",
            participants: 62,
            attendanceRate: 90,
            revenue: 2480,
            currency: currency
          }
        ]
      };
      
      res.json(analyticsData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  
  // Dashboard stats and activities
  app.get("/api/stats", async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // In a real application, these would be calculated from the database
      const stats = {
        totalEvents: 12,
        activeOffers: 5,
        totalParticipants: 143
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  app.get("/api/activities", async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get business partner for the user
      const businessPartner = await storage.getBusinessPartnerByUserId(userId);
      
      if (!businessPartner) {
        return res.status(400).json({ message: "Business partner profile not found" });
      }
      
      // In a real application, these would be fetched from the database
      const activities = [
        {
          id: 1,
          title: "Summer Beach Party",
          status: "Upcoming",
          type: "event",
          link: "/events/1",
          primaryInfo: "July 15, 2023",
          secondaryInfo: "42 participants",
          timeInfo: "3 days from now"
        },
        {
          id: 2,
          title: "Winter Holiday Special",
          status: "Offer Active",
          type: "offer",
          link: "/offers/1",
          primaryInfo: "20% discount",
          secondaryInfo: "15 redemptions",
          timeInfo: "Expires in 7 days"
        },
        {
          id: 3,
          title: "Business Networking Lunch",
          status: "Completed",
          type: "event",
          link: "/events/2",
          primaryInfo: "June 28, 2023",
          secondaryInfo: "38 participants",
          timeInfo: "Successful event"
        }
      ];
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  // Email sharing endpoint
  app.post("/api/events/:id/share", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Validate request body
      if (!req.body.to || !req.body.from) {
        return res.status(400).json({ 
          message: "Missing required fields: 'to' and 'from' email addresses are required" 
        });
      }
      
      // Get the event details
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Format the date for email
      const formatEventDate = (startDate: Date, endDate?: Date) => {
        const start = new Date(startDate);
        const options: Intl.DateTimeFormatOptions = { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        };
        
        let dateStr = start.toLocaleDateString('en-US', options);
        
        if (endDate) {
          const end = new Date(endDate);
          // If same day, just show different time
          if (start.toDateString() === end.toDateString()) {
            dateStr += ` - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}`;
          } else {
            dateStr += ` - ${end.toLocaleDateString('en-US', options)}`;
          }
        }
        
        return dateStr;
      };
      
      // Construct the event URL
      const eventUrl = `${req.protocol}://${req.get('host')}/events/${eventId}`;
      
      // Send the invitation
      const result = await sendEventInvitation({
        to: req.body.to,
        from: req.body.from,
        eventName: event.name,
        eventDate: formatEventDate(event.startDate, event.endDate),
        eventLocation: event.location || 'TBD',
        eventUrl,
        personalMessage: req.body.message
      });
      
      if (result.success) {
        res.status(200).json({ message: "Invitation sent successfully" });
      } else {
        // Still return 200 but with a notice that email was not sent
        res.status(200).json({ 
          message: "Invitation could not be sent via email but sharing links are available",
          emailSent: false,
          error: result.message
        });
      }
    } catch (error) {
      console.error("Error sharing event:", error);
      res.status(500).json({ message: "Failed to share event", error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

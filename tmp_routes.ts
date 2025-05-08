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

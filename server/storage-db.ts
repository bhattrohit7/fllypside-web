import { 
  users, 
  type User, 
  type InsertUser,
  businessPartners,
  type BusinessPartner,
  type InsertBusinessPartner,
  events,
  type Event,
  type InsertEvent,
  offers,
  type Offer,
  type InsertOffer,
  eventParticipants
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, lt, gte, sql } from "drizzle-orm";
import { db, pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    console.log("Creating user with data:", JSON.stringify(userData, null, 2));
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Business partner methods
  async getBusinessPartner(id: number): Promise<BusinessPartner | undefined> {
    const [partner] = await db.select().from(businessPartners).where(eq(businessPartners.id, id));
    return partner;
  }

  async getBusinessPartnerByUserId(userId: number): Promise<BusinessPartner | undefined> {
    console.log("Looking for business partner with userId:", userId);
    const allPartners = await db.select().from(businessPartners);
    console.log("Current business partners:", allPartners.length);
    
    for (const bp of allPartners) {
      console.log(`BP ID: ${bp.id}, UserID: ${bp.userId}, Name: ${bp.firstName} ${bp.lastName}`);
    }

    const [partner] = await db.select().from(businessPartners).where(eq(businessPartners.userId, userId));
    if (partner) {
      console.log("Found business partner:", partner.id, "for user", userId);
    } else {
      console.log("No business partner found for user", userId);
    }
    return partner;
  }

  async createBusinessPartner(data: InsertBusinessPartner): Promise<BusinessPartner> {
    const [partner] = await db.insert(businessPartners).values(data).returning();
    return partner;
  }

  async updateBusinessPartner(id: number, data: Partial<BusinessPartner>): Promise<BusinessPartner> {
    const updateData = { ...data };
    delete (updateData as any).id; // Remove id if present
    
    const [partner] = await db
      .update(businessPartners)
      .set(updateData)
      .where(eq(businessPartners.id, id))
      .returning();
    return partner;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Event[]> {
    const now = new Date();
    console.log(`Getting ${status} events for business partner ${businessPartnerId} from database`);
    
    // Base query to get events for this business partner
    let query = db.select().from(events).where(eq(events.hostId, businessPartnerId));
    
    if (status === "upcoming") {
      // Upcoming events: MUST be published (not drafts) with future start dates
      query = query.where(and(
        eq(events.draftMode, false),
        gte(events.startDate, now)
      ));
    } else if (status === "past") {
      // Past events: MUST be published (not drafts) with past end dates
      query = query.where(and(
        eq(events.draftMode, false),
        lt(events.endDate, now)
      ));
    } else if (status === "draft") {
      // Draft events: MUST be specifically marked as drafts regardless of dates
      query = query.where(eq(events.draftMode, true));
    }
    
    // Execute the query
    const results = await query;
    console.log(`Found ${results.length} ${status} events`);
    return results;
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    console.log("Creating event with data:", JSON.stringify(data, null, 2));
    
    try {
      // Ensure dates are properly handled
      let startDate: Date;
      let endDate: Date;
      
      try {
        startDate = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
        endDate = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
      } catch (err) {
        console.error("Date parsing error:", err);
        throw new Error("Invalid date format");
      }
      
      // Build event data with explicit type conversions and validations
      const eventData = {
        hostId: Number(data.hostId),
        name: String(data.name || "Untitled Event"),
        startDate: startDate,
        endDate: endDate,
        description: data.description !== undefined ? String(data.description) : null,
        bannerImage: data.bannerImage || null,
        maxParticipants: Number(data.maxParticipants || 50),
        price: Number(data.price || 0),
        currency: String(data.currency || "INR"),
        requireIdVerification: Boolean(data.requireIdVerification),
        location: data.location ? String(data.location) : null,
        draftMode: Boolean(data.draftMode),
      };
      
      console.log("Formatted event data for DB:", JSON.stringify(eventData, null, 2));
      
      try {
        const [event] = await db.insert(events).values(eventData).returning();
        console.log("Event created successfully:", JSON.stringify(event, null, 2));
        return event;
      } catch (dbError: any) {
        console.error("Database error when inserting event:", dbError);
        throw new Error(`Database error: ${dbError.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating event in database:", error);
      throw error;
    }
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    console.log("Updating event with data:", JSON.stringify(data, null, 2));
    
    try {
      // Process data carefully
      const updateData: Record<string, any> = { ...data };
      delete updateData.id; // Remove id if present
      
      // Handle date fields if present
      if (data.startDate) {
        try {
          updateData.startDate = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
        } catch (err) {
          console.error("Start date parsing error:", err);
          throw new Error("Invalid start date format");
        }
      }
      
      if (data.endDate) {
        try {
          updateData.endDate = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
        } catch (err) {
          console.error("End date parsing error:", err);
          throw new Error("Invalid end date format");
        }
      }
      
      // Perform the update
      console.log("Formatted update data for DB:", JSON.stringify(updateData, null, 2));
      const [event] = await db
        .update(events)
        .set(updateData)
        .where(eq(events.id, id))
        .returning();
        
      console.log("Event updated successfully:", JSON.stringify(event, null, 2));
      return event;
    } catch (error) {
      console.error("Error updating event in database:", error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
  
  async cancelEvent(id: number, reason: string): Promise<Event> {
    const now = new Date();
    
    const [updatedEvent] = await db
      .update(events)
      .set({
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt: now,
        updatedAt: now
      })
      .where(eq(events.id, id))
      .returning();
    
    if (!updatedEvent) {
      throw new Error("Event not found or could not be cancelled");
    }
    
    return updatedEvent;
  }

  // Offer methods
  async getOffer(id: number): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer;
  }

  async getOffersByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Offer[]> {
    const now = new Date();
    
    if (status === "active") {
      // Active offers: either no expiry date or expiry date in the future
      return db
        .select()
        .from(offers)
        .where(and(
          eq(offers.businessPartnerId, businessPartnerId),
          sql`(${offers.expiryDate} IS NULL OR ${offers.expiryDate} > ${now})`
        ));
    } else if (status === "expired") {
      // Expired offers: expiry date in the past
      return db
        .select()
        .from(offers)
        .where(and(
          eq(offers.businessPartnerId, businessPartnerId),
          sql`(${offers.expiryDate} IS NOT NULL AND ${offers.expiryDate} <= ${now})`
        ));
    } else {
      // Return all offers for this business partner
      return db
        .select()
        .from(offers)
        .where(eq(offers.businessPartnerId, businessPartnerId));
    }
  }

  async createOffer(data: InsertOffer): Promise<Offer> {
    const [offer] = await db.insert(offers).values(data).returning();
    return offer;
  }

  async updateOffer(id: number, data: Partial<Offer>): Promise<Offer> {
    const updateData = { ...data };
    delete (updateData as any).id; // Remove id if present
    
    const [offer] = await db
      .update(offers)
      .set(updateData)
      .where(eq(offers.id, id))
      .returning();
    return offer;
  }

  async deleteOffer(id: number): Promise<void> {
    // First clear all references to this offer from events
    await db.update(events)
      .set({ offerId: null })
      .where(eq(events.offerId, id));
    
    // Then delete the offer
    await db.delete(offers).where(eq(offers.id, id));
  }

  async linkOfferToAllEvents(offerId: number, businessPartnerId: number): Promise<void> {
    // First, get all events for the business partner
    const partnerEvents = await this.getEventsByBusinessPartnerId(businessPartnerId, "all");
    
    // Update all events to reference this offer ID directly
    for (const event of partnerEvents) {
      await db
        .update(events)
        .set({ offerId })
        .where(eq(events.id, event.id));
    }
  }

  // Event participants
  async getEventParticipants(eventId: number): Promise<BusinessPartner[]> {
    // Get all participants for an event
    const result = await db
      .select({
        participant: businessPartners
      })
      .from(eventParticipants)
      .innerJoin(
        businessPartners,
        eq(eventParticipants.businessPartnerId, businessPartners.id)
      )
      .where(eq(eventParticipants.eventId, eventId));
    
    return result.map(row => row.participant);
  }
}

// Create an instance of the storage implementation
export const dbStorage = new DatabaseStorage();
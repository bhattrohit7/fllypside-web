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
  eventOffers,
  eventParticipants,
  businessPartnerInterests,
  interests
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { subDays, isAfter, isBefore, addDays } from "date-fns";
import { db } from "./db";
import { eq, and, lt, gte, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Business partner methods
  getBusinessPartner(id: number): Promise<BusinessPartner | undefined>;
  getBusinessPartnerByUserId(userId: number): Promise<BusinessPartner | undefined>;
  createBusinessPartner(data: InsertBusinessPartner): Promise<BusinessPartner>;
  updateBusinessPartner(id: number, data: InsertBusinessPartner): Promise<BusinessPartner>;

  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Event[]>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  cancelEvent(id: number, reason: string): Promise<Event>;

  // Offer methods
  getOffer(id: number): Promise<Offer | undefined>;
  getOffersByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Offer[]>;
  createOffer(data: InsertOffer): Promise<Offer>;
  updateOffer(id: number, data: Partial<Offer>): Promise<Offer>;
  deleteOffer(id: number): Promise<void>;
  linkOfferToAllEvents(offerId: number, businessPartnerId: number): Promise<void>;
  getEventsByOfferId(offerId: number): Promise<Event[]>;

  // Event participants
  getEventParticipants(eventId: number): Promise<any[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private businessPartners: Map<number, BusinessPartner>;
  private events: Map<number, Event>;
  private offers: Map<number, Offer>;
  private eventOffers: Map<string, { eventId: number, offerId: number }>;
  private eventParticipants: Map<string, { eventId: number, businessPartnerId: number }>;
  private businessPartnerInterests: Map<string, { businessPartnerId: number, interestId: number }>;
  private interests: Map<number, { id: number, name: string }>;
  
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentBusinessPartnerId: number;
  currentEventId: number;
  currentOfferId: number;
  currentInterestId: number;

  constructor() {
    this.users = new Map();
    this.businessPartners = new Map();
    this.events = new Map();
    this.offers = new Map();
    this.eventOffers = new Map();
    this.eventParticipants = new Map();
    this.businessPartnerInterests = new Map();
    this.interests = new Map();
    
    this.currentUserId = 1;
    this.currentBusinessPartnerId = 1;
    this.currentEventId = 1;
    this.currentOfferId = 1;
    this.currentInterestId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Seed some interests
    this.seedInterests();
    
    // Create a demo account for testing
    this.seedDemoAccount();
  }

  private seedInterests() {
    const interestsList = [
      "Technology",
      "Business Networking",
      "Marketing",
      "Social Media",
      "Finance",
      "Travel",
      "Food & Beverage",
      "Health & Wellness",
      "Education",
      "Entertainment"
    ];
    
    interestsList.forEach(name => {
      const id = this.currentInterestId++;
      this.interests.set(id, { id, name });
    });
  }

  private async seedDemoAccount() {
    console.log("Creating demo account...");
    
    // Create a demo user
    const user: User = {
      id: this.currentUserId++,
      email: "demo@flypside.com",
      username: "demo",
      password: "$2b$10$I9RqrLT7Vkof3QbZdvM/4O8EkMT/X5HOYWFGgNHHZjxZlKxROp9Im", // password: "demo123"
      contactNumber: null,
      firstName: null,
      lastName: null,
      gstNumber: null,
      pointOfContact: null,
      createdAt: new Date()
    };
    this.users.set(user.id, user);
    console.log(`Demo user created with ID: ${user.id}`);

    // Create a business partner profile for the user
    const businessPartner: BusinessPartner = {
      id: this.currentBusinessPartnerId++,
      userId: user.id,
      firstName: "Demo",
      lastName: "User",
      contactNumber: "+91 9876543210",
      sex: "Male",
      dob: "1990-01-01",
      idNumber: "ABC123456",
      idVerified: true,
      isBusiness: true,
      currentCity: "Mumbai",
      relationshipStatus: "Single",
      lookingFor: "serious",
      info: "This is a demo account for testing the Flypside platform.",
      socialInfo: "Follow us on social media @flypside",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.businessPartners.set(businessPartner.id, businessPartner);
    console.log(`Demo business partner created with ID: ${businessPartner.id} for user ID: ${user.id}`);

    // Add some interests to the business partner
    ["Technology", "Business Networking", "Marketing"].forEach(interestName => {
      const interest = Array.from(this.interests.values()).find(i => i.name === interestName);
      if (interest) {
        const key = `${businessPartner.id}_${interest.id}`;
        this.businessPartnerInterests.set(key, {
          businessPartnerId: businessPartner.id,
          interestId: interest.id
        });
      }
    });

    // Create a few sample events
    const events = [
      {
        name: "Tech Networking Mixer",
        description: "An evening of networking with tech professionals from around the city.",
        location: "Taj Hotel, Mumbai",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours after start
        maxParticipants: 50,
        price: 500,
        requireIdVerification: true,
        hostId: businessPartner.id,
        currency: "INR"
      },
      {
        name: "Business Growth Workshop",
        description: "Learn strategies to scale your business in 2025.",
        location: "Grand Hyatt, Delhi",
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours after start
        maxParticipants: 100,
        price: 2000,
        requireIdVerification: false,
        hostId: businessPartner.id,
        currency: "INR"
      }
    ];

    events.forEach(eventData => {
      const event: Event = {
        id: this.currentEventId++,
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.events.set(event.id, event);
    });

    // Create a couple of offers
    const offers = [
      {
        text: "Early Bird Discount",
        percentage: 15,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        businessPartnerId: businessPartner.id
      },
      {
        text: "Premium Partner Offer",
        percentage: 25,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        businessPartnerId: businessPartner.id
      }
    ];

    offers.forEach(offerData => {
      const offer: Offer = {
        id: this.currentOfferId++,
        ...offerData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.offers.set(offer.id, offer);
    });

    console.log("Demo account created:");
    console.log("Email: demo@flypside.com");
    console.log("Password: demo123");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Business partner methods
  async getBusinessPartner(id: number): Promise<BusinessPartner | undefined> {
    return this.businessPartners.get(id);
  }

  async getBusinessPartnerByUserId(userId: number): Promise<BusinessPartner | undefined> {
    console.log(`Looking for business partner with userId: ${userId}`);
    
    // Debug info
    console.log(`Current business partners: ${this.businessPartners.size}`);
    this.businessPartners.forEach((bp, id) => {
      console.log(`BP ID: ${id}, UserID: ${bp.userId}, Name: ${bp.firstName} ${bp.lastName}`);
    });
    
    const partner = Array.from(this.businessPartners.values()).find(
      (bp) => bp.userId === userId
    );
    
    if (partner) {
      console.log(`Found business partner: ${partner.id} for user ${userId}`);
    } else {
      console.log(`No business partner found for user ${userId}`);
    }
    
    return partner;
  }

  async createBusinessPartner(data: InsertBusinessPartner): Promise<BusinessPartner> {
    const id = this.currentBusinessPartnerId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Extract interests from the data if present
    const interests = data.interests as string[] || [];
    delete data.interests;
    
    const businessPartner: BusinessPartner = { ...data, id, createdAt, updatedAt };
    this.businessPartners.set(id, businessPartner);
    
    // Add interests if present
    if (interests && interests.length > 0) {
      for (const interestName of interests) {
        // Find or create interest
        let interestId: number | undefined;
        const existingInterest = Array.from(this.interests.values()).find(
          (interest) => interest.name.toLowerCase() === interestName.toLowerCase(),
        );
        
        if (existingInterest) {
          interestId = existingInterest.id;
        } else {
          interestId = this.currentInterestId++;
          this.interests.set(interestId, { id: interestId, name: interestName });
        }
        
        // Create association
        const key = `${id}_${interestId}`;
        this.businessPartnerInterests.set(key, {
          businessPartnerId: id,
          interestId,
        });
      }
    }
    
    return businessPartner;
  }

  async updateBusinessPartner(id: number, data: InsertBusinessPartner): Promise<BusinessPartner> {
    const existingPartner = await this.getBusinessPartner(id);
    
    if (!existingPartner) {
      throw new Error("Business partner not found");
    }
    
    // Extract interests from the data if present
    const interests = data.interests as string[] || [];
    delete data.interests;
    
    const updatedPartner: BusinessPartner = {
      ...existingPartner,
      ...data,
      updatedAt: new Date(),
    };
    
    this.businessPartners.set(id, updatedPartner);
    
    // Update interests
    // First, remove all existing interests
    for (const [key, value] of this.businessPartnerInterests.entries()) {
      if (value.businessPartnerId === id) {
        this.businessPartnerInterests.delete(key);
      }
    }
    
    // Then add the new ones
    if (interests && interests.length > 0) {
      for (const interestName of interests) {
        // Find or create interest
        let interestId: number | undefined;
        const existingInterest = Array.from(this.interests.values()).find(
          (interest) => interest.name.toLowerCase() === interestName.toLowerCase(),
        );
        
        if (existingInterest) {
          interestId = existingInterest.id;
        } else {
          interestId = this.currentInterestId++;
          this.interests.set(interestId, { id: interestId, name: interestName });
        }
        
        // Create association
        const key = `${id}_${interestId}`;
        this.businessPartnerInterests.set(key, {
          businessPartnerId: id,
          interestId,
        });
      }
    }
    
    return updatedPartner;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Event[]> {
    const now = new Date();
    console.log(`Getting ${status} events for business partner ${businessPartnerId}`);
    
    return Array.from(this.events.values())
      .filter((event) => {
        if (event.hostId !== businessPartnerId) {
          return false;
        }
        
        if (status === "upcoming") {
          // Upcoming events: published events (not drafts) with future start dates that aren't cancelled
          return event.draftMode === false && 
                 isAfter(new Date(event.startDate), now) &&
                 event.status === "active";
        } else if (status === "past") {
          // Past events: published events (not drafts) with past end dates that aren't cancelled
          return event.draftMode === false && 
                 isBefore(new Date(event.endDate), now) &&
                 event.status === "active";
        } else if (status === "cancelled") {
          // Cancelled events: specifically marked as cancelled regardless of dates
          return event.status === "cancelled";
        } else if (status === "draft") {
          // Draft events: specifically marked as drafts regardless of dates
          return event.draftMode === true;
        }
        
        return true;
      })
      .map(event => {
        // Add extra fields for the frontend
        return {
          ...event,
          currentParticipants: this.getEventParticipantCount(event.id),
        };
      });
  }

  private getEventParticipantCount(eventId: number): number {
    return Array.from(this.eventParticipants.values())
      .filter(ep => ep.eventId === eventId)
      .length;
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    console.log("Creating event with data:", JSON.stringify(data, null, 2));
    
    const id = this.currentEventId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Make sure optional fields have default values
    const eventData = {
      ...data,
      description: data.description || null,
      bannerImage: data.bannerImage || null,
      location: data.location || null,
      requireIdVerification: data.requireIdVerification ?? false,
      price: data.price ?? 0,
    };
    
    const event: Event = { ...eventData, id, createdAt, updatedAt };
    console.log("Final event object:", JSON.stringify(event, null, 2));
    
    this.events.set(id, event);
    
    return event;
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const existingEvent = await this.getEvent(id);
    
    if (!existingEvent) {
      throw new Error("Event not found");
    }
    
    const updatedEvent: Event = {
      ...existingEvent,
      ...data,
      updatedAt: new Date(),
    };
    
    this.events.set(id, updatedEvent);
    
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
    
    // Also remove related associations
    for (const [key, value] of this.eventOffers.entries()) {
      if (value.eventId === id) {
        this.eventOffers.delete(key);
      }
    }
    
    for (const [key, value] of this.eventParticipants.entries()) {
      if (value.eventId === id) {
        this.eventParticipants.delete(key);
      }
    }
  }
  
  async cancelEvent(id: number, reason: string): Promise<Event> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const updatedEvent: Event = {
      ...event,
      status: "cancelled",
      cancellationReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date()
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Offer methods
  async getOffer(id: number): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async getOffersByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Offer[]> {
    const now = new Date();
    
    return Array.from(this.offers.values())
      .filter((offer) => {
        if (offer.businessPartnerId !== businessPartnerId) {
          return false;
        }
        
        if (status === "active") {
          return !offer.expiryDate || isAfter(new Date(offer.expiryDate), now);
        } else if (status === "expired") {
          return offer.expiryDate && isBefore(new Date(offer.expiryDate), now);
        }
        
        return true;
      })
      .map(offer => {
        // Count linked events
        const linkedEvents = Array.from(this.eventOffers.values())
          .filter(eo => eo.offerId === offer.id)
          .length;
        
        return {
          ...offer,
          linkedEvents,
          status: (!offer.expiryDate || isAfter(new Date(offer.expiryDate), now)) ? "Active" : "Expired"
        };
      });
  }

  async createOffer(data: InsertOffer): Promise<Offer> {
    const id = this.currentOfferId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const offer: Offer = { ...data, id, createdAt, updatedAt };
    this.offers.set(id, offer);
    
    return offer;
  }

  async updateOffer(id: number, data: Partial<Offer>): Promise<Offer> {
    const existingOffer = await this.getOffer(id);
    
    if (!existingOffer) {
      throw new Error("Offer not found");
    }
    
    const updatedOffer: Offer = {
      ...existingOffer,
      ...data,
      updatedAt: new Date(),
    };
    
    this.offers.set(id, updatedOffer);
    
    return updatedOffer;
  }

  async deleteOffer(id: number): Promise<void> {
    this.offers.delete(id);
    
    // Also remove related associations
    for (const [key, value] of this.eventOffers.entries()) {
      if (value.offerId === id) {
        this.eventOffers.delete(key);
      }
    }
  }

  async linkOfferToAllEvents(offerId: number, businessPartnerId: number): Promise<void> {
    // Get all upcoming events for this business partner
    const events = await this.getEventsByBusinessPartnerId(businessPartnerId, "upcoming");
    
    // Link the offer to each event
    for (const event of events) {
      const key = `${event.id}_${offerId}`;
      this.eventOffers.set(key, {
        eventId: event.id,
        offerId,
      });
    }
  }

  // Event participants
  async getEventParticipants(eventId: number): Promise<any[]> {
    return Array.from(this.eventParticipants.values())
      .filter(ep => ep.eventId === eventId)
      .map(async ep => {
        const businessPartner = await this.getBusinessPartner(ep.businessPartnerId);
        return businessPartner;
      });
  }
}

import { db } from "./db";
import { eq, and, lt, gte, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
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

  async createUser(user: InsertUser): Promise<User> {
    console.log("Creating user with data:", JSON.stringify(user, null, 2));
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Business partner methods
  async getBusinessPartner(id: number): Promise<BusinessPartner | undefined> {
    const [partner] = await db.select().from(businessPartners).where(eq(businessPartners.id, id));
    return partner;
  }

  async getBusinessPartnerByUserId(userId: number): Promise<BusinessPartner | undefined> {
    console.log("Looking for business partner with userId:", userId);
    const partners = await db.select().from(businessPartners);
    console.log("Current business partners:", partners.length);
    
    for (const bp of partners) {
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

  async updateBusinessPartner(id: number, data: InsertBusinessPartner): Promise<BusinessPartner> {
    const [partner] = await db
      .update(businessPartners)
      .set(data)
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
    let query = db.select().from(events).where(eq(events.hostId, businessPartnerId));
    
    if (status === "upcoming") {
      // Upcoming events: not cancelled, start date in the future
      query = query.where(
        and(
          eq(events.status, "active"),
          gte(events.startDate, now),
          eq(events.draftMode, false)
        )
      );
    } else if (status === "past") {
      // Past events: end date in the past, not a draft, not cancelled
      query = query.where(
        and(
          lt(events.endDate, now),
          eq(events.draftMode, false),
          eq(events.status, "active")
        )
      );
    } else if (status === "cancelled") {
      // Only cancelled events
      query = query.where(eq(events.status, "cancelled"));
    } else if (status === "draft") {
      // Draft events
      query = query.where(eq(events.draftMode, true));
    }
    
    return await query;
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    console.log("Creating event with data:", JSON.stringify(data, null, 2));
    
    try {
      // Make sure we have the required fields with correct types
      const eventData = {
        ...data,
        hostId: data.hostId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description ?? null,
        bannerImage: data.bannerImage ?? null,
        maxParticipants: data.maxParticipants ?? 50,
        price: data.price ?? 0,
        currency: data.currency ?? "INR",
        requireIdVerification: data.requireIdVerification ?? false,
        location: data.location ?? null,
        draftMode: data.draftMode ?? false,
      };
      
      console.log("Formatted event data for DB:", JSON.stringify(eventData, null, 2));
      
      const [event] = await db.insert(events).values(eventData).returning();
      console.log("Event created successfully:", JSON.stringify(event, null, 2));
      return event;
    } catch (error) {
      console.error("Error creating event in database:", error);
      throw error;
    }
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
  
  async cancelEvent(id: number, reason: string): Promise<Event> {
    const [cancelledEvent] = await db
      .update(events)
      .set({
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(events.id, id))
      .returning();
      
    if (!cancelledEvent) {
      throw new Error("Event not found");
    }
    
    return cancelledEvent;
  }

  // Offer methods
  async getOffer(id: number): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer;
  }

  async getOffersByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Offer[]> {
    const now = new Date();
    let query = db.select().from(offers).where(eq(offers.businessPartnerId, businessPartnerId));
    
    if (status === "active") {
      // Active offers: either no expiry date or expiry date in the future
      query = query.where(
        sql`(${offers.expiryDate} IS NULL OR ${offers.expiryDate} > ${now})`
      );
    } else if (status === "expired") {
      // Expired offers: expiry date in the past
      query = query.where(
        sql`(${offers.expiryDate} IS NOT NULL AND ${offers.expiryDate} <= ${now})`
      );
    }
    
    return await query;
  }

  async createOffer(data: InsertOffer): Promise<Offer> {
    const [offer] = await db.insert(offers).values(data).returning();
    return offer;
  }

  async updateOffer(id: number, data: Partial<Offer>): Promise<Offer> {
    const [offer] = await db
      .update(offers)
      .set(data)
      .where(eq(offers.id, id))
      .returning();
    return offer;
  }

  async deleteOffer(id: number): Promise<void> {
    await db.delete(offers).where(eq(offers.id, id));
  }

  async linkOfferToAllEvents(offerId: number, businessPartnerId: number): Promise<void> {
    // First, get all events for the business partner
    const partnerEvents = await this.getEventsByBusinessPartnerId(businessPartnerId, "all");
    
    // Delete any existing links for this offer
    await db.delete(eventOffers).where(eq(eventOffers.offerId, offerId));
    
    // Create new links for all events
    for (const event of partnerEvents) {
      await db.insert(eventOffers).values({
        eventId: event.id,
        offerId
      });
    }
  }

  // Event participants
  async getEventParticipants(eventId: number): Promise<any[]> {
    // Get all participants for an event
    const participants = await db
      .select({
        participant: businessPartners
      })
      .from(eventParticipants)
      .innerJoin(
        businessPartners,
        eq(eventParticipants.businessPartnerId, businessPartners.id)
      )
      .where(eq(eventParticipants.eventId, eventId));
    
    return participants.map(p => p.participant);
  }
}

// Switch from in-memory storage to database storage
export const storage = new DatabaseStorage();

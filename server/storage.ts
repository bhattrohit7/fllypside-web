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
  updateEvent(id: number, data: InsertEvent): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Offer methods
  getOffer(id: number): Promise<Offer | undefined>;
  getOffersByBusinessPartnerId(businessPartnerId: number, status: string): Promise<Offer[]>;
  createOffer(data: InsertOffer): Promise<Offer>;
  updateOffer(id: number, data: InsertOffer): Promise<Offer>;
  deleteOffer(id: number): Promise<void>;
  linkOfferToAllEvents(offerId: number, businessPartnerId: number): Promise<void>;

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
    return Array.from(this.businessPartners.values()).find(
      (bp) => bp.userId === userId,
    );
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
    
    return Array.from(this.events.values())
      .filter((event) => {
        if (event.hostId !== businessPartnerId) {
          return false;
        }
        
        if (status === "upcoming") {
          return isAfter(new Date(event.startDate), now);
        } else if (status === "past") {
          return isBefore(new Date(event.endDate), now);
        } else if (status === "draft") {
          // In a real app, we would have a 'draft' field
          return false;
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
    const id = this.currentEventId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const event: Event = { ...data, id, createdAt, updatedAt };
    this.events.set(id, event);
    
    return event;
  }

  async updateEvent(id: number, data: InsertEvent): Promise<Event> {
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

  async updateOffer(id: number, data: InsertOffer): Promise<Offer> {
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

export const storage = new MemStorage();

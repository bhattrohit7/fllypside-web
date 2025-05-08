import { pgTable, text, serial, integer, boolean, date, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  contactNumber: text("contact_number"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gstNumber: text("gst_number"),
  pointOfContact: text("point_of_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters").regex(/[0-9]/, "Password must include a number").regex(/[^a-zA-Z0-9]/, "Password must include a symbol"),
    firstName: z.string().min(2, "First name is required").max(50),
    lastName: z.string().min(2, "Last name is required").max(50),
    contactNumber: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits"),
    gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format").optional(),
    pointOfContact: z.string().min(3, "Point of contact is required").max(100),
  });

// Business partner profile table
export const businessPartners = pgTable("business_partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  sex: text("sex").notNull(),
  dob: date("dob").notNull(),
  info: text("info"),
  idNumber: text("id_number"),
  idVerified: boolean("id_verified").default(false),
  isBusiness: boolean("is_business").default(false),
  isLost: boolean("is_lost").default(false),
  currentCity: text("current_city"),
  relationshipStatus: text("relationship_status"),
  lookingFor: text("looking_for"),
  socialInfo: text("social_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBusinessPartnerSchema = createInsertSchema(businessPartners)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    contactNumber: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits"),
    sex: z.enum(["M", "F", "Other"], { invalid_type_error: "Sex must be M, F, or Other" }),
    dob: z.coerce.date(),
    idNumber: z.string().min(12).max(16).optional(),
    lookingFor: z.enum(["serious", "fun"], { invalid_type_error: "Looking for must be serious or fun" }).optional(),
  });

// Interests table
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Business partner interests (many-to-many)
export const businessPartnerInterests = pgTable("business_partner_interests", {
  businessPartnerId: integer("business_partner_id").references(() => businessPartners.id, { onDelete: 'cascade' }).notNull(),
  interestId: integer("interest_id").references(() => interests.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey(t.businessPartnerId, t.interestId),
}));

// Promotional offers table
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  businessPartnerId: integer("business_partner_id").references(() => businessPartners.id, { onDelete: 'cascade' }).notNull(),
  text: text("text").notNull(),
  percentage: integer("percentage").notNull(),
  startDate: timestamp("start_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOfferSchema = createInsertSchema(offers)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    percentage: z.coerce.number().min(1).max(100),
    startDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional(),
  });

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").references(() => businessPartners.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  bannerImage: text("banner_image"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  price: integer("price").default(0),
  currency: text("currency").default("INR"),
  requireIdVerification: boolean("require_id_verification").default(false),
  location: text("location"),
  draftMode: boolean("draft_mode").default(false),
  status: text("status").default("active").notNull(), // 'active', 'cancelled'
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  offerId: integer("offer_id").references(() => offers.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.coerce.date(), // Required
    endDate: z.coerce.date(), // Required
    price: z.coerce.number().min(0).default(0), // Optional, defaults to 0
    maxParticipants: z.coerce.number().positive().default(50), // Optional, defaults to 50
    description: z.string().optional().nullable(), // Optional
    bannerImage: z.string().optional().nullable(), // Optional
    location: z.string().optional().nullable(), // Optional - will integrate with Google Maps later
    requireIdVerification: z.boolean().optional().default(false), // Optional
    currency: z.enum(["INR", "USD", "EUR", "GBP", "AUD"]).optional().default("INR"), // Optional
    draftMode: z.boolean().optional().default(false), // Optional
    offerId: z.number().optional(), // Optional
  });

// Event images table
export const eventImages = pgTable("event_images", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Note: We've removed the event_offers junction table
// Events now directly reference offers through the offerId field

// Event participants (many-to-many)
export const eventParticipants = pgTable("event_participants", {
  eventId: integer("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  businessPartnerId: integer("business_partner_id").references(() => businessPartners.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey(t.eventId, t.businessPartnerId),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BusinessPartner = typeof businessPartners.$inferSelect;
export type InsertBusinessPartner = z.infer<typeof insertBusinessPartnerSchema>;

export type Interest = typeof interests.$inferSelect;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventImage = typeof eventImages.$inferSelect;

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

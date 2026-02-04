import mongoose, { Schema, model, models } from 'mongoose';

const BookingSchema = new Schema({
  // --- 1. Identifiers ---
  bookingReference: {  // customer-defined unique booking ID
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },

  duffelOrderId: { 
    type: String, 
    default: null, 
    unique: false,
    sparse: true 
  }, 

  offerId: { type: String, required: true }, 

  pnr: { type: String, default: null },

  // 🟢 NEW: Time Management (Hold Order-এর জন্য খুবই জরুরি)
  paymentDeadline: { type: Date }, // কখন পেমেন্ট বা হোল্ড মেয়াদ শেষ হবে
  priceExpiry: { type: Date },     // কতক্ষণ পর্যন্ত এই দাম বহাল থাকবে

  // --- 2. Contact Details ---
  contact: { 
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true }
  },

  // --- 3. Passenger Details ---
  passengers: [{
    id: String, // Duffel Passenger ID
    type: { type: String, enum: ['adult', 'child', 'infant', 'infant_without_seat'] },
    title: String,
    firstName: String,
    lastName: String,
    middleName: String,
    gender: String,
    dob: String,            // ⚠️ Mandatory for Flight
    passportNumber: String, // ⚠️ Mandatory for Int. Flight
    passportExpiry: String, // ⚠️ Mandatory for Int. Flight
    // 🟢 NEW: পাসপোর্ট কান্ট্রি কোড (Default: Bangladesh)
    passportCountry: { type: String, default: 'BD' } 
  }],

  // --- 4. Pricing (Money Matters) ---
pricing: {
  currency: { type: String, default: 'USD' },
  total_amount: { type: Number, required: true }, 
  markup: { type: Number, default: 0 },
  base_amount: { type: Number, default: 0},
},


  // --- 5. Payment Info (Sensitive Data) ---
  paymentInfo: {
    cardName: { type: String, required: true },
    cardNumber: { type: String, required: true }, // Store Masked or Encrypted
    expiryDate: { type: String, required: true }, // Format: MM/YY
    // Billing Address
    billingAddress: {
      street: String, 
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },

  // --- 6. Flight Snapshot ---
  flightDetails: {
    airline: String,        // e.g. Emirates
    flightNumber: String,   // e.g. EK585
    route: String,          // e.g. DAC -> JFK
    departureDate: Date,
    arrivalDate: Date,
    duration: String,
    logoUrl:String,
    flightType: { 
    type: String, 
    enum: ['one_way', 'round_trip', 'multi_city'], 
    required: true 
  },
  },

  // 🟢 NEW: Ticketing Documents (ইস্যু করার পর টিকেট সেভ রাখার জন্য)
  documents: [{
    unique_identifier: String,
    type: { type: String }, // e.g. 'electronic_ticket'
    url: String             // PDF Link
  }],

  // 🟢 NEW: Airline Changes (রিস্ক ম্যানেজমেন্টের জন্য)
  airlineInitiatedChanges: { type: Schema.Types.Mixed }, // এয়ারলাইন শিডিউল চেঞ্জ করলে এখানে থাকবে

  // --- 7. Status Flags ---
  status: { 
    type: String, 
    // 🟢 'expired' যোগ করা হলো যাতে সময় শেষ হলে বুঝা যায়
    enum: ['held', 'processing', 'issued', 'cancelled', 'failed', 'expired'], 
    default: 'processing' // শুরুতে প্রসেসিং রাখা সেফ
  },

  // 🟢 NEW: Operational Control
  isLiveMode: { type: Boolean, default: false }, // Test নাকি Live বুকিং
  adminNotes: { type: String }, // ম্যানুয়াল ইস্যু হ্যান্ডেল করার নোট

  // Audit
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  retryCount: {
    type: Number,
    default: 0, // শুরুতে ০ থাকবে
    min: 0,
    max: 5 
  },
  
  lastRetryAt: {
    type: Date 
  },
  payment_id:String
}, { timestamps: true });

const Booking = models.Booking || model('Booking', BookingSchema);
export default Booking;
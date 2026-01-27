import mongoose, { Schema, model, models } from 'mongoose';

const BookingSchema = new Schema({
  // --- Identifiers ---
  bookingReference: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Optimized for search
  },
  
  duffelOrderId: { type: String, required: true, unique: true }, // Main API Ref
  pnr: { type: String, index: true }, // Airline PNR (e.g., Z9X2R4)
  airlineName: { type: String },

  // --- Primary Contact ---
  contactEmail: { 
    type: String, 
    required: true,
    lowercase: true
  },
  contactPhone: { type: String, required: true },

  // --- Passenger Snapshot (UI View) ---
  passengers: [{
    type: { type: String, enum: ['adult', 'child', 'infant'] },
    title: String,
    firstName: String,
    lastName: String,
    gender: String,
  }],

  // --- Pricing & Commission ---
  pricing: {
    currency: { type: String, default: 'USD' },
    baseFare: { type: Number, required: true },     // Cost from Duffel
    agencyMarkup: { type: Number, default: 0 },     // Your profit
    totalAmount: { type: Number, required: true }   // Customer charge
  },

  // --- Payment Info (US/AVS Standard) ---
  paymentInfo: {
    cardHolderName: { type: String, required: true },
    encryptedCardNumber: { type: String, required: true }, // Encrypted
    encryptedCVC: { type: String, required: true },        // Encrypted
    expiryMonth: { type: String, required: true },
    expiryYear: { type: String, required: true },
    last4Digits: { type: String }, // For display (**** 4242)
    cardBrand: { type: String },   // e.g., Visa, Mastercard

    // Billing Address (Required for US Cards)
    billingAddress: {
      line1: { type: String }, 
      line2: { type: String }, 
      city: { type: String },
      state: { type: String },      // e.g., NY, CA
      postalCode: { type: String }, // ZIP Code
      country: { type: String, default: 'US' }
    }
  },

  // --- Audit Trail ---
  paymentLogs: [{
    status: { type: String, enum: ['attempted', 'success', 'failed'] },
    amount: Number,
    transactionId: String, 
    message: String,       // Error or success msg
    timestamp: { type: Date, default: Date.now }
  }],

  // --- Flight Snapshot ---
  itinerary: {
    origin: String,      
    destination: String, 
    departureDate: Date,
    arrivalDate: Date,
    flightNumber: String,
    carrierCode: String, 
  },

  // --- Status Flags ---
  bookingStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'failed'], 
    default: 'pending' 
  },
  
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], 
    default: 'unpaid' 
  },

  adminNotes: String,

}, { timestamps: true });

const Booking = models.Booking || model('Booking', BookingSchema);
export default Booking;
import { Schema, model, models } from 'mongoose';

// ============================================================
// BOOKING SCHEMA
// Represents a complete flight booking lifecycle — from offer
// selection through payment, ticketing, and post-issuance events.
//
// Lifecycle: processing → held → issued → (cancelled/expired)
//            processing → failed (on payment/booking failure)
//
// Dependencies: Duffel API (offer/order), Stripe (payment)
// ============================================================

const BookingSchema = new Schema(
  {
    // ==========================================================
    // SECTION 1: IDENTIFIERS
    // Unique references linking this booking across all systems
    // ==========================================================

    /** Internal unique booking reference (e.g., "BK-2024-ABC123").
     *  Generated at booking initiation. Used in all customer-facing
     *  communications (emails, receipts, support tickets). */
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      index: true,
      trim: true,
    },

    /** Duffel Order ID returned after successful order creation.
     *  Null until the Duffel order is confirmed. Used for all
     *  post-booking operations (cancellation, changes, sync). */
    duffelOrderId: {
      type: String,
      default: null,
      index: true,
      sparse: true, // allows multiple nulls while indexing non-null values
      unique: true,  // ✅ FIX: sparse + unique together for correct behavior
    },

    /** Duffel Offer ID used to create this booking.
     *  Immutable after booking creation. Retained for
     *  audit trail and price verification purposes. */
    offerId: {
      type: String,
      required: [true, 'Offer ID is required'],
      trim: true,
    },

    /** Airline PNR (Passenger Name Record) / Confirmation Code.
     *  Populated after successful ticketing. This is what the
     *  passenger uses at the airport and airline website. */
    pnr: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },

    // ==========================================================
    // SECTION 2: TIME MANAGEMENT
    // Critical deadlines that drive automated expiry workflows.
    // Background jobs should monitor these fields to transition
    // bookings to 'expired' or 'failed' states automatically.
    // ==========================================================

    /** Deadline by which payment must be completed for held orders.
     *  After this timestamp, the airline releases the reservation
     *  and the booking should be marked as 'expired'. */
    paymentDeadline: { type: Date, default: null },

    /** Timestamp until which the quoted price remains guaranteed.
     *  After expiry, a re-quote from Duffel is required before
     *  proceeding with payment. Typically shorter than paymentDeadline. */
    priceExpiry: { type: Date, default: null },

    // ==========================================================
    // SECTION 3: CONTACT DETAILS
    // Primary contact for booking notifications and airline comms.
    // This contact receives e-tickets, schedule changes, and
    // disruption alerts. Must match at least one passenger.
    // ==========================================================
    contact: {
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          'Please provide a valid email address',
        ],
      },
      phone: {
        type: String,
        required: [true, 'Contact phone number is required'],
        trim: true,
        match: [
          /^\+?[1-9]\d{6,14}$/,
          'Please provide a valid phone number with country code',
        ],
      },
    },

    // ==========================================================
    // SECTION 4: PASSENGERS
    // All travelers on this booking. Each passenger maps to a
    // Duffel passenger ID for ticket issuance and management.
    //
    // IMPORTANT: For international flights, passport details
    // (number, expiry, issuing country) are MANDATORY by IATA.
    // ==========================================================
    passengers: [
      {
        /** Duffel-assigned passenger ID (e.g., "pas_xxxx").
         *  Used to reference this passenger in API calls. */
        id: { type: String },

        /** Passenger category — determines pricing tier and
         *  document requirements. Infants without seats are
         *  booked on the accompanying adult's ticket. */
        type: {
          type: String,
          enum: {
            values: ['adult', 'child', 'infant', 'infant_without_seat'],
            message: '{VALUE} is not a valid passenger type',
          },
        },

        title: {
          type: String,
          enum: ['mr', 'ms', 'mrs', 'miss', 'dr'],
        },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        middleName: { type: String, trim: true, default: null },

        gender: {
          type: String,
          enum: ['male', 'female'],
        },

        /** Date of birth — required for all passengers.
         *  Used for age verification and passenger type validation. */
        dob: { type: Date },

        /** Passport / travel document number.
         *  Required for all international flights. */
        passportNumber: { type: String, trim: true, default: null },

        /** Passport expiration date — most countries require
         *  at least 6 months validity beyond the travel date. */
        passportExpiry: { type: Date, default: null },

        /** ISO 3166-1 alpha-2 country code of the passport
         *  issuing country (e.g., "BD", "US", "GB"). */
        passportCountry: {
          type: String,
          default: 'BD',
          uppercase: true,
          minlength: 2,
          maxlength: 2,
        },
      },
    ],

    // ==========================================================
    // SECTION 5: PRICING
    // Financial breakdown of the booking. All amounts are stored
    // in the smallest possible decimal (e.g., 150.50, not cents)
    // to match Duffel's API response format.
    //
    // Formula: total_amount = base_amount + markup
    // The customer pays total_amount; base_amount goes to airline.
    // ==========================================================
    pricing: {
      /** ISO 4217 currency code (e.g., "USD", "BDT", "GBP"). */
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        minlength: 3,
        maxlength: 3,
      },

      /** Total amount charged to the customer (base + markup). */
      total_amount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
      },

      /** Platform markup / service fee added on top of base fare. */
      markup: {
        type: Number,
        default: 0,
        min: [0, 'Markup cannot be negative'],
      },

      /** Airline base fare (Duffel total_amount before markup). */
      base_amount: {
        type: Number,
        default: 0,
        min: [0, 'Base amount cannot be negative'],
      },
    },

    // ==========================================================
    // SECTION 6: PAYMENT INFORMATION
    //
    // ⚠️  PCI-DSS COMPLIANCE WARNING:
    // Storing raw card numbers violates PCI-DSS regulations.
    // cardNumber MUST be either:
    //   - Masked (e.g., "****-****-****-4242"), or
    //   - Tokenized via Stripe/payment processor
    // NEVER store full card numbers or CVV in the database.
    // ==========================================================
    paymentInfo: {
      /** Cardholder name exactly as printed on the card. */
      cardName: {
        type: String,
        required: [true, 'Cardholder name is required'],
        trim: true,
      },

      /** Masked card number — last 4 digits only (e.g., "****4242").
       *  ⚠️ NEVER store full card numbers. PCI-DSS violation. */
      cardNumber: {
        type: String,
        required: [true, 'Card number (masked) is required'],
      },

      /** Card expiration in MM/YY format. Used for display only;
       *  actual payment processing uses the Stripe token. */
      expiryDate: {
        type: String,
        required: [true, 'Card expiry date is required'],
        match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format'],
      },

      /** Billing address — required by some payment processors
       *  for AVS (Address Verification System) fraud checks. */
      billingAddress: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true },
      },

      /** 3D Secure session ID for SCA-compliant payments.
       *  Set during the Stripe payment confirmation flow. */
      threeDSecureSessionId: { type: String, default: null },
    },

    // ==========================================================
    // SECTION 7: FLIGHT DETAILS (SNAPSHOT)
    // Denormalized flight data captured at booking time.
    // This snapshot ensures booking details remain readable
    // even if the original offer expires from Duffel's cache.
    //
    // For round_trip and multi_city, use the 'segments' array
    // to store each leg independently.
    // ==========================================================
    flightDetails: {
      /** Marketing airline name (e.g., "Emirates", "Qatar Airways"). */
      airline: { type: String, trim: true },

      /** Primary flight number (e.g., "EK585").
       *  For multi-segment journeys, this is the first segment. */
      flightNumber: { type: String, trim: true, uppercase: true },

      /** Human-readable route summary (e.g., "DAC → DXB → JFK"). */
      route: { type: String, trim: true },

      /** Scheduled departure time (UTC) of the first segment. */
      departureDate: { type: Date },

      /** Scheduled arrival time (UTC) of the last segment. */
      arrivalDate: { type: Date },

      /** Total journey duration including layovers (e.g., "14h 30m"). */
      duration: { type: String },

      /** Airline logo URL for UI rendering. */
      logoUrl: { type: String },

      /** Journey type — determines UI layout and validation rules.
       *  - one_way: single direction, 1+ segments
       *  - round_trip: outbound + return, 2+ segments
       *  - multi_city: multiple independent city pairs */
      flightType: {
        type: String,
        enum: {
          values: ['one_way', 'round_trip', 'multi_city'],
          message: '{VALUE} is not a valid flight type',
        },
        required: [true, 'Flight type is required'],
      },

      /** Individual flight segments for multi-leg journeys.
       *  Each segment = one takeoff and one landing. */
      segments: [
        {
          segmentId: String,
          carrier: String,
          flightNumber: String,
          origin: String,        // IATA code (e.g., "DAC")
          destination: String,   // IATA code (e.g., "DXB")
          departureAt: Date,
          arrivingAt: Date,
          duration: String,
          cabin: String,         // economy, premium_economy, business, first
        },
      ],
    },

    // ==========================================================
    // SECTION 8: TICKETING DOCUMENTS
    // Electronic tickets and receipts issued post-payment.
    // Populated by the Duffel order response after confirmation.
    // ==========================================================
    documents: [
      {
        /** Unique ticket/document identifier from the airline. */
        unique_identifier: { type: String },

        /** Document type classification.
         *  Common values: "electronic_ticket", "electronic_misc_document" */
        docType: { type: String }, // ✅ FIX: renamed from 'type' to avoid Mongoose conflict

        /** URL to download/view the document (typically a PDF).
         *  May expire — consider caching critical documents in S3. */
        url: { type: String },
      },
    ],

    // ==========================================================
    // SECTION 9: AIRLINE-INITIATED CHANGES
    // Captures involuntary changes made by the airline after
    // booking (schedule changes, equipment swaps, cancellations).
    // Stored as raw Duffel webhook payload for maximum flexibility.
    //
    // Your system should have a webhook handler that:
    // 1. Updates this field
    // 2. Notifies the customer
    // 3. Logs the change for dispute resolution
    // ==========================================================
    airlineInitiatedChanges: {
      type: Schema.Types.Mixed,
      default: null,
    },

    // ==========================================================
    // SECTION 10: BOOKING STATUS & LIFECYCLE
    //
    // State Machine:
    //   processing ──→ held ──→ issued
    //       │            │         │
    //       ▼            ▼         ▼
    //     failed      expired   cancelled
    //
    // - processing: Payment initiated, awaiting confirmation
    // - held:       Reservation confirmed, payment pending (hold order)
    // - issued:     Tickets issued, booking complete ✅
    // - cancelled:  Voluntarily cancelled (refund may apply)
    // - expired:    Payment deadline passed without completion
    // - failed:     Payment or booking API failure
    // ==========================================================
    status: {
      type: String,
      enum: {
        values: ['held', 'processing', 'issued', 'cancelled', 'failed', 'expired'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'processing',
      index: true, // ✅ Indexed — frequently filtered in queries
    },

    // ==========================================================
    // SECTION 11: PAYMENT STATUS & TRACKING
    //
    // Tracks the payment lifecycle independently from booking status.
    // A booking can be 'processing' while payment is 'requires_action'
    // (e.g., waiting for 3D Secure authentication).
    //
    // Flow: pending → requires_action → authorized → captured
    //       pending → failed
    //       captured → refunded
    // ==========================================================
    paymentStatus: {
      type: String,
      enum: {
        values: [
          'pending',          // Payment not yet attempted
          'requires_action',  // 3D Secure / additional auth needed
          'authorized',       // Funds held, not yet captured
          'captured',         // Funds successfully collected
          'failed',           // Payment declined or errored
          'refunded',         // Full or partial refund issued
        ],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
      index: true, // ✅ Indexed — used in payment reconciliation queries
    },

    /** Stripe PaymentIntent ID for tracking and reconciliation.
     *  Format: "pi_xxxxxxxxxxxxxxxx" */
    stripePaymentIntentId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    /** Legacy/internal payment ID (if using non-Stripe processor). */
    payment_id: {
      type: String,
      default: null,
    },

    /** How the customer chose to pay.
     *  - balance: Platform wallet/credit balance
     *  - stripe: Credit/debit card via Stripe */
    clientPayWith: {
      type: String,
      enum: ['balance', 'stripe'],
      default: 'balance',
    },

    // ==========================================================
    // SECTION 12: RETRY MECHANISM
    // Handles transient failures in payment or booking API calls.
    // The system should enforce max retries and implement
    // exponential backoff to avoid overwhelming external APIs.
    //
    // After max retries (5), the booking should be marked 'failed'.
    // ==========================================================

    /** Number of retry attempts made for this booking.
     *  Incremented on each failed payment/booking attempt. */
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    /** Timestamp of the most recent retry attempt.
     *  Used to calculate backoff delay for the next retry. */
    lastRetryAt: {
      type: Date,
      default: null,
    },

    // ==========================================================
    // SECTION 13: NOTIFICATIONS
    // Tracks which communications have been sent to avoid
    // duplicate emails/SMS. Extend with additional flags
    // as needed (e.g., smsSent, reminderSent).
    // ==========================================================

    /** Whether the confirmation/e-ticket email has been sent.
     *  Checked before sending to prevent duplicate emails. */
    emailSent: {
      type: Boolean,
      default: false,
    },

    // ==========================================================
    // SECTION 14: OPERATIONAL CONTROL & AUDIT
    // Administrative fields for internal operations, debugging,
    // and environment tracking.
    // ==========================================================

    /** Environment flag — distinguishes test bookings from
     *  production bookings. CRITICAL for financial reporting.
     *  Test bookings should NEVER appear in revenue reports. */
    isLiveMode: {
      type: Boolean,
      default: false,
      index: true,
    },

    /** Internal notes added by admin/support team.
     *  Useful for tracking manual interventions, escalations,
     *  and customer service interactions. */
    adminNotes: [
      {
        note: { type: String, trim: true },
        addedBy: { type: String, default: 'system' }, // ✅ NEW: who added the note
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Auto-manages createdAt & updatedAt — do NOT define manually
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================================
// INDEXES
// Compound indexes for common query patterns.
// ============================================================

// Admin dashboard: filter by status + environment + date
BookingSchema.index({ status: 1, isLiveMode: 1, createdAt: -1 });

// Payment reconciliation: find unpaid bookings nearing deadline
BookingSchema.index({ paymentStatus: 1, paymentDeadline: 1 });

// Customer lookup: find all bookings by email
BookingSchema.index({ 'contact.email': 1, createdAt: -1 });

// Expiry cron job: find held bookings past their deadline
BookingSchema.index({ status: 1, paymentDeadline: 1 });

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================

/** Automatically expire bookings that have passed their
 *  payment deadline and are still in 'held' status. */
// BookingSchema.pre('save', function (next) {
//   if (
//     this.status === 'held' &&
//     this.paymentDeadline &&
//     new Date() > this.paymentDeadline
//   ) {
//     this.status = 'expired';
//   }
//   next();
// });

// ============================================================
// VIRTUALS
// ============================================================

/** Check if booking is still within the payment window. */
BookingSchema.virtual('isPaymentWindowOpen').get(function () {
  if (!this.paymentDeadline) return false;
  return new Date() < this.paymentDeadline;
});

/** Check if the quoted price is still valid. */
BookingSchema.virtual('isPriceValid').get(function () {
  if (!this.priceExpiry) return false;
  return new Date() < this.priceExpiry;
});

/** Check if retry limit has been reached. */
BookingSchema.virtual('canRetry').get(function () {
  return this.retryCount < 5;
});

// ============================================================
// STATIC METHODS
// ============================================================

/** Find all bookings that should be expired by the cron job. */
BookingSchema.statics.findExpiredHolds = function () {
  return this.find({
    status: 'held',
    paymentDeadline: { $lt: new Date() },
  });
};

/** Find bookings pending payment reconciliation. */
BookingSchema.statics.findPendingPayments = function () {
  return this.find({
    paymentStatus: { $in: ['pending', 'requires_action', 'authorized'] },
    status: { $nin: ['cancelled', 'expired', 'failed'] },
  });
};

const Booking = models.Booking || model('Booking', BookingSchema);
export default Booking;
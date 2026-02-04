import { NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../../duffel/booking/utils';

export async function GET() {
  try {
    await dbConnect();

    const passengerList = await Booking.aggregate([
      { $sort: { createdAt: -1 } },
      { $unwind: { path: "$passengers", preserveNullAndEmptyArrays: false } },
      
      // ... (Unique Key generation same as before) ...
      {
        $addFields: {
          uniqueKey: {
            $cond: {
              if: { 
                $and: [
                  { $ne: ["$passengers.passportNumber", null] }, 
                  { $ne: ["$passengers.passportNumber", ""] }
                ] 
              },
              then: "$passengers.passportNumber",
              else: { 
                $concat: [
                  { $ifNull: ["$passengers.firstName", ""] }, "-", 
                  { $ifNull: ["$passengers.lastName", ""] }, "-", 
                  { $ifNull: [{ $toString: "$passengers.dob" }, ""] }
                ] 
              }
            }
          },
          finalEmail: { 
            $ifNull: [
              { $cond: [{ $ne: ["$passengers.email", ""] }, "$passengers.email", null] }, 
              "$contact.email", 
              "N/A"
            ] 
          },
          finalPhone: { 
            $ifNull: [
              { $cond: [{ $ne: ["$passengers.phone", ""] }, "$passengers.phone", null] }, 
              "$contact.phone", 
              "N/A"
            ] 
          }
        }
      },

      {
        $group: {
          _id: "$uniqueKey",
          passengerId: { $first: "$passengers._id" },
          // ❌ title বাদ দেওয়া হয়েছে
          firstName: { $first: "$passengers.firstName" },
          lastName: { $first: "$passengers.lastName" },
          type: { $first: "$passengers.type" },
          gender: { $first: "$passengers.gender" },
          dob: { $first: "$passengers.dob" },
          passportNumber: { $first: { $ifNull: ["$passengers.passportNumber", "N/A"] } },
          passportExpiry: { $first: { $ifNull: ["$passengers.passportExpiry", "N/A"] } },
          passportCountry: { $first: { $ifNull: ["$passengers.passportCountry", "BD"] } },
          email: { $first: "$finalEmail" },
          phone: { $first: "$finalPhone" },
          
          // ✅ PNR এবং Booking Ref দুটোই আনা হচ্ছে
          lastPnr: { $first: "$pnr" }, 
          lastBookingRef: { $first: "$bookingReference" },
          lastTravelDate: { $first: "$createdAt" },

          encryptedCardNumber: { $first: "$paymentInfo.cardNumber" }, 
          cardHolderName: { $first: "$paymentInfo.cardName" },
          cardExpiry: { $first: "$paymentInfo.expiryDate" },
          
          billingStreet: { $first: "$paymentInfo.billingAddress.street" },
          billingCity: { $first: "$paymentInfo.billingAddress.city" },
          billingZip: { $first: "$paymentInfo.billingAddress.zipCode" },
          billingCountry: { $first: "$paymentInfo.billingAddress.country" },
          billingState: { $first: "$paymentInfo.billingAddress.state" }
        }
      },

      {
        $project: {
          _id: 0,
          id: { $ifNull: ["$passengerId", { $toString: "$_id" }] },
          firstName: 1, lastName: 1, type: 1, gender: 1, dob: 1,
          passportNumber: 1, passportExpiry: 1, passportCountry: 1,
          email: 1, phone: 1,
          lastPnr: 1, // ✅ Added to projection
          lastBookingRef: 1, 
          lastTravelDate: 1,
          
          encryptedCardNumber: 1,
          cardHolderName: { $ifNull: ["$cardHolderName", "N/A"] },
          cardExpiry: { $ifNull: ["$cardExpiry", "N/A"] },
          
          fullBillingAddress: {
            $concat: [
              { $ifNull: ["$billingStreet", ""] }, ", ",
              { $ifNull: ["$billingCity", ""] }, ", ",
              { $ifNull: ["$billingState", ""] }, " ",
              { $ifNull: ["$billingZip", ""] }, ", ",
              { $ifNull: ["$billingCountry", ""] }
            ]
          }
        }
      },
      
      { $sort: { lastTravelDate: -1 } }
    ]);

    const finalData = passengerList.map((p: any) => ({
      ...p,
      cardNumber: decrypt(p.encryptedCardNumber), 
      encryptedCardNumber: undefined 
    }));

    return NextResponse.json({ success: true, data: finalData });

  } catch (error: any) {
    console.error("Passenger List API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' }, 
      { status: 500 }
    );
  }
}
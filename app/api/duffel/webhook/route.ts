import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

export async function POST(req: Request) {
  try {
    // ১. সিকিউরিটি ভেরিফিকেশন (Duffel Signature Check)
    const rawBody = await req.text();
    const headersList = req.headers;
    const signature = headersList.get('x-duffel-signature');

    if (!signature) {
      return NextResponse.json({ message: 'Missing signature' }, { status: 401 });
    }

    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error('DUFFEL_WEBHOOK_SECRET is missing');
      return NextResponse.json({ message: 'Server Config Error' }, { status: 500 });
    }

    // Signature verification logic
    const [t, v1] = signature.split(',');
    const timestamp = t.split('=')[1];
    const receivedHash = v1.split('=')[1];
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    if (receivedHash !== expectedHash) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // ২. ইভেন্ট প্রসেসিং এবং ডাটাবেস আপডেট
    await dbConnect();
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log(`🔔 Webhook: ${type} | Order: ${data.id}`);

    switch (type) {
      
      case 'order.tickets_issued':
        const tickets = data.documents?.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url
        })) || [];

        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id }, 
          { 
            $set: { 
              status: 'issued', 
              documents: tickets, 
              updatedAt: new Date()
            } 
          }
        );
        break;

      case 'order.created':
        const updateData: any = { status: 'held' };
        if (data.payment_required_by) {
            updateData.paymentDeadline = new Date(data.payment_required_by);
        }
        
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          { $set: updateData }
        );
        break;

      case 'order.cancelled':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          { 
            $set: { 
              status: 'cancelled',
              updatedAt: new Date()
            } 
          }
        );
        break;

      case 'order.schedule_change':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          { 
            $set: { 
              airlineInitiatedChanges: data, 
              adminNotes: "Auto: Flight schedule changed by airline. Check 'airlineInitiatedChanges'.",
              updatedAt: new Date()
            } 
          }
        );
        break;

      case 'order.payment_failed':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id },
          { 
            $set: { 
              status: 'failed',
              adminNotes: "Auto: Duffel payment failed webhook received."
            } 
          }
        );
        break;

      default:
        console.log(`Unhandled event: ${type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
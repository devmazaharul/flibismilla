import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';

export async function POST(req: Request) {
  try {
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

    await dbConnect();
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    // লগ (ডিবাগিংয়ের জন্য)
    // নোট: ইভেন্ট টাইপ অনুযায়ী অর্ডার আইডি বের করা হচ্ছে
    const targetOrderId = data.order_id || data.id; 
    console.log(`🔔 Webhook: ${type} | Target Order: ${targetOrderId}`);

    switch (type) {
      
      // ✅ FIX 1: এখানে data টাই Order অবজেক্ট, তাই `data.id` ব্যবহার করতে হবে
      case 'order.tickets_issued':
        const tickets = data.documents?.map((doc: any) => ({
          unique_identifier: doc.unique_identifier,
          type: doc.type,
          url: doc.url
        })) || [];

        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id }, // ⚠️ Changed from data.order_id to data.id
          { 
            $set: { 
              status: 'issued', 
              documents: tickets, 
              updatedAt: new Date()
            } 
          }
        );
        break;

      // ✅ FIX 2: এখানেও data টাই Order অবজেক্ট, তাই `data.id` ব্যবহার করতে হবে
      case 'order.created':
        const updateData: any = { status: 'held' };
        if (data.payment_required_by) {
            updateData.paymentDeadline = new Date(data.payment_required_by);
        }
        
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.id }, // ⚠️ Changed from data.order_id to data.id
          { $set: updateData }
        );
        break;

      // ✅ CASE 3: পেমেন্ট অবজেক্টে `order_id` থাকে (এটি ঠিক ছিল)
      case 'air.payment.succeeded':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id }, 
          { 
            $set: { 
              paymentStatus: 'paid', 
              updatedAt: new Date()
            } 
          }
        );
        break;

      // ✅ CASE 4: পেমেন্ট ফেইল করলে `order_id` থাকে (এটি ঠিক ছিল)
      case 'air.payment.failed':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id }, 
          { 
            $set: { 
              status: 'failed',
              adminNotes: `Auto: Payment failed. Reason: ${data.error_message || 'Unknown'}`,
              updatedAt: new Date()
            } 
          }
        );
        break;

      // ✅ CASE 5: ক্যান্সেলেশন অবজেক্টে `order_id` থাকে (এটি ঠিক ছিল)
      case 'order.cancellation.confirmed':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          { 
            $set: { 
              status: 'cancelled',
              updatedAt: new Date()
            } 
          }
        );
        break;

      // ✅ CASE 6: শিডিউল চেঞ্জ অবজেক্টে `order_id` থাকে (এটি ঠিক ছিল)
      case 'order.airline_initiated_change_detected':
        await Booking.findOneAndUpdate(
          { duffelOrderId: data.order_id },
          { 
            $set: { 
              airlineInitiatedChanges: data, 
              adminNotes: "Auto: Flight schedule changed by airline. Check Dashboard.",
              updatedAt: new Date()
            } 
          }
        );
        break;

      case 'order.creation_failed':
         console.warn('Order creation failed webhook received', data);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${type}`);
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
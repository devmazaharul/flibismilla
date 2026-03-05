// app/api/duffel/booking/[id]/refund/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { isAdmin } from '@/app/api/lib/auth';

const duffel = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN || '' });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await isAdmin();
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    await dbConnect();
    const booking: any = await Booking.findById(id).lean();
    if (!booking || !booking.duffelOrderId) {
      return NextResponse.json(
        { success: false, message: 'Booking or Duffel order not found' },
        { status: 404 },
      );
    }

    const res = await duffel.orders.get(booking.duffelOrderId);
    const order: any = res.data;
    const cancellation = order.cancellation || null;

    if (!cancellation && !order.cancelled_at) {
      return NextResponse.json(
        { success: false, message: 'No cancellation/refund information found' },
        { status: 404 },
      );
    }

    const refundData = {
      cancelled_at:
        order.cancelled_at || cancellation?.cancelled_at || null,
      refund_amount: cancellation?.refund_amount || null,
      refund_currency: cancellation?.refund_currency || null,
      penalty_amount: cancellation?.penalty_amount || null,
      penalty_currency: cancellation?.penalty_currency || null,
      refunded_at: cancellation?.refunded_at || null,
      raw: cancellation || null,
    };


    // চাইলে এখানে DB তে syncও করে দিতে পারো
    await Booking.findByIdAndUpdate(id, {
      $set: {
        airlineInitiatedChanges: {
          ...(booking.airlineInitiatedChanges || {}),
          cancellation: refundData,
        },
        status: booking.status === 'issued' ? 'cancelled' : booking.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: refundData,
    });
  } catch (err: any) {
    console.error('Refund details API error', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch refund details from airline',
        error: err.message,
      },
      { status: 500 },
    );
  }
}
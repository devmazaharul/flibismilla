export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Duffel } from '@duffel/api';
import { calculatePriceWithMarkup, checkRateLimit } from '../search/utils';

// ------------------------------------------------------------------
// ⚙️ CONFIGURATION
// ------------------------------------------------------------------

const duffel = new Duffel({
    token: process.env.DUFFEL_ACCESS_TOKEN as string,
});

// ------------------------------------------------------------------
// 🟢 HELPER FUNCTIONS
// ------------------------------------------------------------------

// 1. Robust Duration Parser
const parseDuration = (duration: string | null | undefined) => {
    if (!duration) return '--';

    const upper = duration.toUpperCase();
    const daysMatch = upper.match(/(\d+)D/);
    const hoursMatch = upper.match(/(\d+)H/);
    const minutesMatch = upper.match(/(\d+)M/);

    const d = daysMatch ? daysMatch[1] : null;
    const h = hoursMatch ? hoursMatch[1] : null;
    const m = minutesMatch ? minutesMatch[1] : null;

    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);

    if (parts.length === 0) return duration.replace('PT', '').toLowerCase();

    return parts.join(' ');
};

// 2. Cabin Class Formatter
const getCabinClass = (slices: any[]) => {
    try {
        const segment = slices[0]?.segments[0];
        const passenger = segment?.passengers?.[0];
        const rawClass =
            passenger?.cabin_class_marketing_name || passenger?.cabin_class || 'Economy';
        return rawClass.charAt(0).toUpperCase() + rawClass.slice(1).toLowerCase();
    } catch (e) {
        return 'Economy';
    }
};

// 3. 🟢 SMART BAGGAGE INFO — All Types (checked, carry_on, personal_item, etc.)
const getBaggageInfo = (slices: any[]) => {
    try {
        const bags = slices[0]?.segments[0]?.passengers?.[0]?.baggages;

        // ─── No Baggage Data ───
        if (!Array.isArray(bags) || bags.length === 0) {
            return {
                summary: 'No Baggage Info',
                details: [],
                hasChecked: false,
                hasCarryOn: false,
                hasPersonalItem: false,
                totalWeight: 0,
                totalWeightDisplay: 'N/A',
                includedCount: 0,
            };
        }

        // ─── Baggage Type Config ───
        const baggageConfig: Record<
            string,
            { label: string; icon: string; defaultWeight: number }
        > = {
            checked: { label: 'Checked Bag', icon: '🧳', defaultWeight: 23 },
            carry_on: { label: 'Carry-On', icon: '👜', defaultWeight: 7 },
            personal_item: { label: 'Personal Item', icon: '🎒', defaultWeight: 5 },
        };

        // ─── Parse Each Bag ───
        const details = bags.map((bag: any) => {
            // Get config or generate fallback for unknown types
            const config = baggageConfig[bag.type] || {
                label:
                    bag.type
                        ?.replace(/_/g, ' ')
                        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Other Bag',
                icon: '📦',
                defaultWeight: 0,
            };

            const qty = bag.quantity || 0;

            // Weight resolution: API explicit > Estimate > 0
            const hasExplicitWeight = bag.weight !== undefined && bag.weight !== null;
            const weightPerBag = hasExplicitWeight
                ? Number(bag.weight)
                : config.defaultWeight;
            const totalWeight = qty * weightPerBag;
            const isApprox = !hasExplicitWeight && config.defaultWeight > 0;
            const weightUnit = bag.weightUnit || bag.weight_unit || 'kg';

            // Display text
            let displayText = '';
            if (qty > 0) {
                if (totalWeight > 0) {
                    displayText = `${qty} × ${config.label} (${totalWeight}${weightUnit}${isApprox ? ' approx' : ''})`;
                } else {
                    displayText = `${qty} × ${config.label}`;
                }
            } else {
                displayText = `No ${config.label}`;
            }

            return {
                type: bag.type,
                label: config.label,
                icon: config.icon,
                quantity: qty,
                weightPerBag,
                totalWeight,
                weightUnit,
                isApprox,
                hasExplicitWeight,
                isIncluded: qty > 0,
                displayText,
            };
        });

        // ─── Flags ───
        const hasChecked = details.some((d: any) => d.type === 'checked' && d.quantity > 0);
        const hasCarryOn = details.some((d: any) => d.type === 'carry_on' && d.quantity > 0);
        const hasPersonalItem = details.some(
            (d: any) => d.type === 'personal_item' && d.quantity > 0,
        );

        // ─── Included Bags Only ───
        const includedBags = details.filter((d: any) => d.isIncluded);

        // ─── Summary String ───
        const summary =
            includedBags.length > 0
                ? includedBags.map((d: any) => d.displayText).join(' + ')
                : 'No Baggage Included';

        // ─── Total Weight ───
        const totalWeight = includedBags.reduce(
            (sum: number, d: any) => sum + d.totalWeight,
            0,
        );
        const hasAnyApprox = includedBags.some((d: any) => d.isApprox);

        return {
            summary,
            details,
            hasChecked,
            hasCarryOn,
            hasPersonalItem,
            totalWeight,
            totalWeightDisplay:
                totalWeight > 0
                    ? `${totalWeight}kg${hasAnyApprox ? ' approx' : ''} total`
                    : 'N/A',
            includedCount: includedBags.length,
        };
    } catch (e) {
        return {
            summary: 'Check Baggage Rules',
            details: [],
            hasChecked: false,
            hasCarryOn: false,
            hasPersonalItem: false,
            totalWeight: 0,
            totalWeightDisplay: 'N/A',
            includedCount: 0,
        };
    }
};

// 4. Fare Rules
const getFareRules = (conditions: any) => {
    if (!conditions)
        return { change: 'Unknown', refund: 'Unknown', isRefundable: false };

    const formatRule = (rule: any, type: string) => {
        if (!rule) return 'Check Rules';
        if (rule.allowed === false) return 'Not Allowed';
        if (rule.allowed === true) {
            return rule.penalty_amount
                ? `${type} Fee: ${rule.penalty_currency} ${rule.penalty_amount}`
                : `Free ${type}`;
        }
        return 'Check Rules';
    };

    return {
        change: formatRule(conditions.change_before_departure, 'Change'),
        refund: formatRule(conditions.refund_before_departure, 'Refund'),
        isRefundable: conditions.refund_before_departure?.allowed ?? false,
    };
};

// ------------------------------------------------------------------
// 🚀 MAIN API HANDLER
// ------------------------------------------------------------------

export async function GET(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, error: 'Too many requests. Slow down.' },
                { status: 429 },
            );
        }

        const { searchParams } = new URL(request.url);
        const rawOfferId = searchParams.get('offer_id');

        if (!rawOfferId) {
            return NextResponse.json(
                { success: false, message: 'Offer ID is required.' },
                { status: 400 },
            );
        }

        const offerId = rawOfferId.trim();
        const offerIdRegex = /^off_[a-zA-Z0-9]+$/;

        if (!offerIdRegex.test(offerId)) {
            return NextResponse.json(
                { success: false, message: 'Invalid Offer ID format.' },
                { status: 422 },
            );
        }

        // Live Fetch
        const offer = await duffel.offers.get(offerId, {
            return_available_services: true,
        });
        if (!offer || !offer.data) {
            return NextResponse.json(
                { success: false, message: 'No data received.' },
                { status: 404 },
            );
        }

        const data = offer.data;

        // Process Data
        const pricing = calculatePriceWithMarkup(data.total_amount, data.total_currency);
        const cabinClass = getCabinClass(data.slices);
        const baggageInfo = getBaggageInfo(data.slices);
        const fareRules = getFareRules(data.conditions);
        const expiresAt = data.expires_at
            ? new Date(data.expires_at).toISOString()
            : new Date(Date.now() + 15 * 60 * 1000).toISOString();

        // Itinerary Mapping
        const itinerary = data.slices.map((slice: any, index: number) => {
            const segments = slice.segments || [];
            const totalSlices = data.slices.length;

            let directionLabel = 'One Way';
            if (totalSlices === 2) directionLabel = index === 0 ? 'Outbound' : 'Inbound';
            else if (totalSlices > 2) directionLabel = `Flight ${index + 1}`;

            return {
                id: slice.id,
                direction: directionLabel,
                mainAirline: segments[0]?.operating_carrier?.name || 'Airline',
                mainLogo: segments[0]?.operating_carrier?.logo_symbol_url || null,

                mainDeparture: {
                    code: segments[0]?.origin?.iata_code,
                    city: segments[0]?.origin?.city_name || segments[0]?.origin?.name,
                    time: segments[0]?.departing_at,
                    terminal: segments[0]?.origin_terminal || null,
                },
                mainArrival: {
                    code: segments[segments.length - 1]?.destination?.iata_code,
                    city:
                        segments[segments.length - 1]?.destination?.city_name ||
                        segments[segments.length - 1]?.destination?.name,
                    time: segments[segments.length - 1]?.arriving_at,
                    terminal: segments[segments.length - 1]?.destination_terminal || null,
                },

                totalDuration: parseDuration(slice.duration),
                stops: segments.length - 1,

                segments: segments.map((seg: any, i: number) => {
                    let layoverTime = null;
                    if (i > 0) {
                        const prevSeg = segments[i - 1];
                        const arrTime = new Date(prevSeg.arriving_at).getTime();
                        const depTime = new Date(seg.departing_at).getTime();
                        const diffMins = (depTime - arrTime) / (1000 * 60);

                        const h = Math.floor(diffMins / 60);
                        const m = Math.floor(diffMins % 60);
                        layoverTime = `${h}h ${m}m`;
                    }

                    const isCodeshare =
                        seg.marketing_carrier?.name !== seg.operating_carrier?.name;

                    return {
                        id: seg.id,
                        layover: layoverTime,
                        flightNumber: `${seg.operating_carrier?.iata_code || ''} ${seg.operating_carrier_flight_number || ''}`,
                        aircraft: seg.aircraft?.name || 'Aircraft',
                        airline: seg.operating_carrier?.name,
                        logo: seg.operating_carrier?.logo_symbol_url,
                        isCodeshare: isCodeshare,
                        operatedBy: isCodeshare
                            ? `Operated by ${seg.operating_carrier?.name}`
                            : null,
                        duration: parseDuration(seg.duration),

                        departure: {
                            code: seg.origin?.iata_code,
                            city: seg.origin?.city_name,
                            airport: seg.origin?.name,
                            time: seg.departing_at,
                            terminal: seg.origin_terminal || null,
                        },
                        arrival: {
                            code: seg.destination?.iata_code,
                            city: seg.destination?.city_name,
                            airport: seg.destination?.name,
                            time: seg.arriving_at,
                            terminal: seg.destination_terminal || null,
                        },
                    };
                }),
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                expires_at: expiresAt,
                payment_requirements: data.payment_requirements,
                price: pricing,
                itinerary: itinerary,
                baggage: baggageInfo,
                cabinClass: cabinClass,
                fareRules: fareRules,
                refundPolicy: fareRules.isRefundable ? 'Refundable' : 'Non-refundable',
                passengers: data.passengers,
                owner: data.owner,
                availableServices: data.available_services || [],
            },
        });
    } catch (error: any) {
        console.error('❌ Offer API Error:', error.meta || error);

        if (
            (error.meta?.status === 422 &&
                error.errors?.[0]?.code === 'offer_no_longer_available') ||
            error.errors?.[0]?.code === 'airline_error'
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        'This flight price has expired or is no longer available. Please search again.',
                },
                { status: 404 },
            );
        }

        if (error.meta?.status === 404) {
            return NextResponse.json(
                { success: false, message: 'Offer not found.' },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { success: false, message: 'Internal Server Error. Please try again.' },
            { status: 500 },
        );
    }
}
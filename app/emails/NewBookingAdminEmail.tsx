import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Tailwind,
  Button,
  Row,
  Column,
  Link,
} from "@react-email/components";
import * as React from "react";

interface NewBookingAdminEmailProps {
  pnr: string;
  customerName: string;
  customerPhone: string;
  route: string;
  airline: string;
  flightDate: string;
  totalAmount: string;
  bookingId: string;
}

export default function NewBookingAdminEmail({
  pnr = "ABC1234",
  customerName = "John Doe",
  customerPhone = "+8801700000000",
  route = "DAC ➝ JFK",
  airline = "Emirates",
  flightDate = "12 Oct, 2025",
  totalAmount = "120,000",
  bookingId = "123",
}: NewBookingAdminEmailProps) {
  const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings/${bookingId}`;

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>
          New booking received – {pnr} ({customerName})
        </Preview>

        <Body className="bg-slate-100 font-sans my-0 mx-auto py-6 px-3">
          <Container className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-lg">
            {/* Brand / header */}
            <Section className="flex items-center">
              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white">
                BT
              </div>
              <div>
                <Text className="m-0 text-[13px] font-semibold text-slate-900">
                   Bismillah Travels
                </Text>
                <Text className="m-0 mt-0.5 text-[11px] text-slate-500">
                  Admin booking notification
                </Text>
              </div>
            </Section>

            {/* Accent line */}
            <Section className="mt-4">
              <div className="h-px w-full bg-gradient-to-r from-emerald-500/80 via-sky-500/80 to-indigo-500/80" />
            </Section>

            {/* Status badge */}
            <Section className="mt-4 mb-1">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                New booking received
              </div>
            </Section>

            {/* Main heading + intro */}
            <Section>
              <Heading className="m-0 text-[20px] font-semibold leading-snug text-slate-900">
                New flight booking alert ✈️
              </Heading>
              <Text className="mt-2 mb-4 text-[13px] leading-[20px] text-slate-600">
                A new booking has been placed on the website. Please review the
                details below and take action from the admin dashboard (issue /
                verify / follow-up).
              </Text>
            </Section>

            {/* Key details card */}
            <Section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              {/* Top row: customer + PNR */}
              <Row className="mb-2">
                <Column>
                  <Text className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Customer
                  </Text>
                  <Text className="m-0 mt-0.5 text-sm font-semibold text-slate-800">
                    {customerName}
                  </Text>
                  <Link
                    href={`tel:${customerPhone}`}
                    className="m-0 mt-0.5 text-xs text-indigo-600 underline"
                  >
                    {customerPhone}
                  </Link>
                </Column>
                <Column align="right">
                  <Text className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    PNR / Reference
                  </Text>
                  <Text className="m-0 mt-0.5 font-mono text-[15px] font-bold text-slate-900">
                    {pnr}
                  </Text>
                </Column>
              </Row>

              <Hr className="my-3 border-slate-200" />

              {/* Route, airline, date, amount */}
              <Row>
                <Column>
                  <Text className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Route & airline
                  </Text>
                  <Text className="m-0 mt-0.5 text-sm font-medium text-slate-800">
                    {route}
                  </Text>
                  <Text className="m-0 mt-0.5 text-xs text-slate-500">
                    {airline} • {flightDate}
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Total value
                  </Text>
                  <Text className="m-0 mt-0.5 text-sm font-bold text-emerald-600">
                    {totalAmount} USD
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* CTA */}
            <Section className="mt-6 text-center">
              <Button
                href={dashboardLink}
                className="rounded-md bg-slate-900 px-6 py-3 text-[14px] font-medium text-white no-underline hover:bg-slate-800"
              >
                Open booking in dashboard →
              </Button>
              <Text className="mt-3 mb-0 text-center text-[11px] text-slate-500">
                Or locate this booking manually in the admin panel using PNR:{" "}
                <span className="font-mono font-semibold text-slate-800">
                  {pnr}
                </span>
              </Text>
            </Section>

            <Hr className="my-6 border-slate-200" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="m-0 text-[11px] leading-[16px] text-slate-400">
                This email was generated automatically by the Fly Bismillah
                Travels admin dashboard when a new booking was created.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
import { websiteDetails } from "@/constant/data";
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
  Link,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

interface BookingProcessingEmailProps {
  customerName: string;
  bookingReference: string; // PNR
  origin: string; // e.g. "DAC"
  destination: string; // e.g. "JFK"
  flightDate: string; // e.g. "12 Oct, 2025"
}

export default function BookingProcessingEmail({
  customerName = "Traveler",
  bookingReference = "PENDING",
  origin = "DHAKA",
  destination = "LONDON",
  flightDate = "Soon",
}: BookingProcessingEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>We are processing your booking (Ref: {bookingReference})</Preview>

      <Tailwind>
        <Body className="bg-slate-100 font-sans my-0 mx-auto py-6 px-3">
          <Container className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-lg">
            {/* Brand header */}
            <Section className="flex items-center">
              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold uppercase tracking-wide text-white">
                BT
              </div>
              <div>
                <Text className="m-0 text-[13px] font-semibold text-slate-900">
                  Bismillah Travels
                </Text>
                <Text className="m-0 mt-0.5 text-[11px] text-slate-500">
                  Flights & Travel Management
                </Text>
              </div>
            </Section>

            {/* Subtle divider */}
            <Section className="mt-4">
              <div className="h-px w-full bg-gradient-to-r from-indigo-500/70 via-sky-400/70 to-emerald-400/70" />
            </Section>

            {/* Status icon */}
            <Section className="mt-5 mb-2 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl">
                ⏳
              </div>
            </Section>

            {/* Main heading + reference */}
            <Section>
              <Heading className="m-0 text-center text-[20px] font-semibold leading-snug text-slate-900">
                Your booking is being processed
              </Heading>
              <Text className="mt-2 mb-4 text-center text-[13px] text-slate-600">
                Reference:{" "}
                <span className="font-mono font-semibold text-slate-800">
                  {bookingReference}
                </span>
              </Text>
            </Section>

            {/* Greeting & explanation */}
            <Section>
              <Text className="m-0 text-[14px] leading-[22px] text-slate-700">
                Dear {customerName},
              </Text>

              <Text className="mt-3 mb-0 text-[14px] leading-[24px] text-slate-700">
                We&apos;ve successfully received your flight booking request.
                Our ticketing team is currently verifying your details and
                processing your reservation.
              </Text>
            </Section>

            {/* Highlight box */}
            <Section className="mt-4">
              <Text className="m-0 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center text-[13px] leading-[20px] text-indigo-800">
                No action is required from your side right now. You will receive
                a separate email with your confirmed e-ticket as soon as your
                booking has been issued.
              </Text>
            </Section>

            {/* Flight summary card */}
            <Section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <Row>
                <Column align="center">
                  <Text className="m-0 text-[15px] font-semibold text-slate-800">
                    {origin}
                  </Text>
                  <Text className="m-0 mt-1 text-[11px] text-slate-500">
                    Origin
                  </Text>
                </Column>

                <Column align="center">
                  <Text className="m-0 text-xl text-slate-400">✈️</Text>
                  <Text className="m-0 mt-1 text-[11px] text-slate-500">
                    Processing
                  </Text>
                </Column>

                <Column align="center">
                  <Text className="m-0 text-[15px] font-semibold text-slate-800">
                    {destination}
                  </Text>
                  <Text className="m-0 mt-1 text-[11px] text-slate-500">
                    Destination
                  </Text>
                </Column>
              </Row>

              <Hr className="my-3 border-slate-200" />

              <Text className="m-0 text-center text-[13px] text-slate-600">
                Travel date:{" "}
                <span className="font-semibold text-slate-800">
                  {flightDate}
                </span>
              </Text>
            </Section>

            {/* Support note */}
            <Section className="mt-5">
              <Text className="m-0 text-[13px] leading-[20px] text-slate-700">
                If you do not receive a confirmation email within 30–60 minutes,
                please feel free to contact our support team so we can assist
                you.
              </Text>
            </Section>

            <Hr className="my-6 border-slate-200" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="m-0 text-[12px] leading-[18px] text-slate-400">
                © {year} Your Travel Agency. All rights reserved.
              </Text>
              <Text className="m-0 mt-2 text-[11px] leading-[16px] text-slate-400">
                Need help?{" "}
                <Link
                  href={websiteDetails.phone}
                  className="text-indigo-500 underline"
                >
                  Call support
                </Link>{" "}
                or reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
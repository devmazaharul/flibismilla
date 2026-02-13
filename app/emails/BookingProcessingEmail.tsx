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
} from "@react-email/components";
import * as React from "react";

interface BookingProcessingEmailProps {
  customerName: string;
  bookingReference: string;
  route: string;
  flightDate: string;
}

const STATUS_STEPS = [
  {
    step: "Booking Received",
    status: "done" as const,
    icon: "✅",
  },
  {
    step: "Ticketing In Progress",
    status: "current" as const,
    icon: "🔄",
  },
  {
    step: "E‑Ticket Issued",
    status: "pending" as const,
    icon: "⬜",
  },
];

export default function BookingProcessingEmail({
  customerName = "Traveler",
  bookingReference = "PENDING",
  route = "DHAKA",
  flightDate = "Soon",
}: BookingProcessingEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>
        We are processing your booking (Ref: {bookingReference})
      </Preview>

      <Tailwind>
        <Body className="bg-slate-50 font-sans my-0 mx-auto py-6 px-3">
          <Container className="max-w-[600px] mx-auto bg-white rounded-2xl border border-slate-200 px-6 py-7">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                Your Booking Is Being Processed
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                We&apos;re currently working on your reservation and will share
                your confirmed e‑ticket as soon as it&apos;s issued.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Booking Reference ───── */}
            <Section className="text-center py-4">
              <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400 m-0 mb-1">
                Booking Reference
              </Text>
              <Text
                className="font-mono text-[24px] font-bold m-0"
                style={{ letterSpacing: "0.12em", color: "#4f46e5" }}
              >
                {bookingReference}
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Route Card ───── */}
            <Section
              className="my-5 rounded-xl px-5 py-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <table
                cellPadding={0}
                cellSpacing={0}
                width="100%"
                style={{ tableLayout: "fixed" }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        width: "90%",
                        textAlign: "center",
                        verticalAlign: "top",
                      }}
                    >
                      <Text className="text-[10px] uppercase tracking-[0.16em] text-slate-400 m-0 mb-1">
                        Route
                      </Text>
                      <Text className="text-[18px] font-bold text-slate-900 m-0">
                        {route}
                      </Text>
                    </td>
               
                  </tr>
                </tbody>
              </table>

              <Section className="text-center mt-4">
                <span
                  className="inline-block rounded-full px-4 py-1 text-[12px] font-semibold"
                  style={{ backgroundColor: "#eef2ff", color: "#4338ca" }}
                >
                  📅 {flightDate}
                </span>
              </Section>
            </Section>

            {/* ───── Greeting & Intro ───── */}
            <Section className="mb-4">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Dear <span className="font-semibold">{customerName}</span>,
              </Text>
              <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                We&apos;ve successfully received your flight booking request.
                Our ticketing team is now verifying your details and processing
                your reservation in our system.
              </Text>
            </Section>

            {/* ───── Info Box ───── */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{
                backgroundColor: "#eef2ff",
                borderLeft: "3px solid #6366f1",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#4f46e5" }}
              >
                ℹ What happens next?
              </Text>
              <Text
                className="text-[12px] m-0 mb-2 leading-[20px]"
                style={{ color: "#312e81" }}
              >
                You don&apos;t need to do anything right now. Here&apos;s what
                will happen:
              </Text>
              <ul
                style={{
                  paddingLeft: "18px",
                  margin: 0,
                  marginTop: "4px",
                  color: "#312e81",
                }}
              >
                <li style={{ fontSize: "12px", lineHeight: "18px" }}>
                  Our team confirms availability and fares.
                </li>
                <li style={{ fontSize: "12px", lineHeight: "18px" }}>
                  Your ticket is issued by the airline or consolidator.
                </li>
                <li style={{ fontSize: "12px", lineHeight: "18px" }}>
                  You receive a separate email with your{" "}
                  <span className="font-bold">confirmed E‑Ticket</span> and
                  final itinerary.
                </li>
              </ul>
            </Section>

            {/* ───── Status Steps ───── */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                Booking Status
              </Text>

              <table cellPadding={0} cellSpacing={0} width="100%">
                <tbody>
                  {STATUS_STEPS.map((item, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          width: 30,
                          padding: "6px 0",
                          verticalAlign: "middle",
                        }}
                      >
                        <Text className="m-0 text-[14px]">{item.icon}</Text>
                      </td>
                      <td
                        style={{
                          padding: "6px 0",
                          verticalAlign: "middle",
                        }}
                      >
                        <Text
                          className="m-0 text-[13px]"
                          style={{
                            color:
                              item.status === "done"
                                ? "#065f46"
                                : item.status === "current"
                                ? "#4338ca"
                                : "#94a3b8",
                            fontWeight:
                              item.status === "current" ? 700 : 500,
                          }}
                        >
                          {item.step}
                        </Text>
                      </td>
                      <td
                        style={{
                          padding: "6px 0",
                          textAlign: "right",
                          verticalAlign: "middle",
                        }}
                      >
                        <span
                          className="inline-block rounded-full text-[9px] font-bold uppercase px-3 py-1"
                          style={{
                            letterSpacing: "0.1em",
                            backgroundColor:
                              item.status === "done"
                                ? "#ecfdf5"
                                : item.status === "current"
                                ? "#eef2ff"
                                : "#f1f5f9",
                            color:
                              item.status === "done"
                                ? "#065f46"
                                : item.status === "current"
                                ? "#4338ca"
                                : "#94a3b8",
                          }}
                        >
                          {item.status === "done"
                            ? "Complete"
                            : item.status === "current"
                            ? "In Progress"
                            : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* ───── Reminder ───── */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{
                backgroundColor: "#fffbeb",
                borderLeft: "3px solid #f59e0b",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 m-0 mb-2">
                ⚠ Please Note
              </Text>
              <Text className="text-[11px] text-amber-900 m-0 leading-[18px]">
                If you do not receive a confirmation email within{" "}
                <span className="font-bold">30–60 minutes</span>, please contact
                our support team so we can assist you and verify your booking
                status.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                Need help?{" "}
                <Link
                  href={websiteDetails.phone}
                  className="font-semibold no-underline"
                  style={{ color: "#4f46e5" }}
                >
                  Call support
                </Link>{" "}
                or reply directly to this email.
              </Text>
              <Text className="text-[10px] text-slate-400 mt-4 mb-0">
                © {year} Fly Bismillah · All rights reserved
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
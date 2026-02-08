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
} from "@react-email/components";
import * as React from "react";

interface TicketIssuedEmailProps {
  customerName: string;
  pnr: string;
  airline: string;
  flightDate: string;
  route: string;
  ticketUrl: string;
  passengers: { name: string; type: string }[];
}

export default function TicketIssuedEmail({
  customerName = "Valued Traveler",
  pnr = "ABC1234",
  airline = "Emirates",
  flightDate = "12 Oct, 2025",
  route = "Dhaka - New York",
  ticketUrl = "#",
  passengers = [{ name: "Mr. John Doe", type: "adult" }],
}: TicketIssuedEmailProps) {
  const year = new Date().getFullYear();
  const [from, to] = route.split(" - ").map((s) => s.trim());

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>✈ E‑Ticket Confirmed – {route} | PNR: {pnr}</Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">

            {/* ───── Simple Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                E‑Ticket Confirmed ✓
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                Thank you for choosing us. Have a safe journey!
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── PNR ───── */}
            <Section className="text-center py-4">
              <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400 m-0 mb-1">
                Booking Reference
              </Text>
              <Text
                className="font-mono text-[24px] font-bold text-emerald-600 m-0"
                style={{ letterSpacing: "0.12em" }}
              >
                {pnr}
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

       
            {/* ───── Greeting ───── */}
            <Section className="mb-4">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Dear <span className="font-semibold">{customerName}</span>,
              </Text>
              <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                Your flight has been successfully{" "}
                <span className="font-bold" style={{ color: "#059669" }}>
                  ticketed
                </span>
                . Download your official E‑Ticket below and keep a copy
                (printed or digital) for airport check‑in.
              </Text>
            </Section>

            {/* ───── Passengers ───── */}
            <Section className="mt-5 mb-5">
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                Passengers
              </Text>

              <table
                cellPadding={0}
                cellSpacing={0}
                width="100%"
                style={{ border: "1px solid #e8ecf0", borderRadius: 12, overflow: "hidden" }}
              >
                {passengers.map((p, i) => (
                  <tr
                    key={`${p.name}-${i}`}
                    style={{
                      borderBottom:
                        i < passengers.length - 1 ? "1px solid #f1f5f9" : "none",
                      backgroundColor: i % 2 === 0 ? "#fafbfc" : "#ffffff",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <Text className="text-[13px] text-slate-800 font-medium m-0">
                        {p.name}
                      </Text>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span
                        className="inline-block rounded-full text-[9px] font-bold uppercase px-3 py-1"
                        style={{
                          letterSpacing: "0.1em",
                          backgroundColor:
                            p.type === "adult"
                              ? "#ecfdf5"
                              : p.type === "child"
                              ? "#eff6ff"
                              : "#fef9c3",
                          color:
                            p.type === "adult"
                              ? "#065f46"
                              : p.type === "child"
                              ? "#1e40af"
                              : "#854d0e",
                        }}
                      >
                        {p.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </table>
            </Section>

            {/* ───── CTA ───── */}
            <Section className="text-center my-6">
              <Button
                href={ticketUrl}
                className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                }}
              >
                 Download E‑Ticket (PDF)
              </Button>
              <Text className="text-[11px] text-slate-400 mt-3 mb-0">
                Includes full itinerary, baggage &amp; booking details.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-4" />

            {/* ───── Info Sections (Stacked for mobile) ───── */}

            {/* Trip Summary */}
            <Section
              className="rounded-xl px-4 py-4 mb-3"
              style={{ backgroundColor: "#f8fafb", border: "1px solid #e8ecf0" }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-2">
                Trip Summary
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 leading-5">
                <span className="font-semibold text-slate-700">Airline:</span>{" "}
                {airline}
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-5">
                <span className="font-semibold text-slate-700">Route:</span>{" "}
                {route}
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-5">
                <span className="font-semibold text-slate-700">Date:</span>{" "}
                {flightDate}
              </Text>
              <Text className="text-[10px] text-slate-400 m-0 mt-2">
                Check ticket PDF for terminal, gate &amp; flight number.
              </Text>
            </Section>

            {/* Reminders */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{ backgroundColor: "#fffbeb", borderLeft: "3px solid #f59e0b" }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 m-0 mb-2">
                ⚠ Important Reminders
              </Text>
              <Text className="text-[11px] text-amber-900 m-0 leading-[18px]">
                • Arrive at least <span className="font-bold">3 hours</span>{" "}
                before departure (international).
              </Text>
              <Text className="text-[11px] text-amber-900 m-0 mt-1 leading-[18px]">
                • Passport must be valid for{" "}
                <span className="font-bold">6+ months</span>.
              </Text>
              <Text className="text-[11px] text-amber-900 m-0 mt-1 leading-[18px]">
                • Verify <span className="font-bold">visa / transit</span>{" "}
                requirements for your destination.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                Need help? Reply to this email or reach our{" "}
                <span className="font-semibold" style={{ color: "#0d9488" }}>
                  24/7 support
                </span>
                .
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
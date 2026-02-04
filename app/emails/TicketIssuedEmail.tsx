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
  Img,
} from "@react-email/components";
import * as React from "react";

interface TicketIssuedEmailProps {
  customerName: string;
  pnr: string;
  airline: string;
  flightDate: string;
  route: string; // e.g. DAC - JFK
  ticketUrl: string; // PDF Link from Duffel
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
  
  return (
    <Html>
      <Head />
      <Preview>Your E-Ticket is Ready! (PNR: {pnr})</Preview>
      <Tailwind>
        <Body className="bg-slate-100 font-sans my-auto px-2 mx-auto">
          <Container className="border border-slate-200 bg-white rounded-lg my-[40px] mx-auto p-[20px] max-w-xl shadow-sm">
            
            {/* --- Header / Logo --- */}
            <Section className="text-center mb-6">
              <span className="text-2xl font-bold text-slate-800">Fly Bismillah</span>
            </Section>

            {/* --- Success Banner --- */}
            <Section className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                ✅
              </div>
              <Heading className="text-emerald-800 text-[20px] font-bold m-0">
                Booking Confirmed!
              </Heading>
              <Text className="text-emerald-700 text-[14px] mt-2 mb-0">
                Your ticket has been successfully issued.
              </Text>
            </Section>

            {/* --- Main Content --- */}
            <Section>
              <Text className="text-slate-600 text-[15px] leading-[24px]">
                Dear <strong>{customerName}</strong>,
              </Text>
              <Text className="text-slate-700 text-[15px] leading-[26px]">
                We are pleased to inform you that your flight booking is confirmed. Please download your E-Ticket from the button below and carry a printed copy or digital version to the airport.
              </Text>
            </Section>

            {/* --- Ticket Details Card --- */}
            <Section className="bg-slate-50 rounded-lg border border-slate-200 p-4 my-4">
              <Row className="mb-2">
                <Column>
                  <Text className="text-[10px] text-slate-400 uppercase font-bold m-0">Airline Ref (PNR)</Text>
                  <Text className="text-xl font-mono font-bold text-slate-800 m-0 tracking-widest">{pnr}</Text>
                </Column>
                <Column className="text-right">
                  <Text className="text-[10px] text-slate-400 uppercase font-bold m-0">Date</Text>
                  <Text className="text-sm font-semibold text-slate-700 m-0">{flightDate}</Text>
                </Column>
              </Row>
              
              <Hr className="border-slate-200 my-3" />

              <Row>
                 <Column>
                  <Text className="text-[10px] text-slate-400 uppercase font-bold m-0">Route</Text>
                  <Text className="text-sm font-bold text-slate-700 m-0">{route}</Text>
                  <Text className="text-xs text-slate-500 m-0">{airline}</Text>
                </Column>
              </Row>
            </Section>

            {/* --- Passenger List --- */}
            <Section className="mb-6">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-2">Travelers</Text>
              {passengers.map((p, i) => (
                <div key={i} className="flex justify-between border-b border-slate-100 py-2 last:border-0">
                  <Text className="text-sm text-slate-700 m-0 font-medium">{p.name}</Text>
                  <Text className="text-xs text-slate-400 m-0 uppercase bg-slate-100 px-2 py-0.5 rounded">{p.type}</Text>
                </div>
              ))}
            </Section>

            {/* --- Download Button --- */}
            <Section className="text-center my-8">
              <Button
                href={ticketUrl}
                className="bg-emerald-600 text-white font-bold text-[16px] px-8 py-4 rounded-md hover:bg-emerald-700 no-underline shadow-lg block w-full"
              >
                Download E-Ticket (PDF)
              </Button>
              <Text className="text-xs text-slate-400 mt-2">
                Click to view and download your official airline ticket.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-[20px]" />

            {/* --- Footer / Important Info --- */}
            <Section>
               <Text className="text-[14px] font-bold text-slate-700 m-0">Important Notes:</Text>
               <ul className="text-slate-600 text-[13px] pl-5 mt-2 space-y-1">
                 <li>Check-in counters usually close 1 hour before departure.</li>
                 <li>Ensure your passport is valid for at least 6 months.</li>
                 <li>Check visa requirements for your destination.</li>
               </ul>
            </Section>

            <Section className="text-center mt-6">
              <Text className="text-slate-400 text-[12px]">
                © {new Date().getFullYear()} Fly Bismillah. All rights reserved.
              </Text>
              <Text className="text-slate-400 text-[12px]">
                Need help? Reply to this email or call support.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
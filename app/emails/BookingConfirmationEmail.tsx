import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Button,
} from '@react-email/components';

interface Passenger {
  name: string;
  type: string;
}

interface BookingConfirmationProps {
  bookingRef: string;
  pnr: string;
  customerName: string;
  flight: {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    date: string;
    time: string;
    duration: string;
  };
  passengers: Passenger[];
  totalAmount: string;
  currency: string;
  downloadLink: string;
}

export const BookingConfirmationEmail = ({
  bookingRef = "MZ-882930",
  pnr = "6X7Y9Z",
  customerName = "Mazaharul Islam",
  flight = {
    airline: "Emirates",
    flightNumber: "EK-583",
    origin: "DAC",
    destination: "DXB",
    date: "12 Oct, 2025",
    time: "10:30 AM",
    duration: "5h 30m",
  },
  passengers = [
    { name: "Mazaharul Islam", type: "Adult" },
    { name: "Rafsan Jany", type: "Child" },
  ],
  totalAmount = "1,250.00",
  currency = "USD",
  downloadLink = "https://mazafly.com/bookings/123",
}: BookingConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Flight Confirmation: {flight.origin} to {flight.destination} ({bookingRef})</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* --- HEADER --- */}
          <Section style={header}>
             <Row>
                <Column>
                    <Img
                        src="https://assets.vercel.com/image/upload/v1666141585/view-link/vercel-icon.png"
                        width="32"
                        height="32"
                        alt="MazaFly"
                        style={logo}
                    />
                </Column>
                <Column align="right">
                    <Button style={statusBadge}>
                        ● Confirmed
                    </Button>
                </Column>
             </Row>
          </Section>

          {/* --- GREETING --- */}
          <Section style={{ paddingBottom: '20px' }}>
            <Heading style={h1}>Your flight is confirmed!</Heading>
            <Text style={text}>
              Hi {customerName}, your booking to <strong>{flight.destination}</strong> has been confirmed. 
              Please find your e-ticket details below.
            </Text>
          </Section>

          {/* --- FLIGHT CARD --- */}
          <Section style={card}>
             <Section style={cardHeader}>
                <Row>
                    <Column>
                        <Text style={label}>Booking Reference</Text>
                        <Text style={code}>{bookingRef}</Text>
                    </Column>
                    <Column align="right">
                        <Text style={label}>Airline PNR</Text>
                        <Text style={code}>{pnr}</Text>
                    </Column>
                </Row>
             </Section>
             
             <Section style={cardBody}>
                {/* Flight Route Visual */}
                <Row>
                    <Column style={{ width: '40%' }}>
                        <Text style={airportCode}>{flight.origin}</Text>
                        <Text style={airportCity}>Dhaka</Text>
                        <Text style={flightTime}>{flight.time}</Text>
                    </Column>
                    <Column style={{ width: '20%', verticalAlign: 'middle' }} align="center">
                         <Text style={duration}>{flight.duration}</Text>
                         <Img 
                            src="https://react-email-demo-bdj5iju9r-resend.vercel.app/static/vercel-arrow.png" 
                            width="100%" 
                            style={{ opacity: 0.2 }}
                         />
                         <Text style={flightNumber}>{flight.airline} {flight.flightNumber}</Text>
                    </Column>
                    <Column style={{ width: '40%' }} align="right">
                        <Text style={airportCode}>{flight.destination}</Text>
                        <Text style={airportCity}>Dubai</Text>
                        <Text style={flightTime}>04:00 PM</Text> 
                    </Column>
                </Row>
                
                <Hr style={divider} />
                
                <Row style={{ paddingTop: '10px' }}>
                    <Column>
                         <Text style={infoLabel}>Date</Text>
                         <Text style={infoValue}>{flight.date}</Text>
                    </Column>
                    <Column align="right">
                         <Text style={infoLabel}>Class</Text>
                         <Text style={infoValue}>Economy</Text>
                    </Column>
                </Row>
             </Section>
          </Section>

          {/* --- PASSENGERS & PAYMENT --- */}
          <Section style={card}>
             <Section style={cardBody}>
                <Text style={sectionTitle}>Travelers</Text>
                {passengers.map((p, i) => (
                    <Row key={i} style={travelerRow}>
                        <Column style={{ width: '30px' }}>
                             <Img src="https://react-email-demo-bdj5iju9r-resend.vercel.app/static/vercel-user.png" width="20" height="20" style={{ opacity: 0.5 }} />
                        </Column>
                        <Column>
                            <Text style={travelerName}>{p.name}</Text>
                        </Column>
                        <Column align="right">
                            <Text style={travelerType}>{p.type}</Text>
                        </Column>
                    </Row>
                ))}

                <Hr style={divider} />
                
                <Row style={{ paddingTop: '10px' }}>
                    <Column>
                        <Text style={totalLabel}>Total Paid</Text>
                    </Column>
                    <Column align="right">
                        <Text style={totalAmountStyle}>{currency} {totalAmount}</Text>
                    </Column>
                </Row>
             </Section>
          </Section>

          {/* --- ACTION --- */}
          <Section style={actionSection}>
             <Button style={button} href={downloadLink}>
                Download E-Ticket
             </Button>
             <Text style={subtext}>
                You can manage your booking online by visiting our <Link href="#" style={link}>Help Center</Link>.
             </Text>
          </Section>

          {/* --- FOOTER --- */}
          <Hr style={footerDivider} />
          <Section>
            <Text style={footer}>
              MazaFly Inc, Dhaka, Bangladesh. <br/>
              © 2026 MazaFly. All rights reserved.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default BookingConfirmationEmail;

// --- STYLES (Vercel / Geist UI) ---

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  width: '100%',
  maxWidth: '500px',
};

const header = {
  marginBottom: '32px',
};

const logo = {
  borderRadius: '5px',
};

const statusBadge = {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '9999px',
    textDecoration: 'none',
    border: '1px solid #a7f3d0'
};

const h1 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: '600',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
  margin: '0 0 12px',
};

const text = {
  color: '#666',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
};

const sectionTitle = {
    color: '#000',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '15px',
    marginTop: '0',
};

// Card Styles
const card = {
  border: '1px solid #eaeaea',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '24px',
};

const cardHeader = {
  backgroundColor: '#fafafa',
  padding: '16px 24px',
  borderBottom: '1px solid #eaeaea',
};

const cardBody = {
  padding: '24px',
};

const label = {
  color: '#666',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
  marginBottom: '4px',
  letterSpacing: '0.5px',
};

const code = {
  color: '#000',
  fontSize: '14px',
  fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
  fontWeight: '600',
  margin: '0',
};

// Flight Details
const airportCode = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#000',
    margin: '0',
    lineHeight: '1',
};

const airportCity = {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0 0',
    fontWeight: '500',
};

const flightTime = {
    fontSize: '13px',
    color: '#000',
    margin: '4px 0 0',
    fontWeight: '600',
};

const duration = {
    fontSize: '11px',
    color: '#888',
    marginBottom: '4px',
};

const flightNumber = {
    fontSize: '11px',
    color: '#666',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    marginTop: '4px',
    display: 'inline-block',
    fontWeight: '500',
};

const divider = {
    border: '0',
    borderBottom: '1px dashed #eaeaea',
    margin: '20px 0',
};

const infoLabel = {
    color: '#888',
    fontSize: '12px',
    marginBottom: '4px',
};

const infoValue = {
    color: '#000',
    fontSize: '14px',
    fontWeight: '500',
    margin: '0',
};

// Traveler & Cost
const travelerRow = {
    marginBottom: '10px',
};

const travelerName = {
    fontSize: '14px',
    fontWeight: '500',
    color: '#000',
    margin: '0',
};

const travelerType = {
    fontSize: '12px',
    color: '#666',
    margin: '0',
};

const totalLabel = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
};

const totalAmountStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Menlo, monospace',
};

// Action & Footer
const actionSection = {
    textAlign: 'center' as const,
    marginBottom: '32px',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
};

const subtext = {
    fontSize: '13px',
    color: '#666',
    marginTop: '16px',
};

const link = {
  color: '#000',
  textDecoration: 'underline',
};

const footerDivider = {
    border: '0',
    borderBottom: '1px solid #eaeaea',
    marginBottom: '20px',
};

const footer = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
};
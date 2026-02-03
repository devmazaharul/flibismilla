import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Button,
} from '@react-email/components';

interface BookingEmailProps {
  packageTitle: string;
  packagePrice: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelDate: string;
  returnDate: string;
  guests: number;
  notes: string;
  bookingId?: string;
}

export const BookingPackageEmail = ({
  packageTitle = 'Dubai 5 Days Luxury Trip',
  packagePrice = '45,000',
  customerName = 'Mazaharul Islam',
  customerEmail = 'mazaharul@example.com',
  customerPhone = '+8801700000000',
  travelDate = '12 Oct, 2025',
  returnDate = '17 Oct, 2025',
  guests = 2,
  notes = 'Need window seat preference if possible.',
  bookingId = 'PKG-9921',
}: BookingEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>We received your booking request for {packageTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* HEADER */}
          <Section style={header}>
            <Row>
              <Column>
                <Row>
                  <Column style={{ width: '32px' }}>
                    <Img
                      src="https://assets.vercel.com/image/upload/v1666141585/view-link/vercel-icon.png"
                      width="32"
                      height="32"
                      alt="MazaFly"
                      style={logo}
                    />
                  </Column>
                  <Column>
                    <Text style={brandName}>MazaFly</Text>
                    <Text style={brandTagline}>Package Booking Request</Text>
                  </Column>
                </Row>
              </Column>
              <Column align="right">
                <Button style={statusBadgePending}>● Pending</Button>
              </Column>
            </Row>
          </Section>

          {/* GREETING */}
          <Section style={{ paddingBottom: '20px' }}>
            <Heading style={h1}>Booking Received</Heading>
            <Text style={text}>
              Hi {customerName}, thanks for booking with us. We have received your request for <strong>{packageTitle}</strong>.
            </Text>
            <Text style={text}>
              Our team is reviewing the availability. We will contact you shortly at <strong>{customerPhone}</strong> to confirm details and collect payment.
            </Text>
          </Section>

          {/* PACKAGE DETAILS CARD */}
          <Section style={card}>
            <Section style={cardHeader}>
              <Text style={cardTitle}>Package Details</Text>
              <Text style={cardSubtitle}>ID: {bookingId}</Text>
            </Section>
            
            <Section style={cardBody}>
              <Row style={{ marginBottom: '16px' }}>
                <Column>
                  <Text style={label}>Package Name</Text>
                  <Text style={valueLarge}>{packageTitle}</Text>
                </Column>
              </Row>

              <Row>
                <Column>
                  <Text style={label}>Check-in</Text>
                  <Text style={value}>{travelDate}</Text>
                </Column>
                <Column>
                  <Text style={label}>Check-out</Text>
                  <Text style={value}>{returnDate}</Text>
                </Column>
                <Column>
                  <Text style={label}>Guests</Text>
                  <Text style={value}>{guests} Person(s)</Text>
                </Column>
              </Row>
            </Section>
            
            <Hr style={divider} />
            
            {/* PRICING */}
            <Section style={cardBody}>
               <Row>
                <Column>
                  <Text style={totalLabel}>Estimated Total</Text>
                  <Text style={totalHint}>Payable upon confirmation</Text>
                </Column>
                <Column align="right">
                  <Text style={totalAmountStyle}>
                    BDT {packagePrice}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* CUSTOMER INFO */}
          <Section style={card}>
            <Section style={cardBody}>
              <Text style={sectionTitle}>Contact Info</Text>
              <Row style={{ marginBottom: '10px' }}>
                 <Column>
                    <Text style={label}>Email</Text>
                    <Text style={value}>{customerEmail}</Text>
                 </Column>
                 <Column>
                    <Text style={label}>Phone</Text>
                    <Text style={value}>{customerPhone}</Text>
                 </Column>
              </Row>
              {notes && (
                <>
                  <Hr style={dividerLight} />
                  <Text style={label}>Special Request / Notes:</Text>
                  <Text style={noteText}>"{notes}"</Text>
                </>
              )}
            </Section>
          </Section>

          {/* FOOTER */}
          <Hr style={footerDivider} />
          <Section>
            <Text style={footer}>
              MazaFly Inc, Dhaka, Bangladesh.
              <br />
              © 2026 MazaFly. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingPackageEmail;

/* =========================
   STYLES
   ========================= */

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: 'Geist, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
};

const header = { marginBottom: '24px' };
const logo = { borderRadius: '6px' };
const brandName = { margin: '0', fontSize: '18px', fontWeight: 700, color: '#0f172a' };
const brandTagline = { margin: '0', fontSize: '12px', color: '#6b7280' };

const statusBadgePending = {
  backgroundColor: '#fff7ed',
  color: '#c2410c',
  fontSize: '11px',
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: '9999px',
  border: '1px solid #fdba74',
};

const h1 = { color: '#0f172a', fontSize: '20px', fontWeight: 700, margin: '0 0 10px' };
const text = { color: '#4b5563', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px' };

const card = {
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
  marginBottom: '20px',
  backgroundColor: '#ffffff',
};

const cardHeader = {
  backgroundColor: '#0f172a',
  padding: '16px 20px',
};

const cardTitle = { color: '#ffffff', fontSize: '14px', fontWeight: 600, margin: 0 };
const cardSubtitle = { color: '#94a3b8', fontSize: '11px', margin: '2px 0 0' };

const cardBody = { padding: '20px' };

const label = { color: '#64748b', fontSize: '11px', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '4px' };
const value = { color: '#0f172a', fontSize: '14px', fontWeight: 500, margin: 0 };
const valueLarge = { color: '#0f172a', fontSize: '16px', fontWeight: 600, margin: 0 };

const divider = { border: 0, borderBottom: '1px dashed #e2e8f0', margin: '0' };
const dividerLight = { border: 0, borderBottom: '1px solid #f1f5f9', margin: '12px 0' };

const totalLabel = { fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 };
const totalHint = { fontSize: '11px', color: '#6b7280', margin: 0 };
const totalAmountStyle = { fontSize: '18px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' };

const sectionTitle = { fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase' as const };
const noteText = { fontSize: '13px', color: '#334155', fontStyle: 'italic', margin: 0, backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px' };

const footerDivider = { border: 0, borderBottom: '1px solid #e5e7eb', marginBottom: '16px' };
const footer = { color: '#9ca3af', fontSize: '12px', textAlign: 'center' as const, margin: 0 };
import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface BookingProps {
  customerName: string;
  packageName: string;
  amount: string;
  bookingId: string;
}

export default function BookingSuccess({
  customerName = "John Doe",
  packageName = "Hajj Package 2026",
  amount = "$2,500",
  bookingId = "BK-8829",
}: BookingProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Booking Confirmed: {packageName}</Preview>
        <Body className="bg-white my-auto mx-auto font-sans px-2 py-10">
          <Container className="border border-solid border-[#eaeaea] rounded-[24px] mx-auto p-[40px] max-w-[465px] bg-white shadow-2xl shadow-gray-100">
            
            {/* 1. Brand Icon */}
            <Section className="text-center mb-8">
               <div style={{ 
                   display: 'inline-flex', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   width: '40px', 
                   height: '40px', 
                   backgroundColor: '#000', 
                   borderRadius: '50%' 
               }}>
                  <Img 
                    src="https://img.icons8.com/ios-filled/50/ffffff/airplane-mode-on.png"
                    width="20"
                    height="20"
                    alt="Logo"
                    style={{ transform: "rotate(-45deg)" }} 
                  />
               </div>
            </Section>

            {/* 2. Success Status Badge */}
            <Section className="text-center mb-4">
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '56px', 
                    height: '56px', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #dcfce7',
                    borderRadius: '50%' 
                }}>
                   <Img 
                    src="https://img.icons8.com/ios-filled/50/22c55e/checked-checkbox.png"
                    width="28"
                    height="28"
                    alt="Success"
                  />
                </div>
            </Section>

            {/* 3. Heading */}
            <Heading className="text-black text-[24px] font-bold text-center p-0 my-0 mx-0 tracking-tight">
              Booking Confirmed
            </Heading>
            <Text className="text-[#666] text-[13px] text-center mt-2 mb-8 uppercase tracking-[0.15em] font-medium">
              Reservation Success
            </Text>

            {/* 4. Greeting Text */}
            <Text className="text-black text-[15px] leading-[24px] text-center mb-6">
              Hello <strong>{customerName}</strong>, your request for <strong>{packageName}</strong> has been successfully received and confirmed.
            </Text>

            {/* 5. Details Card (Vercel Style) */}
            <Section className="bg-[#fafafa] border border-solid border-[#eaeaea] rounded-[16px] p-6 mb-8">
                <Text className="text-[#666] text-[11px] font-bold uppercase tracking-widest text-center mb-4 mt-0">
                    Booking Details
                </Text>
                
                <Row className="mb-3">
                    <Column className="text-[13px] text-slate-500 font-medium">Package</Column>
                    <Column className="text-[13px] text-slate-900 font-bold text-right">{packageName}</Column>
                </Row>
                <Row className="mb-3">
                    <Column className="text-[13px] text-slate-500 font-medium">Amount Paid</Column>
                    <Column className="text-[13px] text-slate-900 font-bold text-right">{amount}</Column>
                </Row>
                <Row>
                    <Column className="text-[13px] text-slate-500 font-medium">Booking ID</Column>
                    <Column className="text-[13px] text-slate-900 font-bold text-right font-mono text-emerald-600">#{bookingId}</Column>
                </Row>
            </Section>

            {/* 6. Action Button (Pill Style) */}
            <Section className="text-center mb-4">
              <Button
                href={`https://flybismillah.com/dashboard/bookings/${bookingId}`}
                style={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "50px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "inline-block",
                    width: "220px",
                    padding: "14px 0px"
                }}
              >
                Manage My Booking
              </Button>
            </Section>

            <Hr className="border border-solid border-[#f3f4f6] my-8 w-full" />
            
            <Text className="text-[#999] text-[12px] text-center leading-[20px]">
              Our travel consultants will contact you shortly with more details. 
              If you have any questions, please reply to this email.
              <br />
              <strong className="text-black">Fly Bismillah Team</strong>
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
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

interface ContactEmailProps {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactSubmission({
  name = "John Doe",
  email = "john@example.com",
  phone = "+8801712345678",
  subject = "Need help with Umrah Package",
  message = "Hello, I am interested in the premium package for next month. Can you please share the details and pricing?",
}: ContactEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>New Message from {name}: {subject}</Preview>
        <Body className="bg-white my-auto mx-auto font-sans px-2 py-10">
          <Container className="border border-solid border-[#eaeaea] rounded-[24px] mx-auto p-[40px] max-w-[465px] bg-white shadow-sm">
            
            {/* 1. Header with Icon */}
            <Section className="mb-6">
              <table align="center" border={0} cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: '0 auto' }}>
                <tr>
                  <td align="center">
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#000',
                        borderRadius: '50%'
                    }}>
                      <Img 
                        src="https://img.icons8.com/ios-filled/50/ffffff/speech-bubble--v1.png"
                        width="20"
                        height="20"
                        alt="Message"
                      />
                    </div>
                  </td>
                </tr>
              </table>
            </Section>

            <Heading className="text-black text-[22px] font-bold text-center p-0 m-0 tracking-tight">
              New Contact Inquiry
            </Heading>
            <Text className="text-[#666] text-[13px] text-center mt-2 mb-8 uppercase tracking-widest font-medium">
              Fly Bismillah Website
            </Text>

            {/* 2. Sender Details Card */}
            <Section className="bg-[#fafafa] border border-solid border-[#eaeaea] rounded-[16px] p-6 mb-6">
                <Text className="text-[#666] text-[11px] font-bold uppercase tracking-widest mb-4 mt-0">
                    Sender Information
                </Text>
                
                <Row className="mb-2">
                    <Column className="text-[13px] text-slate-500 font-medium w-[80px]">Name</Column>
                    <Column className="text-[13px] text-slate-900 font-bold text-right">{name}</Column>
                </Row>
                <Hr className="border-gray-100 my-2"/>
                <Row className="mb-2">
                    <Column className="text-[13px] text-slate-500 font-medium">Email</Column>
                    <Column className="text-[13px] text-slate-900 font-bold text-right">
                        <a href={`mailto:${email}`} className="text-blue-600 no-underline">{email}</a>
                    </Column>
                </Row>
                <Hr className="border-gray-100 my-2"/>
                <Row>
                    <Column className="text-[13px] text-slate-500 font-medium">Phone</Column>
                    <Column className="text-[13px] text-slate-900 font-bold text-right">{phone}</Column>
                </Row>
            </Section>

            {/* 3. The Message Body */}
            <Section className="mb-8">
               <Text className="text-[#666] text-[11px] font-bold uppercase tracking-widest mb-2">
                    Subject: <span className="text-black normal-case text-[13px]">{subject}</span>
                </Text>
               <div className="bg-white border border-solid border-gray-100 rounded-lg p-4 shadow-sm">
                   <Img 
                        src="https://img.icons8.com/ios-glyphs/30/e5e7eb/quote-left.png"
                        width="20"
                        height="20"
                        className="mb-2"
                        alt="quote"
                   />
                   <Text className="text-gray-800 text-[14px] leading-[24px] m-0 whitespace-pre-wrap">
                     {message}
                   </Text>
               </div>
            </Section>

            {/* 4. Action Button (Reply Directly) */}
            <Section className="text-center">
              <Button
                href={`mailto:${email}?subject=Re: ${subject}`}
                style={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "50px",
                    fontSize: "14px",
                    fontWeight: "600",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "inline-block",
                    width: "200px",
                    padding: "14px 0px",
                }}
              >
                Reply via Email
              </Button>
            </Section>

            <Hr className="border border-solid border-[#f3f4f6] my-8 w-full" />
            
            <Text className="text-[#999] text-[11px] text-center leading-[18px]">
              This email was sent from the contact form on Fly Bismillah.
              <br />
              © 2026 Fly Bismillah Inc.
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
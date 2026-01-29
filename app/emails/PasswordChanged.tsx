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
  Tailwind,
} from "@react-email/components";
import * as React from "react";

export default function PasswordChanged({ userName = "Asif" }: { userName: string }) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Admin Password Successfully Updated</Preview>
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

            {/* 2. Success Status Icon */}
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
            <Heading className="text-black text-[22px] font-bold text-center p-0 my-0 mx-0 tracking-tight">
              Password Changed
            </Heading>
            <Text className="text-[#666] text-[13px] text-center mt-2 mb-8 uppercase tracking-[0.15em] font-medium">
              Security Confirmation
            </Text>

            {/* 4. Content */}
            <Text className="text-black text-[15px] leading-[24px] text-center">
              Hello <strong>{userName}</strong>,<br /> this is to confirm that your <strong>Fly Bismillah Admin</strong> password has been successfully updated.
            </Text>

            {/* 5. Minimal Security Notice (One-line Style) */}
            <Section className="text-center my-8">
               <div style={{ 
                   display: 'inline-block', 
                   backgroundColor: '#fffbeb', 
                   border: '1px solid #fef3c7', 
                   borderRadius: '50px', 
                   padding: '10px 20px' 
               }}>
                  <Text className="text-[#92400e] text-[12px] m-0">
                    <strong>Notice:</strong> Didn't do this? Use <strong>Forgot Password</strong> immediately.
                  </Text>
               </div>
            </Section>

            {/* 6. Dashboard Link Button (Pill Style) */}
            <Section className="text-center mb-4">
              <Link 
                href="https://flybismillah.com/access" 
                style={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "50px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "inline-block",
                    padding: "12px 24px"
                }}
              >
                Go to Dashboard
              </Link>
            </Section>

            <Hr className="border border-solid border-[#f3f4f6] my-8 w-full" />
            
            <Text className="text-[#999] text-[11px] text-center italic leading-[18px]">
              This is an automated notification. For your protection, please do not share your credentials with anyone.
              <br />
              © 2026 Fly Bismillah Inc.
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
import {
  Body,
  Button,
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

interface ForgotPasswordProps {
  userName: string;
  resetLink: string;
}

export default function ForgotPassword({
  userName = "Asif",
  resetLink = "https://flybismillah.com/reset-password?token=123",
}: ForgotPasswordProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Reset your Fly Bismillah password</Preview>
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

            {/* 2. Heading */}
            <Heading className="text-black text-[24px] font-bold text-center p-0 my-0 mx-0 tracking-tight">
              Reset Password
            </Heading>
            <Text className="text-[#666] text-[13px] text-center mt-2 mb-8 uppercase tracking-[0.15em] font-medium">
              Secure Access
            </Text>

            {/* 3. Main Content */}
            <Text className="text-black text-[15px] leading-[24px] text-center mb-6">
              Hello <strong>{userName}</strong>, <br />
              We received a request to reset your password for your <strong>Fly Bismillah</strong> account.
            </Text>

            {/* 4. Action Button (Pill-shaped & Centered) */}
            <Section className="text-center mb-8">
              <Button
                href={resetLink}
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
                    padding: "14px 0px"
                }}
              >
                Reset Password
              </Button>
            </Section>

            {/* 5. Compact Security Warning Badge */}
            <Section className="text-center mb-10">
               <div style={{ 
                   display: 'inline-flex', 
                   alignItems: 'center', 
                   backgroundColor: '#fff5f5', 
                   border: '1px solid #fee2e2', 
                   borderRadius: '50px', 
                   padding: '6px 16px' 
               }}>
                  <Text className="text-[#c53030] text-[11px] font-bold m-0">
                    ⚠️ Link expires in 15 minutes
                  </Text>
               </div>
            </Section>

            <Text className="text-[#999] text-[13px] text-center mb-8">
              If you didn't request this, you can safely ignore this email.
            </Text>

            <Hr className="border border-solid border-[#f3f4f6] my-8 w-full" />
            
            {/* 6. Footer Link */}
            <Text className="text-[#999] text-[11px] text-center leading-[18px]">
              Trouble with the button? Copy and paste this URL:
              <br />
              <Link href={resetLink} className="text-blue-500 no-underline font-medium break-all">
                {resetLink}
              </Link>
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface TwoFactorStatusProps {
  userName: string;
  status: "enabled" | "disabled";
  location?: string;
  timestamp?: string;
}

export default function TwoFactorStatus({
  userName = "Asif",
  status = "disabled",
  location = "Dhaka, Bangladesh",
  timestamp = "Just now",
}: TwoFactorStatusProps) {
  
  const isEnabled = status === "enabled";

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Security Update: 2FA is {status}</Preview>
        
        {/* Vercel Style Font Stack */}
        <Body 
            className="bg-white my-auto mx-auto px-2 py-12"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif' }}
        >
          
          <Container className="border border-solid border-[#eaeaea] rounded-lg mx-auto p-[40px] w-full max-w-[465px] bg-white shadow-2xl shadow-gray-100">
            
            {/* 1. Header: Minimal Logo Row */}
            <Section className="mb-[32px]">
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                   <div style={{ 
                       width: '28px', 
                       height: '28px', 
                       backgroundColor: '#000', 
                       borderRadius: '50%', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center' 
                   }}>
                        <Img 
                            src="https://img.icons8.com/ios-filled/50/ffffff/airplane-mode-on.png"
                            width="14"
                            height="14"
                            alt="Logo"
                            style={{ display: 'block', transform: 'rotate(-45deg)' }} 
                        />
                   </div>
                   <Text className="text-black text-[14px] font-bold m-0 tracking-tight">
                       Fly Bismillah
                   </Text>
               </div>
            </Section>

            {/* 2. Main Heading */}
            <Heading className="text-black text-[24px] font-bold text-center p-0 my-[24px] mx-0 tracking-[-0.5px]">
              2FA has been {status}
            </Heading>

            <Text className="text-[#444] text-[14px] leading-[24px] text-center mb-[24px]">
              Hello <strong>{userName}</strong>,<br /> Two-Factor Authentication (2FA) for your account was recently
              <strong className={isEnabled ? "text-emerald-600" : "text-rose-600"}> {status}</strong>.
            </Text>

            {/* 3. Compact Info Row (The "1 Line" Fix) */}
            <Section className="text-center mb-[32px]">
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5', 
                    border: '1px solid #eaeaea',
                    borderRadius: '50px', // Fully Rounded Pill
                    padding: '8px 16px',
                }}>
                    <Img 
                        src="https://img.icons8.com/ios-filled/50/666666/marker.png"
                        width="12"
                        height="12"
                        alt="Location"
                        style={{ marginRight: '8px', opacity: 0.7 }}
                    />
                    <Text className="text-[#444] text-[12px] font-medium m-0">
                        {location} <span style={{ color: '#999', margin: '0 4px' }}>•</span> {timestamp}
                    </Text>
                </div>
            </Section>

            {/* 4. Rounded Action Button */}
            <Section className="text-center mb-[32px]">
              <Button
                href="https://flybismillah.com/admin/settings"
                style={{
                    backgroundColor: "#000000",
                    borderRadius: "50px",   // Fully Rounded Button
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "500",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "inline-block",
                    padding: "12px 32px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                }}
              >
                View Security Settings
              </Button>
            </Section>

          <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

<Text className="text-[#888] text-[12px] text-center leading-[20px]">
  If you did not initiate this change, please contact your <strong>Workspace Administrator</strong> or your company's <strong>IT Security Team</strong> immediately to secure your account.
</Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
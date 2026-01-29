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
import * as React from "react";

interface TeamInviteProps {
  invitedBy?: string;
  invitedName?: string;
  invitedRole?: string;
  inviteLink?: string;
}

export default function TeamInvite({
  invitedBy = "Asif",
  invitedName = "Rahim",
  invitedRole = "Admin",
  inviteLink = "https://flybismillah.com/admin",
}: TeamInviteProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Join the Fly Bismillah team</Preview>
        <Body className="bg-white my-auto mx-auto font-sans px-2 py-10">
          <Container className="border border-solid border-[#eaeaea] rounded-[24px] mx-auto p-[40px] max-w-[465px] bg-white shadow-sm">
            
            {/* 1. Brand Icon (Fixed with Table for Center Alignment) */}
            <Section>
              <table align="center" border={0} cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: '0 auto' }}>
                <tr>
                  <td align="center">
                    <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#000', 
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'block'
                    }}>
                      <Img 
                        src="https://img.icons8.com/ios-filled/50/ffffff/airplane-mode-on.png"
                        width="20"
                        height="20"
                        alt="Logo"
                        style={{ display: 'block', margin: '0 auto', transform: "rotate(-45deg)" }} 
                      />
                    </div>
                  </td>
                </tr>
              </table>
            </Section>

            {/* 2. Heading */}
            <Heading className="text-black text-[24px] font-bold text-center p-0 mt-6 mb-0 tracking-tight">
              Join the Team
            </Heading>
            <Text className="text-[#666] text-[13px] text-center mt-2 mb-8 uppercase tracking-widest font-medium">
              Fly Bismillah Workspace
            </Text>

            {/* 3. Main Text */}
            <Text className="text-black text-[15px] leading-[24px] text-center mb-6">
              Hello <strong>{invitedName}</strong>, <br /><strong>{invitedBy}</strong> has invited you to collaborate as a team member.
            </Text>

            {/* 4. One-Line Compact Role Badge (Fixed Table Layout) */}
            <Section className="text-center mb-10">
              <table align="center" border={0} cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: '0 auto', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '50px' }}>
                <tr>
                  <td style={{ padding: '6px 12px 6px 16px' }}>
                    <Text style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', margin: 0, letterSpacing: '0.05em' }}>
                      Role
                    </Text>
                  </td>
                  <td style={{ width: '1px', backgroundColor: '#e5e7eb', height: '14px' }}></td>
                  <td style={{ padding: '6px 16px 6px 12px' }}>
                    <Text style={{ fontSize: '13px', fontWeight: 'bold', color: '#000', margin: 0, textTransform: 'capitalize' }}>
                      {invitedRole}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* 5. Pill Shaped Button (Guaranteed Centered) */}
            <Section className="text-center">
              <Button
                href={inviteLink}
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
                    padding: "12px 0px"
                }}
              >
                Join Dashboard
              </Button>
            </Section>

            {/* 6. Footer Link */}
            <Text className="text-[#999] text-[12px] text-center mt-10">
              or use this link:{" "}
              <Link href={inviteLink} className="text-blue-500 no-underline font-medium">
                Accept Invitation
              </Link>
            </Text>

            <Hr className="border border-solid border-[#f3f4f6] my-8 w-full" />
            
            <Text className="text-[#999] text-[11px] text-center leading-[18px]">
              If you weren't expecting this invite, you can safely ignore this email.
              <br />
              © 2026 Fly Bismillah Inc.
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
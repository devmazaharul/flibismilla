import * as React from "react";
import {
  Html, Body, Container, Head, Hr, Section, Text,
  Img, Preview, Tailwind, Link
} from "@react-email/components";

interface EmailLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview || ""}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            
     

            {/* --- MAIN CONTENT --- */}
            <Section className="mt-[32px]">
                {children}
            </Section>

            {/* --- FOOTER (Vercel Style) --- */}
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This email was intended for <span className="text-black">you</span>. If you were not expecting this, please ignore it.
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              © {new Date().getFullYear()} Fly Bismillah Agency. All rights reserved.
              <br />
              <Link href="https://flybismillah.com" className="text-blue-600 no-underline">
                 Visit Website
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ForgotPasswordProps {
  userName: string;
  resetLink: string;
}

export default function ForgotPassword({
  userName = "Asif",
  resetLink = "https://flybismillah.com/reset-password?token=123",
}: ForgotPasswordProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Reset your Fly Bismillah password</Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                Password Reset 🔐
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                We received a request to reset your password.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Lock Icon ───── */}
            <Section className="text-center py-5">
              <div
                className="inline-block rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  lineHeight: "56px",
                  backgroundColor: "#fef2f2",
                  textAlign: "center",
                }}
              >
                <Text className="text-[28px] m-0 leading-none" style={{ lineHeight: "56px" }}>
                  🔑
                </Text>
              </div>
            </Section>

            {/* ───── Greeting ───── */}
            <Section className="mb-2">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Hello <span className="font-semibold">{userName}</span>,
              </Text>
              <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                We received a request to reset the password for your{" "}
                <span className="font-semibold text-slate-800">
                  Fly Bismillah
                </span>{" "}
                account. Click the button below to set a new password.
              </Text>
            </Section>

            {/* ───── CTA Button ───── */}
            <Section className="text-center my-6">
              <Button
                href={resetLink}
                className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                style={{
                  background:
                    "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                }}
              >
                🔓 Reset My Password
              </Button>
            </Section>

            {/* ───── Expiry Warning ───── */}
            <Section
              className="rounded-xl px-4 py-3 mb-5"
              style={{
                backgroundColor: "#fef2f2",
                borderLeft: "3px solid #ef4444",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#dc2626" }}
              >
                ⚠ Important
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#991b1b" }}
              >
                • This link expires in{" "}
                <span className="font-bold">15 minutes</span>.
              </Text>
              <Text
                className="text-[11px] m-0 mt-1 leading-[18px]"
                style={{ color: "#991b1b" }}
              >
                • If you didn't request this, you can{" "}
                <span className="font-bold">safely ignore</span> this email.
              </Text>
              <Text
                className="text-[11px] m-0 mt-1 leading-[18px]"
                style={{ color: "#991b1b" }}
              >
                • Never share this link with anyone.
              </Text>
            </Section>

            {/* ───── Security Tips ───── */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-2">
                🛡 Security Tips
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 leading-[20px]">
                • Use a <span className="font-semibold text-slate-700">strong, unique</span> password.
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-[20px]">
                • Avoid reusing passwords from other sites.
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-[20px]">
                • Consider using a{" "}
                <span className="font-semibold text-slate-700">
                  password manager
                </span>
                .
              </Text>
            </Section>

            {/* ───── Fallback Link ───── */}
            <Section
              className="rounded-xl px-4 py-3 mb-5"
              style={{
                backgroundColor: "#eef2ff",
                borderLeft: "3px solid #6366f1",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#4f46e5" }}
              >
                🔗 Button not working?
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#312e81" }}
              >
                Copy and paste this URL into your browser:
              </Text>
              <Text className="m-0 mt-2">
                <Link
                  href={resetLink}
                  className="text-[11px] no-underline break-all"
                  style={{ color: "#4f46e5" }}
                >
                  {resetLink}
                </Link>
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                Need help? Reply to this email or contact our{" "}
                <span className="font-semibold" style={{ color: "#4f46e5" }}>
                  24/7 support
                </span>
                .
              </Text>
              <Text className="text-[10px] text-slate-400 mt-4 mb-0">
                © {year} Fly Bismillah · All rights reserved
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
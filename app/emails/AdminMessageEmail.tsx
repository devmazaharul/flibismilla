import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface AdminMessageEmailProps {
  subject: string;
  message: string;
  recipientName?: string;
}

export default function AdminMessageEmail({
  subject,
  message,
  recipientName = "Valued Customer",
}: AdminMessageEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>

      <Tailwind>
        {/* Outer background + global padding */}
        <Body className="bg-slate-100 font-sans my-0 mx-auto py-6 px-3">
          {/* Main email card */}
          <Container className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-lg">
            {/* Brand header */}
            <Section className="flex items-center">
              {/* Brand icon */}
              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold uppercase tracking-wide text-white">
               BT
              </div>
              <div>
                <Text className="m-0 text-[13px] font-semibold text-slate-900">
                  Fly Bismillah Travels
                </Text>
                <Text className="m-0 mt-0.5 text-[11px] text-slate-500">
                  Travel & Flight Management
                </Text>
              </div>
            </Section>

            {/* Subtle divider */}
            <Section className="mt-4">
              <div className="h-px w-full bg-gradient-to-r from-indigo-500/70 via-sky-400/70 to-emerald-400/70" />
            </Section>

            {/* Email subject */}
            <Section className="mt-5">
              <Heading className="m-0 text-[19px] font-semibold leading-snug text-slate-900">
                {subject}
              </Heading>
            </Section>

            {/* Greeting */}
            <Section className="mt-4">
              <Text className="m-0 text-[14px] leading-[22px] text-slate-700">
                Dear {recipientName},
              </Text>
            </Section>

            {/* Message body */}
            <Section className="mt-3">
              <Text className="m-0 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[14px] leading-[24px] text-slate-800 whitespace-pre-wrap">
                {message}
              </Text>
            </Section>

            {/* Closing */}
            <Section className="mt-5">
              <Text className="m-0 text-[14px] leading-[22px] text-slate-700">
                Best regards,
                <br />
                <span className="font-semibold text-slate-900">
                  Support Team
                </span>
                <br />
                <span className="text-slate-500 text-[13px]">
                  Fly Bismillah Travels
                </span>
              </Text>
            </Section>

            <Hr className="my-6 border-slate-200" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="m-0 text-[12px] leading-[18px] text-slate-400">
                © {year} Fly Bismillah Travels. All rights reserved.
              </Text>
              <Text className="m-0 mt-2 text-[11px] leading-[16px] text-slate-400">
                This message was sent to you for informational purposes from the
                Fly Bismillah Travels admin dashboard.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
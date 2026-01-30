import { Resend } from 'resend';
import BookingSuccess from './BookingSuccess';
import TeamInvite from './TeamInvite';
import ForgotPassword from './ForgotPassword';
import PasswordChanged from './PasswordChanged';
import TwoFactorStatus from './TwoFactorStatus';
import ContactSubmission from './ContactSubmission';

import BookingNotification from './BookingNotification';


const resend = new Resend(process.env.RESEND_API_KEY);





export async function sendTeamInviteEmail(email: string, data: { invitedBy: string, invitedName: string, role: string, link: string }) {
  try {
    await resend.emails.send({
      from: 'Fly Bismillah <team@themaza.shop>',
      to: email,
      subject: `Invitation to join Fly Bismillah as ${data.role}`,
      react: TeamInvite({ 
          invitedBy: data.invitedBy,
          invitedName: data.invitedName,
          invitedRole: data.role,
          inviteLink: data.link
      }),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// 4. Send Forgot Password Email
export async function sendForgotPasswordEmail(email: string, data: { name: string, link: string }) {
  try {
    await resend.emails.send({
     from: 'Fly Bismillah <security@themaza.shop>',
      to: email,
      subject: 'Reset your password',
      react: ForgotPassword({ 
          userName: data.name,
          resetLink: data.link
      }),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendPasswordChangedEmail(email: string, userName: string) {
  try {
    await resend.emails.send({
      from: 'Fly Bismillah <security@themaza.shop>',
      to: email,
      subject: 'Your password was changed',
      react: PasswordChanged({ userName }),
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}


export async function send2FAStatusEmail(
    email: string, 
    data: { 
        userName: string, 
        status: "enabled" | "disabled",
        ip?: string ,
        location?:string,
        deviceInfo?:string
    }
) {
  try {
    await resend.emails.send({
      from: 'Fly Bismillah <security@themaza.shop>',
      to: email,
      subject: `Security Alert: 2FA ${data.status === "enabled" ? "Enabled" : "Disabled"}`,
      react: TwoFactorStatus({ 
          userName: data.userName, 
          status: data.status,
          location: data.location || "Unknown Location"
      }),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// 6. Send Contact Submission Email
const privateEmail="work.mazaharul@gmail.com"
export async function sendContactSubmissionEmail(
  data: { name: string; email: string; phone: string; subject: string; message: string }
) {
  try {

    const { data: result, error } = await resend.emails.send({
      from: 'Fly Bismillah <onboarding@themaza.shop>',
      to:privateEmail, 
      subject: `New Inquiry: ${data.subject}`,
      react: ContactSubmission({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
      }),
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}


interface BookingData {
  packageTitle: string;
  packagePrice: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelDate: string;
  returnDate: string;
  guests: {
    adults: number;
    children: number;
  };
  notes?: string;
}

export async function sendBookingEmail(data: BookingData) {
  try {
    const { data: result, error } = await resend.emails.send({
          from: 'Fly Bismillah <onboarding@themaza.shop>',
      to: [privateEmail], 
      subject: `✈️ New Booking Request: ${data.packageTitle}`,
      react: BookingNotification(data),
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, id: result?.id };

  } catch (error) {
    return { success: false, error };
  }
}
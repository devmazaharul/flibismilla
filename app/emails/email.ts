import { Resend } from 'resend';
import BookingSuccess from './BookingSuccess';
import TeamInvite from './TeamInvite';
import ForgotPassword from './ForgotPassword';
import PasswordChanged from './PasswordChanged';
import TwoFactorStatus from './TwoFactorStatus';


const resend = new Resend(process.env.RESEND_API_KEY);



// 2. Send Booking Email
export async function sendBookingEmail(email: string, data: any) {
  try {
    await resend.emails.send({
      from: 'Fly Bismillah Support <support@yourdomain.com>',
      to: email,
      subject: `Booking Confirmed: ${data.packageName}`,
      react: BookingSuccess({ 
          customerName: data.name,
          packageName: data.packageName,
          amount: data.amount,
          bookingId: data.bookingId
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error };
  }
}

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
    console.error('Invite Email Error:', error);
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
    console.error('Forgot Password Email Error:', error);
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
    console.error('Password Change Email Error:', error);
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
    console.error('2FA Email Error:', error);
    return { success: false, error };
  }
}
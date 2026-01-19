import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { name, email, phone, subject, message } = data;

        // 1. Transporter Configuration
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure:false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });


        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, 
            replyTo: email,
            subject: `📩 New Message: ${subject}`,
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Contact Message</title>
                <style>
                    @media only screen and (max-width: 600px) {
                        .container { width: 100% !important; padding: 20px !important; }
                        .row { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
                        .col { width: 100% !important; display: block !important; padding: 0 !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            
                            <div class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.08); text-align: left;">
                                
                                <div style="height: 6px; background: linear-gradient(90deg, #3B82F6, #60A5FA); width: 100%;"></div>

                                <div style="padding: 40px 40px 20px 40px; text-align: center;">
                                    <div style="display: inline-block; background-color: #EFF6FF; color: #2563EB; padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-bottom: 15px;">CONTACT FORM</div>
                                    <h1 style="margin: 0; color: #1F2937; font-size: 24px; font-weight: 800;">New Message Received</h1>
                                    <p style="margin: 10px 0 0 0; color: #6B7280; font-size: 15px;">Someone wants to get in touch with you.</p>
                                </div>

                                <div style="padding: 0 40px;">
                                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; text-align: center;">
                                        <p style="margin: 0; color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">SUBJECT</p>
                                        <h2 style="margin: 5px 0 0 0; color: #0F172A; font-size: 18px; font-weight: 700;">${subject}</h2>
                                    </div>
                                </div>

                                <div style="padding: 40px;">
                                    
                                    <table class="row" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                        <tr>
                                            <td class="col" width="100%" valign="top">
                                                <h3 style="color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; margin-top: 0;">👤 Sender Details</h3>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="col" style="padding-top: 10px;">
                                                <table width="100%">
                                                    <tr>
                                                        <td width="33%" style="padding-bottom: 10px;">
                                                            <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">NAME</span>
                                                            <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${name}</span>
                                                        </td>
                                                        <td width="33%" style="padding-bottom: 10px;">
                                                            <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">PHONE</span>
                                                            <a href="tel:${phone}" style="font-size: 14px; color: #1F2937; font-weight: 600; text-decoration: none;">${phone}</a>
                                                        </td>
                                                       
                                                    </tr>
                                                    <tr>
                                                     <td width="33%" style="padding-bottom: 10px;">
                                                            <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">EMAIL</span>
                                                            <a href="mailto:${email}" style="font-size: 14px; color: #2563EB; font-weight: 600; text-decoration: none;">${email}</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <div style="margin-top: 10px;">
                                        <h3 style="color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; margin-top: 0;">📝 Message</h3>
                                        <div style="background-color: #FAFAFA; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 0 8px 8px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                                            "${message}"
                                        </div>
                                    </div>

                                    <div style="margin-top: 35px; text-align: center;">
                                        <a href="mailto:${email}?subject=Re: ${subject}" style="background-color: #111827; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                            Reply via Email →
                                        </a>
                                    </div>

                                </div>

                                <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #F3F4F6;">
                                    <p style="margin: 0; color: #9CA3AF; font-size: 11px; letter-spacing: 0.5px;">SECURE CONTACT FORM</p>
                                </div>

                            </div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            `,
        };

        // 3. Send Email
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Email sent successfully', success: true }, { status: 200 });

    } catch (error) {
        console.error('Contact Email Error:', error);
        return NextResponse.json({ message: 'Failed to send email', success: false }, { status: 500 });
    }
}
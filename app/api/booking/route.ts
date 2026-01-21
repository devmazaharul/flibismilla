import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { 
            packageTitle, 
            packagePrice, 
            customerName, 
            customerEmail, 
            customerPhone, 
            travelDate, 
            returnDate, 
            guests, 
            notes 
        } = data;

        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            port: 587,
            secure: false,

            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: process.env.SMTP_EMAIL,
    subject: `✈️ Booking Request: ${packageTitle}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Request</title>
        <style>
            /* Mobile Responsiveness */
            @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 20px !important; }
                .row { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
                .col { width: 100% !important; display: block !important; padding: 0 !important; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 0;">
            <tr>
                <td align="center">
                    
                    <div class="container" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 30px rgba(0,0,0,0.08); text-align: left;">
                        
                        <div style="height: 6px; background: linear-gradient(90deg, #E11D48, #FF6B6B); width: 100%;"></div>

                        <div style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="display: inline-block; background-color: #FFF1F2; color: #E11D48; padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin-bottom: 15px;">NEW LEAD</div>
                            <h1 style="margin: 0; color: #1F2937; font-size: 24px; font-weight: 800;">Booking Inquiry Received</h1>
                            <p style="margin: 10px 0 0 0; color: #6B7280; font-size: 15px;">You have received a request from your website.</p>
                        </div>

                        <div style="padding: 0 40px;">
                            <div style="background-color: #ECFDF5; border: 1px solid #D1FAE5; border-radius: 16px; padding: 25px; text-align: center; position: relative;">
                                <p style="margin: 0; color: #059669; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Interested Package</p>
                                <h2 style="margin: 8px 0; color: #065F46; font-size: 22px; font-weight: 800;">${packageTitle}</h2>
                                <p style="margin: 0; color: #10B981; font-size: 18px; font-weight: 700;">${packagePrice} <span style="font-size: 13px; font-weight: 500; color: #065F46; opacity: 0.8;">/ per person</span></p>
                            </div>
                        </div>

                        <div style="padding: 40px;">
                            
                            <table class="row" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td class="col" width="100%" valign="top">
                                        <h3 style="color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; margin-top: 0;">👤 Personal Details</h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="col" style="padding-top: 10px;">
                                        <table width="100%">
                                            <tr>
                                                <td width="33%" style="padding-bottom: 10px;">
                                                    <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">NAME</span>
                                                    <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${customerName}</span>
                                                </td>
                                                <td width="33%" style="padding-bottom: 10px;">
                                                    <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">PHONE</span>
                                                    <a href="tel:${customerPhone}" style="font-size: 14px; color: #1F2937; font-weight: 600; text-decoration: none;">${customerPhone}</a>
                                                </td>
                                              
                                            </tr>
                                            <tr>
                                              <td width="33%" style="padding-bottom: 10px;">
                                                    <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">EMAIL</span>
                                                    <a href="mailto:${customerEmail}" style="font-size: 14px; color: #E11D48; font-weight: 600; text-decoration: none;">${customerEmail}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table class="row" width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="col" width="100%" valign="top">
                                        <h3 style="color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; margin-top: 10px;">✈️ Trip Information</h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="col" style="padding-top: 10px;">
                                        <table width="100%">
                                            <tr>
                                                <td width="50%" style="padding-bottom: 10px;">
                                                    <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">TRAVEL DATES</span>
                                                    <span style="font-size: 14px; color: #1F2937; font-weight: 600;">${travelDate}</span>
                                                    ${returnDate ? `<span style="font-size: 12px; color: #6B7280;"> to ${returnDate}</span>` : ''}
                                                </td>
                                                <td width="50%" style="padding-bottom: 10px;">
                                                    <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block;">TRAVELERS</span>
                                                    <span style="background: #F3F4F6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700;">${guests.adults} Adults</span>
                                                    ${guests.children > 0 ? `<span style="background: #F3F4F6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; margin-left: 5px;">${guests.children} Child</span>` : ''}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top: 25px;">
                                <span style="font-size: 11px; color: #9CA3AF; font-weight: 700; display: block; margin-bottom: 5px;">ADDITIONAL NOTES</span>
                                <div style="background-color: #FAFAFA; border: 1px dashed #E5E7EB; border-radius: 12px; padding: 15px; color: #4B5563; font-size: 14px; line-height: 1.5; font-style: italic;">
                                    "${notes || 'No specific requirements mentioned.'}"
                                </div>
                            </div>

                            <div style="margin-top: 35px; text-align: center;">
                                <a href="mailto:${customerEmail}?subject=Re: Your Booking Request for ${packageTitle}" style="background-color: #111827; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                    Reply to Customer →
                                </a>
                            </div>

                        </div>

                        <div style="background-color: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #F3F4F6;">
                            <p style="margin: 0; color: #9CA3AF; font-size: 11px; letter-spacing: 0.5px;">SECURE AUTOMATED EMAIL</p>
                        </div>

                    </div>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `,
};
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Email sent successfully', success: true }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: 'Failed to send email', success: false }, { status: 500 });
    }
}
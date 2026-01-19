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
            subject: `New Booking Request: ${packageTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #E11D48;">New Booking Request ✈️</h2>
                    <p>You have received a new booking request from your website.</p>
                    
                    <hr />
                    
                    <h3>📦 Package Details</h3>
                    <p><strong>Package:</strong> ${packageTitle}</p>
                    <p><strong>Price:</strong> ${packagePrice}</p>
                    
                    <h3>👤 Customer Details</h3>
                    <p><strong>Name:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Phone:</strong> ${customerPhone}</p>
                    
                    <h3>📅 Trip Details</h3>
                    <p><strong>Travel Date:</strong> ${travelDate}</p>
                    <p><strong>Return Date:</strong> ${returnDate || 'Not specified'}</p>
                    <p><strong>Guests:</strong> ${guests.adults} Adults, ${guests.children} Children</p>
                    
                    <h3>📝 Additional Notes</h3>
                    <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${notes || 'No notes provided.'}</p>
                </div>
            `,
        };

        // 3. ইমেইল পাঠানো
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Email sent successfully', success: true }, { status: 200 });

    } catch (error) {
        console.error('Email Error:', error);
        return NextResponse.json({ message: 'Failed to send email', success: false }, { status: 500 });
    }
}
import nodemailer from 'nodemailer';
import MeetingLink from '../models/MeetingLink.js';

// Create transporter with fallback for missing credentials
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // If credentials are missing, return null (will use demo mode)
  if (!emailUser || !emailPass) {
    console.log('Email credentials not configured. Emails will be logged instead of sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

const sendConfirmationEmail = async ({ email, name, courseName, coursePrice, registrationId, courseId }) => {
  try {
    const transporter = createTransporter();

    // Debug: Log the courseId being used
    console.log('Looking for meeting link for courseId:', courseId);

    // Fetch the active meeting link for the specific course
    const meetingLinkDoc = await MeetingLink.findOne({ course: courseId, isActive: true }).sort({ createdAt: -1 });
    console.log('Meeting link document found:', meetingLinkDoc);
    const meetLink = meetingLinkDoc ? meetingLinkDoc.link : null;
    console.log('meetLink value:', meetLink);

    const today = new Date();
    // Use the meeting link date if available, otherwise fallback to today
    let sessionDate = today;
    if (meetingLinkDoc && meetingLinkDoc.date) {
      sessionDate = new Date(meetingLinkDoc.date);
    }
    const formattedDate = sessionDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const emailContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6fb; padding: 0;">
        <div style="background: #2563eb; color: #fff; padding: 28px 20px 18px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 2rem; font-weight: 700; letter-spacing: 0.5px;">Payment Confirmation</h1>
          <p style="margin: 8px 0 0 0; font-size: 1.1rem;">Thank you for your registration!</p>
        </div>
        <div style="background: #fff; padding: 32px 24px 24px 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <h2 style="color: #222; font-size: 1.3rem; margin-top: 0;">Hello ${name},</h2>
          <p style="color: #444; font-size: 1.05rem; line-height: 1.7; margin-bottom: 24px;">
            We are pleased to confirm that your payment for <strong>${courseName}</strong> has been received and your registration is now <span style="color: #22c55e; font-weight: 600;">confirmed</span>.
          </p>

          <div style="background: #f1f5f9; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 1rem; color: #222;">
              <tr><td style="padding: 4px 0; font-weight: 600;">Course:</td><td style="padding: 4px 0;">${courseName}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: 600;">Amount Paid:</td><td style="padding: 4px 0;">₹${coursePrice}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: 600;">Registration ID:</td><td style="padding: 4px 0;">${registrationId}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: 600;">Date:</td><td style="padding: 4px 0;">${formattedDate}</td></tr>
            </table>
          </div>

          ${meetLink ? `
          <div style="background: #e0f7fa; border-left: 4px solid #2563eb; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; color: #2563eb; font-size: 1.1rem;">Your Meeting Link</h3>
            <a href="${meetLink}" style="display: inline-block; background: #2563eb; color: #fff; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 1.08rem; margin-bottom: 8px;">Join Meeting</a>
            <p style="margin: 10px 0 0 0; color: #444; font-size: 0.98rem;">Please use this link to join your session at the scheduled time. Do not share this link with others.</p>
          </div>
          ` : ''}

          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #222; font-size: 1.08rem;">Next Steps</h4>
            <ul style="color: #444; font-size: 1rem; padding-left: 20px; margin: 0;">
              <li>Check your calendar and set a reminder for the session date.</li>
              <li>Join the meeting 5 minutes before the scheduled time.</li>
              <li>For any questions, reply to this email.</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 0.98rem; margin-bottom: 0;">
            We look forward to seeing you at the session!<br>
            <strong>Gangadhar Nagarjuna</strong><br>
            Business Academy
          </p>
        </div>
        <div style="text-align: center; color: #aaa; font-size: 0.92rem; padding: 18px 0 8px 0;">
          &copy; ${today.getFullYear()} Gangadhar Nagarjuna Business Academy. All rights reserved.<br>
          <span style="font-size: 0.9em;">This is an automated message. Please do not reply directly to this email.</span>
        </div>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Payment Confirmation - ${courseName}`,
        html: emailContent
      });
      console.log('✅ Confirmation email sent successfully to:', email);
    } else {
      console.log('📧 Demo mode - Email would be sent to:', email);
      console.log('📧 Email content:', emailContent);
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.log('📧 Email failed but payment verification will continue');
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async ({ email, resetToken, resetUrl }) => {
  try {
    const transporter = createTransporter();

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">🔐 Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background-color: white;">
          <h2 style="color: #333;">Hello,</h2>
          
          <p style="color: #666; line-height: 1.6;">
            You requested a password reset for your admin account. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #007bff; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            This link will expire in 10 minutes for security reasons.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            <strong>Gangadhar Nagarjuna</strong><br>
            Business Academy
          </p>
        </div>
      </div>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request - Admin Panel',
        html: emailContent
      });
      console.log('✅ Password reset email sent successfully to:', email);
    } else {
      console.log('📧 Demo mode - Password reset email would be sent to:', email);
      console.log('📧 Reset URL:', resetUrl);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset email sending error:', error);
    return { success: false, error: error.message };
  }
};

export {
  sendConfirmationEmail,
  sendPasswordResetEmail
}; 
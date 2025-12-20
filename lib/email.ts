import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Log email user for testing
console.log('Email configuration:', {
  emailUser: process.env.EMAIL_USER || 'NOT SET',
  hasEmailPassword: !!process.env.EMAIL_PASSWORD
});

export const sendOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Code Player OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Code Player - OTP Verification</h2>
          <p>Your OTP for login is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

export const sendTestEmail = async (email: string, html: string, css: string, js: string): Promise<boolean> => {
  try {
    // Generate the preview HTML (just the output, not the code)
    // Embed the styles and HTML directly, JavaScript will be executed by the email client if supported
    const previewContent = `
      <style>
        ${css || '/* No CSS */'}
      </style>
      ${html || '<!-- No HTML -->'}
      <script>
        ${js || '// No JavaScript'}
      </script>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Code Player - Your Preview',
      html: previewContent
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

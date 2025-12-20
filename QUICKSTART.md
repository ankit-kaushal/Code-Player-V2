# Quick Start Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file in the root directory:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   JWT_SECRET=your-secret-key-change-this-to-something-random
   ```

   **Important for Gmail:**
   - Enable 2-Factor Authentication on your Google account
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate an app password and use it as `EMAIL_PASSWORD`

3. **Start the application:**
   ```bash
   npm run dev
   ```

   This will start the Next.js app on http://localhost:3000 (both frontend and backend on the same port!)

## First Use

1. Open http://localhost:3000 in your browser
2. Enter HTML, CSS, and JavaScript code in the respective panels
3. See the live preview update in real-time
4. Switch to the **Console** tab to see console.log, console.error, console.warn, and console.info output
5. Click "Login" to authenticate:
   - Enter your email
   - Check your email for the OTP
   - Enter the 6-digit OTP to login (account is created automatically)
6. Click "Save" to save your code and get a shareable link
7. Click "Share" to copy the shareable link
8. Click "Download" to download your code as an HTML file
9. Click "Creating this for email" to send your code via email (once per account)

## Console Tab

The Console tab captures all console output from your JavaScript code:
- **console.log()** - Regular logs (gray)
- **console.error()** - Error messages (red)
- **console.warn()** - Warnings (yellow)
- **console.info()** - Info messages (blue)

All logs are displayed with timestamps and can be scrolled through.

## Sharing Code

- After saving, click "Share" to copy the link
- Anyone with the link can view the code
- Only the owner (logged in) can edit shared code
- Non-owners viewing shared code will see it in read-only mode

## Troubleshooting

- **Email not sending?** Check your `.env.local` file has correct EMAIL_USER and EMAIL_PASSWORD
- **Database errors?** The SQLite database will be created automatically on first API call
- **Console not showing logs?** Make sure you're using console.log, console.error, console.warn, or console.info in your JavaScript code
- **Port already in use?** Change the port by running `PORT=3001 npm run dev`

## Production Build

```bash
npm run build
npm start
```

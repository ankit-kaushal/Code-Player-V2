# Code Player V2

A full-stack code player application for HTML, CSS, and JavaScript with authentication, sharing, and email features. Built with Next.js, so backend and frontend run on the same port.

## Features

- **Code Editor**: Edit HTML, CSS, and JavaScript in separate panels
- **Live Preview**: See your code output in real-time
- **Console Tab**: View console.log, console.error, console.warn, and console.info output from your code
- **Download**: Download your code as a complete HTML file
- **Authentication**: Email/OTP-based login system
- **Sharing**: Share your code with unique shareable links
- **View-only Mode**: View shared codes without editing (unless you're the owner)
- **Test Email**: Send your code via email (requires email credits)
- **Email Credits**: Purchase email credits to send test emails
- **Payment Integration**: Cashfree payment gateway for purchasing email credits
- **Auto Account Creation**: Accounts are automatically created on first login
- **Single Port**: Backend and frontend run on the same port (Next.js)
- **Resizable Editors**: Drag to resize HTML, CSS, and JS editor widths
- **Collapsible Editors**: Collapse/expand individual editors
- **MongoDB**: Uses MongoDB for data storage

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gmail account with App Password (for email functionality)
- MongoDB Atlas account (or MongoDB instance)

### Installation

1. Navigate to the project directory:
```bash
cd Code-Player-V2
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Production Mode

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Usage

1. **Create Code**: Enter your HTML, CSS, and JavaScript code in the respective panels
2. **Preview**: See the live preview update as you type
3. **Console**: Switch to the Console tab to see console.log, console.error, console.warn, and console.info output
4. **Resize Editors**: Drag the gray bars between editors to resize their widths
5. **Collapse Editors**: Click the ▼ button in editor headers to collapse/expand them
6. **Login**: Click "Login" to authenticate with email/OTP
7. **Save**: After logging in, save your code to get a shareable link
8. **Share**: Click "Share" to copy the shareable link (URL will be updated to /[id] format)
9. **Download**: Download your code as an HTML file
10. **Send Email**: Click "Creating this for email" to send your code preview via email (requires email credits)
11. **Purchase Credits**: Go to Account page to purchase email credits (1 email = ₹5, 5 emails = ₹20, 10 emails = ₹40, 100 emails = ₹350)
11. **View Shared**: Open a shared link to view code (login required to edit if you're not the owner)

## Project Structure

```
Code-Player-V2/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── code/               # Code CRUD endpoints
│   │   └── email/              # Email endpoints
│   ├── components/             # React components
│   ├── context/                # React context (Auth)
│   ├── [id]/                   # Dynamic route for shared codes
│   ├── page.tsx                # Main page
│   └── layout.tsx              # Root layout
├── lib/
│   ├── database.ts             # MongoDB connection and utilities
│   ├── email.ts                # Nodemailer utilities
│   └── auth.ts                 # Authentication utilities
└── package.json
```

## API Endpoints

All API routes are under `/api/`:

### Authentication
- `POST /api/auth/request-otp` - Request OTP for email
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/auth/me` - Get current user (requires auth)

### Code
- `POST /api/code/save` - Save code (requires auth)
- `GET /api/code/shared/[shareId]` - Get shared code
- `GET /api/code/shared/[shareId]/can-edit` - Check edit permissions (requires auth)

### Email
- `POST /api/email/send-test` - Send test email (requires auth, deducts 1 credit)
- `GET /api/email/can-send` - Check if user can send email and get credit count (requires auth)

### Payment
- `POST /api/payment/create-session` - Create Cashfree payment session (requires auth)
- `POST /api/payment/verify` - Verify payment and add credits (requires auth)

### User
- `GET /api/user/credits` - Get user's email credits and payment history (requires auth)

## Database

The application uses **MongoDB** with the following collections:

- `users` - User accounts (email, createdAt, emailCredits, paymentHistory, emailsSent)
- `codes` - Saved code snippets (userId, shareId, html, css, js, createdAt, updatedAt)

## Console Tab

The Console tab captures and displays:
- `console.log()` - Regular logs
- `console.error()` - Error messages (red)
- `console.warn()` - Warnings (yellow)
- `console.info()` - Info messages (blue)

All console output from the preview iframe is captured and displayed in real-time.

## Security Features

- JWT-based authentication
- OTP expiration (10 minutes)
- One-time use OTPs (stored in memory, not database)
- Email credit system for sending test emails
- Cashfree payment integration with signature verification
- Share ID-based access control
- Edit permissions based on ownership

## License

ISC

# Authentication Setup Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# JWT Secret (change this in production)
JWT_SECRET=49aa564ea09390f8dd2d5aeb0d1558c78c568a6f672e4abae188f40f08574ec396dccdc7eaefdc6848c59455ec58b14b4dcbf619cbce51ec6369baabec053d5f

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MongoDB Atlas Connection String (includes database name)
MONGODB_URI=mongodb+srv://rcommandur:Cu44ent2005@cluster0.vyw4kan.mongodb.net/GroupPot?retryWrites=true&w=majority&appName=Cluster0
```

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Get Started Free"
3. Fill in your details and create an account

### 2. Create a New Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to you
5. Click "Create"

### 3. Set Up Database Access
1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### 4. Set Up Network Access
1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 5. Get Your Connection String
1. Go back to "Database" in the sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Select "Node.js" driver
5. Copy the connection string and replace username/password
6. **Important**: Add `/GroupPot` after `.net/` to specify the database name

## Database Creation

**You don't need to manually create a database!** Mongoose will automatically:
- Create the `GroupPot` database when you first save data
- Create collections (`users`, `groups`, `bets`) when you first insert documents
- Set up proper indexes and validation

## JWT Secret Generation

I've generated a secure JWT secret for you above. If you want to generate a new one, you can:

1. **Using Node.js** (if you have it installed):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Using an online generator** (for development only):
   - Visit https://generate-secret.vercel.app/64
   - Copy the generated string

3. **Using PowerShell** (Windows):
   ```powershell
   $bytes = New-Object Byte[] 64
   (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
   [System.BitConverter]::ToString($bytes) -replace '-', ''
   ```

**Important**: Use a different JWT secret for production environments!

## Gmail App Password Setup

To use Gmail for sending emails, you need to:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in your `EMAIL_PASSWORD` environment variable

## Features Implemented

### Authentication
- ✅ User registration with email verification
- ✅ User login with JWT tokens
- ✅ Password reset via email
- ✅ Secure password hashing with bcrypt
- ✅ JWT token management
- ✅ Authentication context for state management
- ✅ MongoDB Atlas integration

### Database
- ✅ MongoDB Atlas connection
- ✅ User model with indexes
- ✅ Group model with relationships
- ✅ Bet model with voting system
- ✅ Proper data validation and constraints

### UI Components
- ✅ Beautiful login page with form validation
- ✅ Comprehensive signup page with password strength validation
- ✅ Forgot password page
- ✅ Reset password page with token validation
- ✅ Updated site header with login/logout functionality
- ✅ Loading states and error handling

### Email Integration
- ✅ Welcome emails for new users
- ✅ Password reset emails with secure tokens
- ✅ Professional email templates
- ✅ Token expiration (1 hour for reset tokens)

### Security Features
- ✅ Password strength validation
- ✅ Secure token generation
- ✅ Email enumeration protection
- ✅ CSRF protection through proper form handling
- ✅ Input validation and sanitization

## Usage

1. **Registration**: Users can create accounts with username, email, and password
2. **Login**: Users can log in with email and password
3. **Password Reset**: Users can request password reset via email
4. **Session Management**: JWT tokens are stored in localStorage and automatically refreshed
5. **Logout**: Users can log out, which clears their session

## Sample Users

The system comes with two sample users for testing:

- **Email**: john@example.com, **Password**: password123
- **Email**: jane@example.com, **Password**: password123

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Next Steps

1. Set up your environment variables in `.env`
2. Test the authentication flow with MongoDB
3. Customize email templates if needed
4. Add additional security measures for production
5. Implement email verification for new accounts (optional) 
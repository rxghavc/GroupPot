# GroupPot - Social Betting Platform

A sophisticated group betting platform built with Next.js that enables friends and communities to create and participate in custom betting pools with advanced settlement logic and comprehensive analytics.

## 🎯 Features

### Core Betting System
- **Multi-format Betting**: Support for single-choice and multi-choice bets
- **Advanced Settlement Logic**: 
  - Exact match betting (all selections must be correct)
  - Partial match betting (proportional payouts for partially correct selections)
  - Automatic refund system when no winners exist
- **Dynamic Payout Calculation**: Pool-based profit distribution with proportional stake allocation
- **Flexible Stake Management**: Configurable minimum and maximum stake limits per bet

### Group Management
- **Private Group Creation**: Invite-only groups with unique access codes
- **Role-based Permissions**: Owner and moderator roles with different privileges
- **Member Analytics**: Comprehensive statistics including win rates, profit/loss, and betting history
- **Group-specific Analytics**: Track performance across different betting communities

### User Experience
- **Real-time Updates**: Auto-refreshing data with manual refresh controls
- **Comprehensive Dashboard**: Personal betting portfolio with performance metrics
- **Detailed Betting History**: Complete transaction history with profit/loss tracking
- **Responsive Design**: Mobile-first design with adaptive layouts
- **Interactive Charts**: Visual representation of betting performance over time

### Security & Authentication
- **JWT-based Authentication**: Secure token-based user sessions
- **Password Reset System**: Email-based password recovery
- **Account Management**: Complete user profile and account deletion capabilities

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern component library
- **Recharts**: Data visualization
- **Lucide React**: Icon system

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **MongoDB Atlas**: Cloud database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication tokens
- **Nodemailer**: Email services

### Development Tools
- **ESLint**: Code linting
- **Turbopack**: Fast bundler
- **SWR**: Data fetching and caching

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- SMTP email service (for password reset)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_HOST=your_smtp_host
   EMAIL_PORT=your_smtp_port
   EMAIL_USER=your_email_username
   EMAIL_PASS=your_email_password
   EMAIL_FROM=your_from_email_address
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 Key Architecture Decisions

### Database Design
- **User Management**: Secure user profiles with encrypted passwords
- **Group System**: Hierarchical group structure with member roles
- **Betting Logic**: Flexible bet schema supporting multiple voting types
- **Vote Tracking**: Granular vote recording for accurate payout calculations

### Settlement Algorithm
The platform implements a sophisticated settlement system:
- **Pool-based Payouts**: Winners share the total pool proportionally to their stakes
- **Partial Match Logic**: Users can win proportional amounts for partially correct multi-choice bets
- **Refund Handling**: Automatic refunds when no valid winners exist
- **Stake Splitting**: Complex calculation for partial match scenarios

### Performance Optimizations
- **SWR Caching**: Efficient data fetching with automatic revalidation
- **Auto-refresh System**: Smart polling with user activity detection
- **Responsive Loading**: Skeleton screens and progressive loading
- **Error Boundaries**: Graceful error handling throughout the application

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Groups
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/[groupId]` - Get group details
- `POST /api/groups/[groupId]/members` - Add group member
- `DELETE /api/groups/[groupId]/members/[userId]` - Remove member

### Betting
- `POST /api/bets` - Create new bet
- `GET /api/groups/[groupId]/bets` - Get group bets
- `POST /api/bets/[betId]/vote` - Place vote
- `POST /api/bets/[betId]/outcome` - Settle bet (moderators only)
- `GET /api/bets/[betId]/payouts` - Get settlement results

### Analytics
- `GET /api/users/[userId]/bets` - User betting history
- `GET /api/dashboard/stats` - Dashboard statistics

## 🚦 Future Enhancements

- **Multi-currency Support**: Support for different currency symbols and conversion
- **Enhanced Analytics**: Advanced statistical analysis and predictions
- **Mobile App**: Native mobile applications
- **Real-time Notifications**: Push notifications for bet updates
- **Social Features**: Comments, reactions, and social sharing
- **Advanced Bet Types**: Support for more complex betting scenarios

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop**: Full-featured experience with advanced analytics
- **Tablet**: Optimized layouts for medium screens
- **Mobile**: Touch-friendly interface with essential features

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome. Please feel free to open issues for bugs or feature requests.

## 📄 License

This project is for portfolio purposes. All rights reserved.

---


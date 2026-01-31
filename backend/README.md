# AI Platform Backend

Backend API for AI Platform SaaS with Hetzner integration.

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Set up database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run development server
```bash
npm run dev
```

Server will be available at `http://localhost:3001`

API Docs: `http://localhost:3001/docs`

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── index.js               # Server entry point
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── users.js           # User routes
│   │   ├── admin.js           # Admin routes
│   │   └── support.js         # Support ticket routes
│   ├── services/              # Business logic (to be added)
│   ├── workers/               # Background jobs (to be added)
│   └── utils/                # Utilities (to be added)
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/models` - Update custom models

### Users
- `GET /api/users/dashboard` - Get user dashboard data
- `GET /api/users/backups` - Get user's backups
- `GET /api/users/invoices` - Get user's invoices
- `GET /api/users/plans` - Get subscription plans

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/subscriptions` - Get subscription plans
- `POST /api/admin/subscriptions` - Create plan
- `PUT /api/admin/subscriptions/:id` - Update plan
- `DELETE /api/admin/subscriptions/:id` - Delete plan
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/activate` - Activate user
- `DELETE /api/admin/users/:id` - Delete user

### Support
- `GET /api/support/tickets` - Get user's tickets
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets/:id` - Get ticket details
- `POST /api/support/tickets/:id/messages` - Add message

## 📊 Database Schema

### Tables
- `User` - User accounts and subscriptions
- `SubscriptionPlan` - Subscription plans
- `Backup` - User data backups
- `Invoice` - Payment invoices
- `SupportTicket` - Support tickets
- `TicketMessage` - Ticket messages
- `Admin` - Admin accounts

## 🔐 Security

- JWT authentication for protected routes
- Password hashing with bcrypt
- CORS enabled
- Input validation (to be added)

## 🛠️ To Be Implemented

- [ ] Hetzner API integration service
- [ ] Backup service
- [ ] Email notification service
- [ ] Stripe integration
- [ ] Cron jobs for automated tasks
- [ ] WebSocket integration for real-time updates

## 📝 Environment Variables

See `.env.example` for required variables.

## 🚢 Deployment

Build for production:
```bash
npm install --production
npm start
```

## 📄 License

MIT

---

*Created by Saleh 🚀*

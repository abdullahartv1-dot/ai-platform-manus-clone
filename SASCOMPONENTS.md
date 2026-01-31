# مكونات SaaS Platform - مخطط شامل

## 🎯 ما هي المنصة؟

**منصة SaaS متكاملة تدير دورة حياة كاملة للمستخدمين:**
1. التسجيل والاشتراك
2. إدارة السيرفرات (Hetzner API)
3. النسخ الاحتياطية التلقائية
4. إشعارات البريد الإلكتروني
5. الفوترة والدفع

---

## 🏗️ المكونات الأساسية (Core Components)

### 1. 📱 Frontend (Next.js)

**المسؤول عن:**
- واجهة التسجيل والدخول
- لوحة تحكم المستخدم
- عرض المحادثة مع AI
- الشاشة الجانبية (Terminal, Browser)
- إعدادات المستخدم والنماذج
- إدارة الاشتراكات

**التقنيات:**
- Next.js 14+ (App Router)
- TypeScript
- shadcn/ui
- Socket.io (للـ real-time updates)
- XTerm.js (للـ terminal)

**الملفات الرئيسية:**
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Main dashboard
│   │   ├── chat/page.tsx       # AI Chat interface
│   │   ├── settings/page.tsx   # User settings
│   │   └── billing/page.tsx    # Subscription & billing
│   └── api/
│       └── webhooks/
│           └── stripe/route.ts # Stripe webhooks
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── Chat.tsx                # Chat interface
│   ├── Terminal.tsx            # Terminal sidebar
│   ├── BrowserPreview.tsx      # Browser automation view
│   └── ModelSelector.tsx      # Model selection UI
├── lib/
│   ├── api.ts                  # API client
│   ├── socket.ts               # Socket.io client
│   └── utils.ts
└── styles/
    └── globals.css
```

---

### 2. 🚀 Backend API (Node.js + Fastify)

**المسؤول عن:**
- Authentication & Authorization
- User Management
- Subscription Management
- Hetzner API Integration
- Backup Management
- Email Notifications
- Stripe Integration
- Real-time communication (Socket.io)

**التقنيات:**
- Node.js 20+
- Fastify (أو Express)
- TypeScript
- PostgreSQL + Prisma
- Socket.io
- BullMQ (للمهام الخلفية)

**الملفات الرئيسية:**
```
backend/
├── src/
│   ├── index.ts                 # Server entry point
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   ├── users.ts            # User management
│   │   ├── servers.ts          # Hetzner server management
│   │   ├── subscriptions.ts    # Subscription management
│   │   ├── backups.ts          # Backup management
│   │   ├── email.ts            # Email notifications
│   │   └── billing.ts          # Stripe integration
│   ├── services/
│   │   ├── hetzner.ts         # Hetzner API wrapper
│   │   ├── backup.ts          # Backup service
│   │   ├── email.ts           # Email service
│   │   ├── stripe.ts          # Stripe service
│   │   └── cron.ts            # Scheduled tasks
│   ├── workers/
│   │   ├── provision-user.ts  # Provision new users
│   │   ├── backup-user.ts     # Backup user data
│   │   ├── suspend-user.ts    # Suspend expired users
│   │   └── delete-server.ts   # Delete servers
│   ├── models/
│   │   └── schemas.ts         # Prisma schemas
│   └── utils/
│       ├── jwt.ts             # JWT utilities
│       ├── encryption.ts      # Encryption utilities
│       └── logger.ts          # Logging utilities
└── prisma/
    └── schema.prisma          # Database schema
```

---

### 3. 💾 Database (PostgreSQL + Prisma)

**الـ Tables الرئيسية:**

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  passwordHash      String
  name              String?

  // Subscription info
  plan              String   @default("free") // free, starter, pro, enterprise
  subscriptionStatus String   @default("inactive") // inactive, active, suspended, expired
  subscriptionStartedAt DateTime?
  subscriptionExpiresAt DateTime?

  // Server info
  serverId          String?  @unique // Hetzner server ID
  serverIp          String?
  serverStatus      String?  // creating, running, stopped, error

  // User preferences
  defaultModel      String?  @default("gpt-4")
  customModels      Json?    // { "openai": "sk-...", "anthropic": "sk-..." }

  // Metadata
  lastActiveAt      DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  backups           Backup[]
  invoices          Invoice[]
}

model Backup {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // Backup metadata
  type              String   // full, incremental
  size              Int      // in bytes
  status            String   // pending, completed, failed

  // Storage info
  localPath         String?
  cloudPath         String?

  // Metadata
  createdAt         DateTime @default(now())
  expiresAt         DateTime?

  @@index([userId])
}

model Invoice {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // Payment info
  amount            Float
  currency          String   @default("USD")
  status            String   // pending, paid, failed, refunded

  // Stripe info
  stripeInvoiceId   String   @unique
  stripePaymentIntentId String?

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
}
```

---

### 4. 🌐 Hetzner API Integration

**المسؤول عن:**
- إنشاء Servers للمستخدمين الجدد
- حذف Servers للمستخدمين المنتهية اشتراكاتهم
- Start/Stop Servers
- مراقبة حالة Servers
- إدارة SSH Keys

**الـ Functions الرئيسية:**

```typescript
// services/hetzner.ts
import axios from 'axios';

const HETZNER_API_URL = 'https://api.hetzner.cloud/v1';
const API_TOKEN = process.env.HETZNER_API_TOKEN;

export class HetznerService {
  // Create server for new user
  async createServer(userId: string, plan: 'starter' | 'pro') {
    const serverType = plan === 'starter' ? 'cx21' : 'cx31';

    const response = await axios.post(
      `${HETZNER_API_URL}/servers`,
      {
        name: `user-${userId}-server`,
        server_type: serverType,
        image: 'ubuntu-22.04',
        location: 'fsn1', // Frankfurt
        ssh_keys: [process.env.HETZNER_SSH_KEY_ID],
        user_data: `
          #cloud-config
          runcmd:
            - apt-get update && apt-get install -y curl
            - curl -sSL https://get.clawdbot.sh | bash
        `
      },
      {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      }
    );

    return response.data.server;
  }

  // Delete server
  async deleteServer(serverId: string) {
    await axios.delete(
      `${HETZNER_API_URL}/servers/${serverId}`,
      {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      }
    );
  }

  // Stop server (save costs)
  async stopServer(serverId: string) {
    await axios.post(
      `${HETZNER_API_URL}/servers/${serverId}/actions/poweroff`,
      {},
      {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      }
    );
  }

  // Start server
  async startServer(serverId: string) {
    await axios.post(
      `${HETZNER_API_URL}/servers/${serverId}/actions/poweron`,
      {},
      {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      }
    );
  }

  // Get server status
  async getServerStatus(serverId: string) {
    const response = await axios.get(
      `${HETZNER_API_URL}/servers/${serverId}`,
      {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      }
    );
    return response.data.server.status;
  }
}
```

---

### 5. 💾 Backup Service

**المسؤول عن:**
- إنشاء نسخ احتياطية دورية
- إنشاء نسخ احتياطية قبل حذف السيرفر
- تخزين النسخ محلياً وفي السحابة
- استعادة البيانات عند الحاجة
- حذف النسخ القديمة

**الـ Functions الرئيسية:**

```typescript
// services/backup.ts
import { SSH } from './ssh';
import { S3 } from '@aws-sdk/client-s3';

export class BackupService {
  // Create backup for user
  async createBackup(userId: string, serverIp: string) {
    const backupId = `backup-${userId}-${Date.now()}`;

    // 1. SSH into server
    const ssh = await SSH.connect(serverIp);

    try {
      // 2. Create backup directory
      await ssh.exec(`mkdir -p /tmp/backups/${backupId}`);

      // 3. Backup Clawdbot config
      await ssh.exec(`rsync -avz ~/.clawdbot/ /tmp/backups/${backupId}/clawdbot/`);

      // 4. Backup user data
      await ssh.exec(`rsync -avz /home/user/ /tmp/backups/${backupId}/user-data/`);

      // 5. Backup database (if exists)
      await ssh.exec(`pg_dump user_db > /tmp/backups/${backupId}/database.sql 2>/dev/null || true`);

      // 6. Create checksum
      await ssh.exec(`sha256sum /tmp/backups/${backupId}/* > /tmp/backups/${backupId}/checksum.sha256`);

      // 7. Compress backup
      await ssh.exec(`cd /tmp/backups && tar -czf ${backupId}.tar.gz ${backupId}/`);

      // 8. Download backup from server
      await this.downloadFromServer(ssh, `/tmp/backups/${backupId}.tar.gz`, `/backups/${backupId}.tar.gz`);

      // 9. Upload to S3
      await this.uploadToS3(`/backups/${backupId}.tar.gz`, `backups/${userId}/${backupId}.tar.gz`);

      // 10. Save backup info to database
      await prisma.backup.create({
        data: {
          userId,
          type: 'full',
          size: this.getFileSize(`/backups/${backupId}.tar.gz`),
          status: 'completed',
          localPath: `/backups/${backupId}.tar.gz`,
          cloudPath: `backups/${userId}/${backupId}.tar.gz`,
          expiresAt: this.getExpiryDate(userId),
        }
      });

      return backupId;
    } finally {
      await ssh.disconnect();
    }
  }

  // Restore backup
  async restoreBackup(userId: string, backupId: string, serverIp: string) {
    const backup = await prisma.backup.findFirst({
      where: { userId, id: backupId }
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // 1. Download from S3
    await this.downloadFromS3(backup.cloudPath, `/tmp/${backupId}.tar.gz`);

    // 2. Upload to server
    const ssh = await SSH.connect(serverIp);
    await this.uploadToServer(ssh, `/tmp/${backupId}.tar.gz`, `/tmp/backup.tar.gz`);

    try {
      // 3. Extract backup
      await ssh.exec(`tar -xzf /tmp/backup.tar.gz -C /tmp/`);

      // 4. Verify checksum
      await ssh.exec(`sha256sum -c /tmp/${backupId}/checksum.sha256`);

      // 5. Restore Clawdbot config
      await ssh.exec(`rsync -avz /tmp/${backupId}/clawdbot/ ~/.clawdbot/`);

      // 6. Restore user data
      await ssh.exec(`rsync -avz /tmp/${backupId}/user-data/ /home/user/`);

      // 7. Restore database (if exists)
      await ssh.exec(`psql user_db < /tmp/${backupId}/database.sql 2>/dev/null || true`);

      return true;
    } finally {
      await ssh.disconnect();
    }
  }

  // Delete expired backups
  async deleteExpiredBackups() {
    const expiredBackups = await prisma.backup.findMany({
      where: {
        expiresAt: {
          lte: new Date()
        }
      }
    });

    for (const backup of expiredBackups) {
      // Delete from local storage
      if (backup.localPath) {
        await fs.unlink(backup.localPath).catch(() => {});
      }

      // Delete from S3
      if (backup.cloudPath) {
        await this.deleteFromS3(backup.cloudPath);
      }

      // Delete from database
      await prisma.backup.delete({
        where: { id: backup.id }
      });
    }
  }
}
```

---

### 6. 📧 Email Notification Service

**المسؤول عن:**
- إرسال تذكيرات قبل انتهاء الاشتراك
- إشعارات الدفع
- رسائل ترحيب
- إشعارات النظام

**التقنيات:**
- Resend (أو SendGrid)
- Email templates (Handlebars or MJML)

**الـ Functions الرئيسية:**

```typescript
// services/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  // Welcome email
  async sendWelcomeEmail(email: string, name: string) {
    await resend.emails.send({
      from: 'noreply@ai-platform.com',
      to: email,
      subject: 'Welcome to AI Platform!',
      html: `
        <h1>Welcome ${name}! 👋</h1>
        <p>Your AI Platform account is ready.</p>
        <p>Login to access your workspace.</p>
      `
    });
  }

  // Subscription expiring reminder
  async sendSubscriptionExpiringReminder(email: string, daysLeft: number) {
    await resend.emails.send({
      from: 'noreply@ai-platform.com',
      to: email,
      subject: `Your subscription expires in ${daysLeft} days`,
      html: `
        <h1>Subscription Expiring Soon ⏰</h1>
        <p>Your subscription expires in ${daysLeft} days.</p>
        <p>Renew now to keep your server and data.</p>
        <a href="https://ai-platform.com/billing">Renew Now</a>
      `
    });
  }

  // Backup created notification
  async sendBackupCreatedNotification(email: string, backupId: string) {
    await resend.emails.send({
      from: 'noreply@ai-platform.com',
      to: email,
      subject: 'Backup Created Successfully ✓',
      html: `
        <h1>Backup Created ✓</h1>
        <p>Your data has been backed up successfully.</p>
        <p>Backup ID: ${backupId}</p>
      `
    });
  }

  // Payment successful
  async sendPaymentSuccessful(email: string, amount: number) {
    await resend.emails.send({
      from: 'noreply@ai-platform.com',
      to: email,
      subject: 'Payment Successful ✓',
      html: `
        <h1>Payment Successful ✓</h1>
        <p>Thank you for your payment of $${amount}.</p>
        <p>Your subscription has been renewed.</p>
      `
    });
  }

  // Server ready notification
  async sendServerReady(email: string, serverIp: string) {
    await resend.emails.send({
      from: 'noreply@ai-platform.com',
      to: email,
      subject: 'Your Server is Ready! 🚀',
      html: `
        <h1>Your Server is Ready! 🚀</h1>
        <p>Your AI Platform server is now online.</p>
        <p>Server IP: ${serverIp}</p>
        <a href="https://ai-platform.com/dashboard">Access Your Dashboard</a>
      `
    });
  }
}
```

---

### 7. ⏰ Cron Jobs (Scheduled Tasks)

**المسؤول عن:**
- مراقبة انتهاء الاشتراكات
- إنشاء النسخ الاحتياطية التلقائية
- حذف السيرفرات المنتهية
- حذف النسخ الاحتياطية القديمة
- إرسال التذكيرات

**الـ Cron Jobs الرئيسية:**

```typescript
// services/cron.ts
import cron from 'node-cron';
import { HetznerService } from './hetzner';
import { BackupService } from './backup';
import { EmailService } from './email';
import { prisma } from './prisma';

const hetzner = new HetznerService();
const backup = new BackupService();
const email = new EmailService();

// Run every hour - Check subscription expirations
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Checking subscription expirations...');

  const users = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    }
  });

  for (const user of users) {
    const daysUntilExpiry = Math.ceil(
      (user.subscriptionExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry === 7) {
      await email.sendSubscriptionExpiringReminder(user.email, 7);
    } else if (daysUntilExpiry === 3) {
      await email.sendSubscriptionExpiringReminder(user.email, 3);
      await backup.createBackup(user.id, user.serverIp);
    } else if (daysUntilExpiry === 1) {
      await email.sendSubscriptionExpiringReminder(user.email, 1);
      await backup.createBackup(user.id, user.serverIp);
    } else if (daysUntilExpiry <= 0) {
      // Create final backup
      await backup.createBackup(user.id, user.serverIp);

      // Delete server
      await hetzner.deleteServer(user.serverId);

      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'expired',
          serverId: null,
          serverIp: null
        }
      });

      console.log(`[Cron] Suspended user ${user.id} - server deleted`);
    }
  }
});

// Run every day at midnight - Delete expired backups
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Deleting expired backups...');
  await backup.deleteExpiredBackups();
});

// Run every 6 hours - Stop inactive servers
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Stopping inactive servers...');

  const inactiveUsers = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'active',
      serverStatus: 'running',
      lastActiveAt: {
        lte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      }
    }
  });

  for (const user of inactiveUsers) {
    await hetzner.stopServer(user.serverId);

    await prisma.user.update({
      where: { id: user.id },
      data: { serverStatus: 'stopped' }
    });

    console.log(`[Cron] Stopped server for inactive user ${user.id}`);
  }
});

console.log('Cron jobs started');
```

---

### 8. 💳 Stripe Integration (Fulfillment)

**المسؤول عن:**
- إنشاء Subscriptions
- معالجة الـ Webhooks
- تحديث حالة الاشتراك
- إرسال الفواتير

**الـ Functions الرئيسية:**

```typescript
// services/stripe.ts
import Stripe from 'stripe';
import { HetznerService } from './hetzner';
import { BackupService } from './backup';
import { EmailService } from './email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const hetzner = new HetznerService();
const backup = new BackupService();
const email = new EmailService();

// Create subscription
export async function createSubscription(userId: string, planId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: planId,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
    metadata: {
      userId: userId
    }
  });

  return session;
}

// Handle Stripe webhook
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata.userId;

      // Get user and plan info
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const plan = getPlanFromPriceId(session.display_items[0].price.id);

      // Create server
      const server = await hetzner.createServer(userId, plan);

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'active',
          subscriptionStartedAt: new Date(),
          subscriptionExpiresAt: getNextBillingDate(),
          serverId: server.id,
          serverIp: server.public_net.ipv4.ip,
          serverStatus: 'creating'
        }
      });

      // Send email
      await email.sendServerReady(user.email, server.public_net.ipv4.ip);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = invoice.metadata.userId;

      // Renew subscription
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionExpiresAt: getNextBillingDate()
        }
      });

      // Send email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await email.sendPaymentSuccessful(user.email, invoice.amount_due / 100);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const userId = invoice.metadata.userId;

      // Mark subscription as past_due
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'past_due'
        }
      });

      // Send email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      await email.sendPaymentFailed(user.email);
      break;
    }
  }
}
```

---

## 📊 مخطط تدفق العمل (Workflow)

### تدفق المستخدم الجديد:
```
1. User registers on Frontend
   ↓
2. Frontend sends request to Backend API
   ↓
3. Backend creates user in Database
   ↓
4. User selects plan (Starter/Pro)
   ↓
5. Stripe Checkout session created
   ↓
6. User completes payment
   ↓
7. Stripe webhook triggered
   ↓
8. Backend calls Hetzner API to create server
   ↓
9. Server is created and configured
   ↓
10. User receives email: "Server is ready!"
   ↓
11. User logs in and sees their workspace
```

### تدفق انتهاء الاشتراك:
```
1. Cron job runs (every hour)
   ↓
2. Checks users expiring in 7 days
   ↓
3. Day 7: Send email reminder
   ↓
4. Day 3: Create backup + send email
   ↓
5. Day 1: Create final backup + send email
   ↓
6. Day 0:
   - Create backup
   - Delete server via Hetzner API
   - Update user status to "expired"
   - Send email: "Subscription expired"
   ↓
7. Server is deleted (costs saved!)
   ↓
8. Backup is retained for 7-90 days
```

### تدفق استعادة الاشتراك:
```
1. User renews subscription
   ↓
2. Stripe webhook triggered
   ↓
3. Backend creates new server via Hetzner API
   ↓
4. Server is configured
   ↓
5. Backup is restored from S3
   ↓
6. User receives email: "Server is ready!"
   ↓
7. User logs in - data is exactly as before!
```

---

## 🚀 متى نبدأ؟

### Phase 1: الأساسيات (Week 1-2)
- [ ] إعداد PostgreSQL + Prisma
- [ ] بناء User Authentication
- [ ] بناء Frontend الأساسي (Login/Register)

### Phase 2: Hetzner Integration (Week 2-3)
- [ ] بناء Hetzner API wrapper
- [ ] Server provisioning (create/stop/start/delete)
- [ ] SSH service للتكوين

### Phase 3: Backup System (Week 3-4)
- [ ] Backup service
- [ ] S3/MinIO integration
- [ ] Restore functionality

### Phase 4: Email Notifications (Week 4)
- [ ] Email service (Resend)
- [ ] Email templates
- [ ] Cron jobs

### Phase 5: Stripe Integration (Week 4-5)
- [ ] Stripe checkout
- [ ] Webhook handlers
- [ ] Invoice management

### Phase 6: Frontend UI (Week 5-7)
- [ ] Dashboard UI
- [ ] Chat interface
- [ ] Terminal sidebar
- [ ] Settings & billing

### Phase 7: Testing & Launch (Week 7-8)
- [ ] E2E testing
- [ ] Bug fixes
- [ ] Launch! 🚀

---

## ✅ Action Items

### فوراً:
1. ⏳ هل تريد أن أبدأ ببناء الـ Backend API؟
2. ⏳ أم تفضل البدء بالـ Frontend؟
3. ⏳ أم تريد إعداد قاعدة البيانات أولاً؟

### أنا جاهز للبدء! 🚀 فقط أخبرني من أين نبدأ!

---

*تم إنشاؤه بواسطة صالح 🚀*

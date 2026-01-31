# Hetzner Cloud Integration - دليل كامل

## ✅ لماذا Hetzner؟

**هetzner هو الأفضل للمشروع!**

### المزايا:
- ✅ **API ممتاز:** REST API + Python/Go SDKs
- ✅ **أفضل سعر:** من أرخص providers في أوروبا
- ✅ **سرعة عالية:** Network سريع جداً في أوروبا والشرق الأوسط
- ✅ **موثوقية:** Uptime 99.9%+
- ✅ **Easy Scaling:** Upgrade/Downgrade بسهولة
- ✅ **Excellent Documentation:** توثيقات شاملة وواضحة
- ✅ **Support:** فريق دعم سريع ومحترف
- ✅ **Billing:** فواتير دقيقة وشفافة

---

## 🔌 Hetzner Cloud API

### 1. الحصول على API Token

**الخطوات:**
1. Log in to https://console.hetzner.cloud/
2. Go to **Security** → **API Tokens**
3. Click **Generate API Token**
4. Choose **Read & Write** permissions
5. Copy the API token (احفظه بأمان!)

**مثال:**
```bash
export HETZNER_API_TOKEN="your_api_token_here"
```

---

### 2. المواصفات والأسعار (Cloud Servers - CX Series)

| Plan | vCPU | RAM | Disk | Bandwidth | Price (Monthly) |
|------|------|-----|------|-----------|----------------|
| **CX11** | 1 | 4 GB | 20 GB | 20 TB | **€4.50** (≈$4.9) |
| **CX21** | 2 | 8 GB | 40 GB | 20 TB | **€9.70** (≈$10.5) |
| **CX22** | 2 | 8 GB | 80 GB | 20 TB | **€11.70** (≈$12.7) |
| **CX31** | 2 | 16 GB | 80 GB | 20 TB | **€17.70** (≈$19.2) |
| **CX32** | 2 | 16 GB | 160 GB | 20 TB | **€22.20** (≈$24.1) |
| **CX41** | 4 | 16 GB | 160 GB | 20 TB | **€30.90** (≈$33.5) |
| **CX42** | 4 | 16 GB | 320 GB | 20 TB | **€39.90** (≈$43.2) |

**التوصية لكل مستخدم:**
- **Starter:** CX21 (2 vCPU, 8 GB RAM) - €9.70/شهر
- **Pro:** CX31 (2 vCPU, 16 GB RAM) - €17.70/شهر

**مقارنة مع LightNode:**
- **Hetzner CX21:** €9.70 (≈$10.5)
- **LightNode (مُحسّن):** $12-15
- **التوفير:** 20-30%! 💰

---

### 3. API Endpoints الرئيسية

#### Base URL:
```
https://api.hetzner.cloud/v1
```

#### Create Server:
```bash
curl -X POST https://api.hetzner.cloud/v1/servers \
  -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user-123-server",
    "server_type": "cx21",
    "image": "ubuntu-22.04",
    "location": "fsn1",
    "ssh_keys": [123],
    "user_data": "#cloud-config\nruncmd:\n  - curl -sSL https://get.clawdbot.sh | bash"
  }'
```

#### Delete Server:
```bash
curl -X DELETE https://api.hetzner.cloud/v1/servers/{SERVER_ID} \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"
```

#### List Servers:
```bash
curl -X GET https://api.hetzner.cloud/v1/servers \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"
```

#### Get Server Status:
```bash
curl -X GET https://api.hetzner.cloud/v1/servers/{SERVER_ID} \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"
```

#### Stop/Start Server:
```bash
# Stop
curl -X POST https://api.hetzner.cloud/v1/servers/{SERVER_ID}/actions/poweroff \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"

# Start
curl -X POST https://api.hetzner.cloud/v1/servers/{SERVER_ID}/actions/poweron \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"
```

---

### 4. Integration مع Node.js Backend

#### إنشاء Server:
```javascript
import axios from 'axios';

const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
const HETZNER_API_URL = 'https://api.hetzner.cloud/v1';

export async function createServerForUser(userId, plan) {
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
          - curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
          - apt-get install -y nodejs
      `
    },
    {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.server;
}
```

#### حذف Server:
```javascript
export async function deleteServer(serverId) {
  const response = await axios.delete(
    `${HETZNER_API_URL}/servers/${serverId}`,
    {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`
      }
    }
  );

  return response.data;
}
```

#### مراقبة حالة Server:
```javascript
export async function getServerStatus(serverId) {
  const response = await axios.get(
    `${HETZNER_API_URL}/servers/${serverId}`,
    {
      headers: {
        'Authorization': `Bearer ${HETZNER_API_TOKEN}`
      }
    }
  );

  return response.data.server.status;
}
```

---

### 5. Automated Server Management

#### Cron Job لمراقبة انتهاء الاشتراكات:
```javascript
import cron from 'node-cron';
import { prisma } from './db';
import { createServerForUser } from './hetzner';
import { deleteServer } from './hetzner';
import { backupUserData } from './backup';

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking subscription expirations...');

  // Get users whose subscription expires in 7 days
  const expiringUsers = await prisma.user.findMany({
    where: {
      subscriptionExpiresAt: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      status: 'active'
    }
  });

  for (const user of expiringUsers) {
    const daysUntilExpiry = Math.ceil(
      (user.subscriptionExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry === 7) {
      // Send 7-day warning
      await sendEmail(user.email, 'Subscription expiring in 7 days');
    } else if (daysUntilExpiry === 3) {
      // Create backup
      await backupUserData(user.id, user.serverId);
      await sendEmail(user.email, 'Subscription expiring in 3 days');
    } else if (daysUntilExpiry === 1) {
      // Create final backup
      await backupUserData(user.id, user.serverId);
      await sendEmail(user.email, 'Subscription expiring tomorrow');
    } else if (daysUntilExpiry <= 0) {
      // Delete server
      if (user.serverId) {
        await deleteServer(user.serverId);
      }

      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'suspended',
          serverId: null
        }
      });

      await sendEmail(user.email, 'Your subscription has expired');
    }
  }

  console.log('Expiration check completed');
});
```

---

### 6. Automated Server Creation للاشتراكات الجديدة:
```javascript
import { prisma } from './db';
import { createServerForUser } from './hetzner';
import { configureClawdbot } from './clawdbot';

// Handle new subscription
export async function handleNewSubscription(userId, plan) {
  // 1. Update user in database
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStartedAt: new Date(),
      subscriptionExpiresAt: getExpiryDate(plan),
      status: 'provisioning'
    }
  });

  try {
    // 2. Create server via Hetzner API
    const server = await createServerForUser(userId, plan);

    // 3. Save server info
    await prisma.user.update({
      where: { id: userId },
      data: {
        serverId: server.id,
        serverIp: server.public_net.ipv4.ip,
        serverStatus: 'running'
      }
    });

    // 4. Wait for server to be ready
    await waitForServerReady(server.id);

    // 5. SSH into server and configure Clawdbot
    await configureClawdbot(server.public_net.ipv4.ip, userId);

    // 6. Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'active' }
    });

    // 7. Send welcome email
    await sendEmail(
      user.email,
      'Your server is ready!',
      `
        Your AI Platform server is ready!

        Server IP: ${server.public_net.ipv4.ip}
        Plan: ${plan}

        Login to access your workspace.
      `
    );

    return true;
  } catch (error) {
    // Rollback: Delete server if something goes wrong
    if (server.id) {
      await deleteServer(server.id);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'error' }
    });

    console.error('Failed to provision server:', error);
    return false;
  }
}
```

---

### 7. Cost Optimization

#### Auto-Stop/Start للمستخدمين غير النشطين:
```javascript
// Stop servers that haven't been used in 24 hours
cron.schedule('0 */6 * * *', async () => {
  const inactiveUsers = await prisma.user.findMany({
    where: {
      status: 'active',
      lastActiveAt: {
        lte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      },
      serverId: { not: null }
    }
  });

  for (const user of inactiveUsers) {
    await axios.post(
      `${HETZNER_API_URL}/servers/${user.serverId}/actions/poweroff`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`
        }
      }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { serverStatus: 'stopped' }
    });

    console.log(`Stopped server for inactive user: ${user.id}`);
  }
});

// Auto-start when user logs in
export async function handleUserLogin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (user.serverStatus === 'stopped' && user.serverId) {
    await axios.post(
      `${HETZNER_API_URL}/servers/${user.serverId}/actions/poweron`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`
        }
      }
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        serverStatus: 'running',
        lastActiveAt: new Date()
      }
    });
  }
}
```

---

### 8. Locations المتاحة (أهمها للشرق الأوسط):

| Location | Code | Latency to Saudi Arabia |
|----------|------|------------------------|
| **Frankfurt** | fsn1 | ~40-50ms ✅ (الأفضل) |
| **Nuremberg** | nbg1 | ~45-55ms |
| **Helsinki** | hel1 | ~60-70ms |
| **London** | lon1 | ~70-80ms |

**التوصية:** **Frankfurt (fsn1)** - الأفضل لليمن والشرق الأوسط!

---

## 💰 التحليل المالي (باستخدام Hetzner)

### التكاليف الشهرية:

| البند | Starter (CX21) | Pro (CX31) |
|-------|----------------|-------------|
| **VPS Cost** | €9.70 (≈$10.5) | €17.70 (≈$19.2) |
| **Backup Storage** | €0.50-1 | €1-2 |
| **API Usage** | €0.10 | €0.20 |
| **Total/User** | **€10.30-11.20 ($11.2-12.2)** | **€18.80-20.90 ($20.4-22.7)** |

### مقارنة مع أسعار البيع:

| Plan | البيع | التكلفة (Hetzner) | الربح | هامش الربح |
|------|-------|------------------|--------|-------------|
| **Starter** | $19 | $11.2-12.2 | **$6.8-7.8** | **36-41%** ✅ |
| **Pro** | $49 | $20.4-22.7 | **$26.3-28.6** | **54-58%** ✅ |

**هامش الربح ممتاز!**

---

## ✅ Action Items

### فوراً:
1. ✅ **إنشاء حساب Hetzner:** https://console.hetzner.cloud/
2. ✅ **الحصول على API Token:** Security → API Tokens
3. ✅ **اختبار API:**
   ```bash
   curl -X GET https://api.hetzner.cloud/v1/servers \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
4. ✅ **إنشاء SSH Key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   ثم أضفه إلى Hetzner Console

### في التطوير:
1. ⏳ **تطوير Hetzner API wrapper**
2. ⏳ **دمج automated backup system**
3. ⏳ **تطوير subscription management**
4. ⏳ **تطوير auto-stop/start optimization**

---

## 🎯 الخلاصة

### Hetzner هو الأفضل للمشروع! ✅

**لماذا؟**
- API ممتاز وسهل الاستخدام
- Pricing أفضل من LightNode بـ 20-30%
- سرعة عالية للشرق الأوسط (Frankfurt ~40-50ms)
- توثيقات شاملة
- موثوقية عالية

**التكاليف:**
- Starter: $11.2-12.2/مستخدم/شهر
- Pro: $20.4-22.7/مستخدم/شهر

**هامش الربح:**
- Starter: 36-41%
- Pro: 54-58%

**القرار:** استخدم Hetzner! 🚀

---

*تم إنشاؤه بواسطة صالح 🚀*

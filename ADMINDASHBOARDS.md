# لوحات التحكم - Admin & Support Dashboards

## 🎯 ما هي لوحات التحكم؟

### 1. لوحة تحكم المالك (Admin Dashboard)
- للمالك فقط
- إدارة كاملة للمنصة
- إضافة وتعديل باقات الاشتراكات
- مراقبة الأرباح والإحصائيات
- إدارة المستخدمين
- إعداد النظام

### 2. لوحة تحكم الدعم الفني (Support Dashboard)
- لفريق الدعم الفني
- تذاكر المستخدمين (Tickets)
- رصد مشاكل السيرفرات
- التواصل مع المستخدمين
- حل المشاكل

---

## 1️⃣ لوحة تحكم المالك (Admin Dashboard)

### الصفحات الرئيسية:

#### 📊 Dashboard الرئيسي
**المعلومات المعروضة:**
- إحصائيات عامة:
  - عدد المستخدمين الإجمالي
  - المستخدمون النشطون (DAU/MAU)
  - الإيرادات الشهرية (MRR)
  - الإيرادات السنوية (ARR)
  - معدل الاحتفاظ (Retention Rate)
  - معدل التحويل (Conversion Rate)
- المخططات:
  - الإيرادات (آخر 6 أشهر)
  - نمو المستخدمين (آخر 6 أشهر)
  - الاشتراكات الجديدة vs الملغاة
  - توزيع الـ Plans
- السيرفرات:
  - عدد السيرفرات النشطة
  - عدد السيرفرات المتوقفة
  - التكلفة الشهرية للسيرفرات
  - Hetzner usage (CPU, RAM, Disk)
- التنبيهات:
  - سيرفرات متوقفة > 24 ساعة
  - مستخدمون بلم يتم تسجيلهم > 7 أيام
  - نسخ احتياطية فاشلة
  - فواتير غير مدفوعة

**الكود (Frontend):**
```typescript
// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  Server,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    mrr: 0,
    arr: 0,
    retentionRate: 0,
    conversionRate: 0,
    activeServers: 0,
    stoppedServers: 0,
    serverCost: 0
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, []);

  const fetchStats = async () => {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();
    setStats(data);
  };

  const fetchAlerts = async () => {
    const response = await fetch('/api/admin/alerts');
    const data = await response.json();
    setAlerts(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Total Users"
          value={stats.totalUsers}
          trend="+12%"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Monthly Revenue"
          value={`$${stats.mrr.toLocaleString()}`}
          trend="+18%"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="Retention Rate"
          value={`${stats.retentionRate}%`}
          trend="+5%"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          trend="+2%"
        />
      </div>

      {/* Server Stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Server Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.activeServers}</p>
              <p className="text-sm text-gray-500">Active Servers</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Server className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.stoppedServers}</p>
              <p className="text-sm text-gray-500">Stopped Servers</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">${stats.serverCost.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Monthly Server Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-yellow-500" />
            Alerts
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded p-4 shadow-sm">
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm text-gray-500">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

#### 💰 إدارة الاشتراكات (Subscription Plans)
**الوظائف:**
- عرض جميع الاشتراكات الحالية
- إضافة اشتراك جديد
- تعديل اشتراك موجود
- حذف اشتراك
- تفعيل/تعطيل اشتراك

**الحقول الممكنة:**
```
- Plan Name: (مثال: Starter, Pro, Enterprise)
- Plan Type: (free, monthly, yearly)
- Price: ($/month)
- Hetzner Server Type: (cx21, cx31, cx41, etc.)
- CPU Cores: (1, 2, 4, etc.)
- RAM: (4GB, 8GB, 16GB, etc.)
- Storage: (40GB, 80GB, 160GB, etc.)
- Bandwidth: (20TB, 40TB, etc.)
- Max Usage Hours: (10, 50, 200, unlimited)
- Max Projects: (1, 5, 10, unlimited)
- Backup Retention: (7 days, 30 days, 90 days, unlimited)
- Features: (list of features)
- Status: (active, inactive)
- Stripe Price ID: (for payment)
```

**الكود (Frontend):**
```typescript
// app/admin/subscriptions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Server,
  Check,
  X
} from 'lucide-react';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const response = await fetch('/api/admin/subscriptions');
    const data = await response.json();
    setPlans(data);
  };

  const createPlan = async (planData) => {
    const response = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    await fetchPlans();
    setShowCreateModal(false);
  };

  const updatePlan = async (planId, planData) => {
    const response = await fetch(`/api/admin/subscriptions/${planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    await fetchPlans();
    setEditingPlan(null);
  };

  const deletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    await fetch(`/api/admin/subscriptions/${planId}`, {
      method: 'DELETE'
    });
    await fetchPlans();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
          <span>Add Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={() => setEditingPlan(plan)}
            onDelete={() => deletePlan(plan.id)}
          />
        ))}
      </div>

      {showCreateModal && (
        <PlanModal
          mode="create"
          onSubmit={createPlan}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingPlan && (
        <PlanModal
          mode="edit"
          plan={editingPlan}
          onSubmit={(data) => updatePlan(editingPlan.id, data)}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${plan.price}
            <span className="text-sm text-gray-500">/month</span>
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${
          plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {plan.status}
        </span>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center text-sm">
          <Server className="w-4 h-4 mr-2" />
          <span>
            {plan.serverSpecs.cpu} CPU, {plan.serverSpecs.ram} RAM
          </span>
        </div>
        <div className="flex items-center text-sm">
          <DollarSign className="w-4 h-4 mr-2" />
          <span>Max {plan.maxUsageHours} hours/month</span>
        </div>
      </div>

      <div className="space-y-1 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center text-sm">
            <Check className="w-4 h-4 mr-2 text-green-500" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
```

**الكود (Backend API):**
```typescript
// routes/admin/subscriptions.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Get all plans
  fastify.get('/api/admin/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return plans;
  });

  // Create plan
  fastify.post('/api/admin/subscriptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as any;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        price: data.price,
        serverType: data.serverType,
        serverSpecs: {
          cpu: data.cpu,
          ram: data.ram,
          storage: data.storage,
          bandwidth: data.bandwidth
        },
        maxUsageHours: data.maxUsageHours,
        maxProjects: data.maxProjects,
        backupRetentionDays: data.backupRetentionDays,
        features: data.features,
        status: data.status || 'active',
        stripePriceId: data.stripePriceId
      }
    });

    return plan;
  });

  // Update plan
  fastify.put('/api/admin/subscriptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        price: data.price,
        serverType: data.serverType,
        serverSpecs: {
          cpu: data.cpu,
          ram: data.ram,
          storage: data.storage,
          bandwidth: data.bandwidth
        },
        maxUsageHours: data.maxUsageHours,
        maxProjects: data.maxProjects,
        backupRetentionDays: data.backupRetentionDays,
        features: data.features,
        status: data.status,
        stripePriceId: data.stripePriceId
      }
    });

    return plan;
  });

  // Delete plan
  fastify.delete('/api/admin/subscriptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check if any users are subscribed to this plan
    const users = await prisma.user.count({
      where: { plan: id }
    });

    if (users > 0) {
      return reply.status(400).send({
        error: 'Cannot delete plan with active subscribers'
      });
    }

    await prisma.subscriptionPlan.delete({
      where: { id }
    });

    return { success: true };
  });
}
```

**Database Schema:**
```prisma
model SubscriptionPlan {
  id                String   @id @default(cuid())
  name              String   // Starter, Pro, Enterprise
  price             Float    // $19, $49, $99
  planType          String   @default("monthly") // monthly, yearly
  serverType        String   // cx21, cx31, cx41

  // Server specs
  serverSpecs        Json     // { cpu: 2, ram: "8GB", storage: "80GB", bandwidth: "20TB" }

  // Limits
  maxUsageHours     Int      // 10, 50, 200, unlimited
  maxProjects       Int      // 1, 5, 10, unlimited
  backupRetentionDays Int    // 7, 30, 90, unlimited

  // Features
  features          String[] // list of features

  // Status
  status            String   @default("active") // active, inactive
  stripePriceId     String?  // Stripe price ID

  // Relations
  users             User[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

#### 👥 إدارة المستخدمين (User Management)
**الوظائف:**
- عرض قائمة المستخدمين
- البحث والتصفية
- عرض تفاصيل المستخدم
- تعديل بيانات المستخدم
- تعليق/تفعيل حساب
- حذف المستخدم
- إرسال رسالة للمستخدم

**الكود (Frontend):**
```typescript
// app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, MoreVertical, Ban, Check, Mail, Server, Calendar } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, statusFilter, planFilter]);

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      search: searchQuery,
      status: statusFilter,
      plan: planFilter
    });
    const response = await fetch(`/api/admin/users?${params}`);
    const data = await response.json();
    setUsers(data);
  };

  const suspendUser = async (userId) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    await fetch(`/api/admin/users/${userId}/suspend`, { method: 'POST' });
    await fetchUsers();
  };

  const activateUser = async (userId) => {
    await fetch(`/api/admin/users/${userId}/activate`, { method: 'POST' });
    await fetchUsers();
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone!')) return;
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    await fetchUsers();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <div className="flex justify-end items-center">
            <span className="text-sm text-gray-500">{users.length} users found</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{user.name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.serverId ? (
                    <div>
                      <p className="text-sm font-medium">{user.serverIp}</p>
                      <p className="text-xs text-gray-500">{user.serverStatus}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.lastActiveAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Mail className="w-4 h-4 text-gray-500" />
                    </button>
                    {user.status === 'active' && (
                      <button
                        onClick={() => suspendUser(user.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                    {(user.status === 'suspended' || user.status === 'expired') && (
                      <button
                        onClick={() => activateUser(user.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
```

---

#### 💳 إدارة الفوترة (Billing Management)
**الوظائف:**
- عرض جميع الفواتير
- تصفية الفواتير (مدفوعة/غير مدفوعة/فاشلة)
- عرض تفاصيل الفاتورة
- إعادة إرسال الفاتورة
- تعديل حالة الفاتورة
- تصدير الفواتير (CSV/PDF)

---

#### 🔧 إعداد النظام (System Settings)
**الوظائف:**
- إعداد Hetzner API Key
- إعداد Stripe API Keys
- إعداد Email Service (Resend)
- إعداد S3/MinIO للـ backups
- إعداد Cron jobs
- إدارة Admins (إضافة/حذف مستخدمي لوحة التحكم)
- Logs والمراقبة
- إعدادات الأمان

---

## 2️⃣ لوحة تحكم الدعم الفني (Support Dashboard)

### الصفحات الرئيسية:

#### 📋 تذاكر المستخدمين (Support Tickets)
**الوظائف:**
- عرض جميع التذاكر
- تصفية التذاكر (open/in-progress/closed)
- البحث في التذاكر
- عرض تفاصيل التذكرة
- الرد على التذكرة
- تغيير حالة التذكرة
- تعيين التذكرة إلى موظف
- إرسال إشعار للمستخدم

**Database Schema:**
```prisma
model SupportTicket {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])

  // Ticket info
  subject           String
  message           String
  category          String   // server, billing, account, other
  priority          String   @default("normal") // low, normal, high, urgent
  status            String   @default("open") // open, in_progress, closed

  // Assignment
  assignedTo        String?  // Admin user ID
  assignedToName    String?

  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  messages          TicketMessage[]

  @@index([userId])
  @@index([status])
  @@index([category])
}

model TicketMessage {
  id                String   @id @default(cuid())
  ticketId          String
  ticket            SupportTicket @relation(fields: [ticketId], references: [id])

  // Message info
  senderId          String   // User or Admin ID
  senderType        String   // user, admin
  message           String

  // Metadata
  createdAt         DateTime @default(now())

  @@index([ticketId])
}
```

**الكود (Frontend):**
```typescript
// app/support/tickets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Clock, AlertCircle, CheckCircle, User } from 'lucide-react';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    const params = new URLSearchParams({ status: statusFilter });
    const response = await fetch(`/api/support/tickets?${params}`);
    const data = await response.json();
    setTickets(data);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    await fetch(`/api/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    await fetchTickets();
  };

  const replyToTicket = async (ticketId, message) => {
    await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    await fetchTickets();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Support Tickets</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded ${statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-2 rounded ${statusFilter === 'open' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Open ({tickets.filter(t => t.status === 'open').length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-4 py-2 rounded ${statusFilter === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            In Progress ({tickets.filter(t => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-4 py-2 rounded ${statusFilter === 'closed' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Closed ({tickets.filter(t => t.status === 'closed').length})
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => setSelectedTicket(ticket)}
            onStatusChange={(newStatus) => updateTicketStatus(ticket.id, newStatus)}
          />
        ))}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onReply={(message) => replyToTicket(selectedTicket.id, message)}
        />
      )}
    </div>
  );
}

function TicketCard({ ticket, onClick, onStatusChange }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'closed': return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(ticket.status)}
          <div>
            <h3 className="font-semibold text-lg">{ticket.subject}</h3>
            <p className="text-sm text-gray-500">from {ticket.user.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {ticket.priority}
        </span>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">{ticket.message}</p>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString()}
        </span>
        <select
          value={ticket.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
  );
}
```

---

#### 🖥️ مراقبة السيرفرات (Server Monitoring)
**الوظائف:**
- عرض جميع السيرفرات
- حالة كل سيرفر (running/stopped/error)
- إحصائيات السيرفر (CPU, RAM, Disk)
- سجل الأحداث (Event logs)
- إعادة تشغيل السيرفر
- فتح SSH connection
- عرض logs السيرفر

---

#### 📊 تحليل الأداء (Performance Analytics)
**الوظائف:**
- معدل استجابة السيرفرات
- معدل استجابة API
- معدل نجاح الـ backups
- معدل فشل الدفعات
- نمو المستخدمين
- إحصائيات الدعم (متوسط وقت الرد، إغلاق التذاكر)

---

## 🔐 الأمان والصلاحيات

### صلاحيات المالك (Admin):
- ✅ جميع الصلاحيات
- ✅ إدارة الاشتراكات
- ✅ إدارة المستخدمين
- ✅ إدارة الدعم
- ✅ إعداد النظام
- ✅ الوصول إلى Logs والبيانات

### صلاحيات الدعم (Support):
- ✅ عرض وإدارة التذاكر
- ✅ التواصل مع المستخدمين
- ✅ مراقبة السيرفرات
- ✅ عرض الإحصائيات
- ❌ إدارة الاشتراكات
- ❌ إعداد النظام
- ❌ الوصول إلى البيانات المالية

---

## 📋 خطة التنفيذ

### Phase 1: Admin Dashboard الأساسي (Week 1-2)
- [ ] صفحة Dashboard الرئيسية
- [ ] إحصائيات ومخططات
- [ ] قائمة التنبيهات

### Phase 2: إدارة الاشتراكات (Week 2-3)
- [ ] عرض جميع الاشتراكات
- [ ] إضافة/تعديل/حذف الاشتراكات
- [ ] ربط مع Stripe

### Phase 3: إدارة المستخدمين (Week 3)
- [ ] قائمة المستخدمين
- [ ] البحث والتصفية
- [ ] تعليق/تفعيل المستخدمين
- [ ] عرض تفاصيل المستخدم

### Phase 4: لوحة الدعم (Week 3-4)
- [ ] نظام التذاكر
- [ ] مراقبة السيرفرات
- [ ] تحليل الأداء

### Phase 5: إعداد النظام (Week 4)
- [ ] إعداد API Keys
- [ ] إدارة Admins
- [ ] Logs والمراقبة

---

## ✅ Action Items

### فوراً:
1. ⏳ هل تريد أن أبدأ ببناء Dashboard المالك؟
2. ⏳ أم تفضل البدء بلوحة الدعم؟
3. ⏳ أم تريد إعداد قاعدة البيانات أولاً (Admin/Support tables)؟

### أنا جاهز للبدء! 🚀

---

*تم إنشاؤه بواسطة صالح 🚀*

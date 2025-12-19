# Admin Authentication - Setup Complete

## ✅ Changes Made

### 1. **Removed Test Admin Mock**
- Removed the hardcoded test admin (`test@test.com`)
- Enabled real JWT-based authentication
- Admin routes now require valid login credentials

### 2. **Authentication Flow**
The admin panel now uses proper authentication:

```
1. User visits /admin → Redirected to /admin/login (if not authenticated)
2. User logs in with email + password
3. Password verified with bcrypt
4. JWT token generated and stored in httpOnly cookie
5. User can access admin panel
```

### 3. **Created Admin User Script**
A convenient script to create admin users:

**Usage:**
```bash
npm run create-admin <email> <password> [name]
```

**Example:**
```bash
npm run create-admin admin@mobiservice-vtc.com MySecurePassword123 "Admin User"
```

---

## 🚀 How to Create Your First Admin

### Option 1: Using the Script (Recommended)

1. **Run the create-admin script:**
   ```bash
   npm run create-admin admin@mobiservice-vtc.com YourSecurePassword "Admin"
   ```

2. **You'll see:**
   ```
   ⏳ Hashing password...
   ⏳ Creating admin user...
   
   ✅ Admin user created successfully!
      Email: admin@mobiservice-vtc.com
      Name: Admin
      ID: 1
   
   🎉 You can now login at http://localhost:3000/admin/login
   ```

### Option 2: Manual Database Insert

If you prefer to do it manually:

1. **Generate password hash:**
   ```bash
   node -e "import('bcryptjs').then(b => b.hash('YourPassword', 10).then(console.log))"
   ```

2. **Insert into database:**
   ```sql
   INSERT INTO admin_users (email, password_hash, name, created_at, updated_at)
   VALUES (
     'admin@mobiservice-vtc.com',
     'YOUR_HASHED_PASSWORD_HERE',
     'Admin',
     NOW(),
     NOW()
   );
   ```

---

## 🔐 Login Process

1. **Navigate to:** `http://localhost:3000/admin/login`

2. **Enter credentials:**
   - Email: `admin@mobiservice-vtc.com`
   - Password: `YourSecurePassword`

3. **After successful login:**
   - JWT token stored in httpOnly cookie (7 days expiry)
   - Redirected to `/admin` dashboard
   - Full access to admin panel

---

## 🛡️ Security Features

✅ **Password Hashing:** bcryptjs with 10 salt rounds  
✅ **JWT Tokens:** Secure session management  
✅ **HttpOnly Cookies:** Protected from XSS attacks  
✅ **Route Protection:** Middleware checks authentication  
✅ **Auto Redirect:** Unauthenticated users sent to login  

---

## 📋 Admin Panel Routes

Once logged in, you have access to:

- **Dashboard:** `/admin` - Overview and stats
- **Bookings:** `/admin/bookings` - Manage all bookings
- **Booking Details:** `/admin/bookings/[id]` - View/edit specific booking
- **Working Hours:** `/admin/settings/working-hours` - Configure schedule
- **Logout:** Logout button in sidebar

---

## 🔧 Environment Variables

Make sure these are set in `.env.local`:

```env
# JWT Secret (32+ characters)
JWT_SECRET=your-secret-key-min-32-chars-long-replace-this

# Database
DATABASE_URL=postgresql://...

# Email (for OTP/notifications)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## 🐛 Troubleshooting

**Can't login?**
- Check password is correct
- Verify JWT_SECRET is set in `.env.local`
- Check browser cookies are enabled
- Look at server console logs for errors

**"No admin found" error?**
- Run the create-admin script
- Verify admin exists in database: `SELECT * FROM admin_users;`

**Script fails?**
- Make sure database is running
- Check DATABASE_URL is correct
- Ensure `npm run db:push` was run to create tables

---

## 📝 Next Steps

1. ✅ Create your admin user
2. ✅ Login at `/admin/login`
3. ✅ Test the admin panel
4. ✅ Configure working hours
5. ✅ Start managing bookings!

---

**Need to create another admin?** Just run the script again with different credentials:
```bash
npm run create-admin another@email.com AnotherPassword "Another Admin"
```

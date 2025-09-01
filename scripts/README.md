# Scripts Directory

This directory contains utility scripts for the IB4ME medical crowdfunding platform.

## Available Scripts

### `create-superadmin.js`

Creates a SuperAdmin user for initial system setup and development purposes.

#### Usage

```bash
npm run create-superadmin
```

#### What it does

- Creates a SuperAdmin user with the email `superadmin@example.com`
- Sets the password to `password` (hashed with bcrypt)
- Assigns SuperAdmin role and active status
- Marks the email as verified
- Handles duplicate user checking gracefully

#### Default SuperAdmin Credentials

- **Email**: `superadmin@example.com`
- **Password**: `password`
- **Role**: `SuperAdmin`
- **Status**: `active`

#### Features

- ✅ **Duplicate Detection**: Checks if user already exists before creation
- ✅ **Secure Password Hashing**: Uses bcrypt with 10 salt rounds
- ✅ **Clear Output**: Provides detailed success/error messages
- ✅ **Database Connection Management**: Automatically connects and disconnects
- ✅ **Error Handling**: Graceful handling of database and validation errors

#### Prerequisites

- MongoDB connection configured in environment variables
- Required environment variables:
  - `MONGODB_URI` or `MONGO_URI`
  - Other standard Next.js/MongoDB environment variables

#### Example Output

**Successful Creation:**
```
🚀 Starting SuperAdmin creation...
📊 Connecting to MongoDB...
✅ Connected to MongoDB successfully
🔍 Checking if user with email 'superadmin@example.com' already exists...
🔐 Hashing password...
✅ Password hashed successfully
👤 Creating SuperAdmin user...
🎉 SuperAdmin user created successfully!

📋 User Details:
   ID: 507f1f77bcf86cd799439011
   Name: Super Admin
   Email: superadmin@example.com
   Role: SuperAdmin
   Status: active
   Email Verified: Yes
   Created: 2025-01-30T10:30:00.000Z

🔑 Login Credentials:
   Email: superadmin@example.com
   Password: password

🌐 You can now login at: http://localhost:3000/admin/login
🔌 Closing database connection...
✅ Database connection closed
✨ Script completed successfully!
```

**User Already Exists:**
```
🚀 Starting SuperAdmin creation...
📊 Connecting to MongoDB...
✅ Connected to MongoDB successfully
🔍 Checking if user with email 'superadmin@example.com' already exists...
⚠️  SuperAdmin user already exists!
   Email: superadmin@example.com
   Name: Super Admin
   Role: SuperAdmin
   Status: active
   Created: 2025-01-29T15:20:00.000Z
✅ Existing user already has SuperAdmin role. No action needed.
```

#### Security Considerations

- **Development Use Only**: This script is intended for development and initial setup
- **Change Default Password**: In production environments, change the default password immediately after first login
- **Environment Variables**: Ensure proper environment configuration for database access
- **Access Control**: The SuperAdmin role has full system access - use responsibly

#### Troubleshooting

**Database Connection Issues:**
- Verify `MONGODB_URI` or `MONGO_URI` environment variables are set
- Ensure MongoDB server is running and accessible
- Check network connectivity and firewall settings

**Permission Issues:**
- Ensure the script has read/write permissions
- Verify MongoDB user has appropriate database permissions

**Module Loading Issues:**
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility

#### Manual Cleanup

If you need to remove the created SuperAdmin user:

```javascript
// Connect to MongoDB and run:
db.users.deleteOne({ email: "superadmin@example.com" });
```

Or use a MongoDB GUI tool like MongoDB Compass to manually delete the user.

## Adding New Scripts

When adding new scripts to this directory:

1. Create the script file with a descriptive name
2. Make it executable: `chmod +x script-name.js`
3. Add a corresponding npm script in `package.json`
4. Document the script usage in this README
5. Include proper error handling and logging
6. Follow the existing code style and patterns
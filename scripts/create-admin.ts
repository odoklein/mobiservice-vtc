/**
 * Script to create an admin user
 * Usage: npm run create-admin <email> <password> [name]
 */

import { hashPassword } from '../lib/auth/admin';
import { db } from '../lib/db';
import { adminUsers } from '../lib/db/schema';

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin';

    if (!email || !password) {
        console.error('\n❌ Usage: npx tsx scripts/create-admin.ts <email> <password> [name]\n');
        console.error('Example: npx tsx scripts/create-admin.ts admin@mobiservice-vtc.com MySecurePass123 "Admin User"\n');
        process.exit(1);
    }

    try {
        console.log('\n⏳ Hashing password...');
        const passwordHash = await hashPassword(password);

        console.log('⏳ Creating admin user...');
        const [admin] = await db.insert(adminUsers).values({
            email,
            name,
            passwordHash,
        }).returning();

        console.log('\n✅ Admin user created successfully!');
        console.log(`   Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   ID: ${admin.id}`);
        console.log('\n🎉 You can now login at http://localhost:3000/admin/login\n');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Error creating admin:', error.message);
        if (error.message.includes('unique')) {
            console.error('   This email already exists in the database.');
        }
        process.exit(1);
    }
}

createAdmin();

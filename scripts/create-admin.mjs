/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.mjs
 */

import { hashPassword } from '../lib/auth/admin.ts';
import { db } from '../lib/db/index.ts';
import { adminUsers } from '../lib/db/schema.ts';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
    console.log('\n🔐 Create Admin User\n');

    const email = await question('Email: ');
    const name = await question('Name: ');
    const password = await question('Password: ');

    if (!email || !name || !password) {
        console.error('❌ All fields are required');
        rl.close();
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
        console.log('\n🎉 You can now login at /admin/login\n');
    } catch (error) {
        console.error('\n❌ Error creating admin:', error.message);
        if (error.message.includes('unique')) {
            console.error('   This email already exists in the database.');
        }
    } finally {
        rl.close();
        process.exit(0);
    }
}

createAdmin();

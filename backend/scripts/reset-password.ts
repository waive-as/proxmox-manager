#!/usr/bin/env tsx
/**
 * Emergency Password Reset CLI Tool
 * Usage: npm run reset-password <email> [newPassword]
 * If password is not provided, a random one will be generated
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each required character type
  password += 'A'; // uppercase
  password += 'a'; // lowercase
  password += '1'; // number
  password += '!'; // special

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function resetPassword(email: string, newPassword?: string) {
  try {
    console.log('🔧 Proxmox Manager - Emergency Password Reset');
    console.log('============================================\n');

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found`);
      process.exit(1);
    }

    // Generate or use provided password
    const password = newPassword || generateSecurePassword();

    // Validate password length
    if (password.length < 12) {
      console.error('❌ Error: Password must be at least 12 characters');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        requirePasswordChange: true
      }
    });

    console.log('✅ Password reset successful!\n');
    console.log('User Details:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`\n🔐 New Password: ${password}`);
    console.log('\n⚠️  IMPORTANT:');
    console.log('  - Save this password securely');
    console.log('  - User will be required to change password on next login');
    console.log('  - This password will not be shown again\n');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Proxmox Manager - Emergency Password Reset CLI');
  console.log('\nUsage:');
  console.log('  npm run reset-password <email> [newPassword]');
  console.log('\nExamples:');
  console.log('  npm run reset-password admin@example.com');
  console.log('  npm run reset-password admin@example.com MyNewPassword123!');
  console.log('\nNotes:');
  console.log('  - If password is not provided, a secure random password will be generated');
  console.log('  - Password must be at least 12 characters');
  console.log('  - User will be required to change password on next login');
  process.exit(0);
}

const email = args[0];
const newPassword = args[1];

resetPassword(email, newPassword);

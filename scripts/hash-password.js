#!/usr/bin/env node

/**
 * Interactive Local Password Hash Generator
 * Uses Node.js crypto.scrypt with a cryptographically secure random salt.
 * 
 * Usage:
 *   npm run hash-password
 *   OR
 *   node scripts/hash-password.js
 */

const crypto = require('crypto');
const readline = require('readline');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('========================================================');
console.log('       SECURE SCRYPT PASSWORD HASH GENERATOR           ');
console.log('========================================================\n');
console.log('This script generates a salted hash for your Vercel env.');
console.log('Your plaintext password will NEVER be saved or printed.\n');

rl.question('Enter the password you want to hash: ', async (password) => {
  rl.close();

  if (!password || password.trim().length === 0) {
    console.error('\nError: Password cannot be empty.');
    process.exit(1);
  }

  try {
    const hash = await hashPassword(password);
    console.log('\n--------------------------------------------------------');
    console.log('✅ Generated Salted Hash:');
    console.log(hash);
    console.log('--------------------------------------------------------\n');
    console.log('HOW TO USE IN VERCEL:');
    console.log('1. For Public Birthday Site:');
    console.log('   In Vercel Project Settings > Environment Variables:');
    console.log('   Key:   VISITOR_PASSWORD_HASH');
    console.log('   Value: ' + hash);
    console.log('\n2. For Owner No-Code Editor:');
    console.log('   Run this script again with a DIFFERENT password, then set:');
    console.log('   Key:   EDITOR_PASSWORD_HASH');
    console.log('   Value: <the second hash>');
    console.log('\nCRITICAL: Always use different passwords for Visitor and Editor.\n');
  } catch (err) {
    console.error('Failed to generate hash:', err);
    process.exit(1);
  }
});

#!/usr/bin/env node
// Rotate the TestFlight gate: node tools/encrypt-gate.mjs <access-code> <url>
// Paste the output constants into gate.js. Codes are matched lowercase/trimmed.

const [code, url] = process.argv.slice(2);
if (!code || !url) {
    console.error('Usage: node tools/encrypt-gate.mjs <access-code> <url>');
    process.exit(1);
}

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(code.trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(url)));

const b64 = (u8) => Buffer.from(u8).toString('base64');
console.log(`const SALT = '${b64(salt)}';`);
console.log(`const IV = '${b64(iv)}';`);
console.log(`const CIPHERTEXT = '${b64(ct)}';`);

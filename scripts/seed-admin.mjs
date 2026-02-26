/**
 * Seed script — creates an interviewer (admin) user in Firebase
 * Run: node scripts/seed-admin.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local manually (no extra deps needed) ──────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, "$1");
    process.env[key] = val;
  }
} catch {
  console.error("Could not read .env.local — make sure it exists.");
  process.exit(1);
}

// ── Seed user config ──────────────────────────────────────────────────────────
const SEED_USER = {
  name: "Admin Interviewer",
  email: "admin@votreprep.com",
  password: "Admin@1234",
};

// ── Firebase Admin init ───────────────────────────────────────────────────────
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding admin user: ${SEED_USER.email}\n`);

  let uid;

  // 1. Create Firebase Auth user (or reuse existing)
  try {
    const existing = await auth.getUserByEmail(SEED_USER.email);
    uid = existing.uid;
    console.log(`✓ Auth user already exists  uid=${uid}`);
  } catch {
    const created = await auth.createUser({
      email: SEED_USER.email,
      password: SEED_USER.password,
      displayName: SEED_USER.name,
    });
    uid = created.uid;
    console.log(`✓ Auth user created         uid=${uid}`);
  }

  // 2. Create / update Firestore user document
  const userRef = db.collection("users").doc(uid);
  await userRef.set(
    { name: SEED_USER.name, email: SEED_USER.email, role: "admin" },
    { merge: true }
  );
  console.log(`✓ Firestore doc upserted    users/${uid}`);

  console.log(`
┌─────────────────────────────────────────┐
│  Admin user ready                       │
│  Email   : ${SEED_USER.email.padEnd(29)} │
│  Password: ${SEED_USER.password.padEnd(29)} │
└─────────────────────────────────────────┘
`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

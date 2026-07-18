#!/usr/bin/env node
// Build helper — handle Prisma migration for both new and existing databases
const { execSync } = require("child_process");

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

// Step 1: Generate Prisma Client
run("npx prisma generate");

// Step 2: Try migrate deploy (for databases with migration history)
const migrated = run("npx prisma migrate deploy");

// Step 3: If migrate fails (P3005 = existing schema, no migrations), use db push
if (!migrated) {
  console.log("\n⚠️  No migration history found. Running prisma db push to sync schema...");
  run("npx prisma db push");
}

// Step 4: Lint
run("npx eslint .");

// Step 5: Build Next.js
const built = run("npx next build");
if (!built) process.exit(1);

const { neon } = require('@neondatabase/serverless');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
const match = envContent.match(/DATABASE_URL=(.+)/);
const dbUrl = match[1].trim();
const sql = neon(dbUrl);

async function main() {
  // Find the Better Auth user
  const users = await sql`SELECT id, name, email FROM "user" WHERE email = ${'juancruz311567@gmail.com'}`;
  if (users.length === 0) {
    console.log('User not found in better-auth user table. Checking workshops...');
    const workshops = await sql`SELECT id, name, email FROM workshops WHERE email = ${'juancruz311567@gmail.com'}`;
    if (workshops.length > 0) {
      console.log('Workshop already exists ID:', workshops[0].id);
    } else {
      console.log('No workshop or user found for that email.');
    }
    return;
  }

  const user = users[0];
  console.log('Found user:', user.name, user.email, 'ID:', user.id);

  // Check if workshop already exists
  const existingWorkshops = await sql`SELECT id FROM workshops WHERE email = ${'juancruz311567@gmail.com'}`;
  if (existingWorkshops.length > 0) {
    console.log('Workshop already exists with ID:', existingWorkshops[0].id);
    return;
  }

  // Create workshop (no phone known — use placeholder)
  await sql`INSERT INTO workshops (name, email, password_hash, phone) VALUES (${'Jpotenciados'}, ${'juancruz311567@gmail.com'}, ${''}, ${'5491112345678'})`;
  console.log('Workshop created for Jpotenciados!');
}

main().catch(e => console.error('Error:', e.message));

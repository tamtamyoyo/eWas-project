// Test Supabase PostgreSQL connection
import pg from 'pg';
const { Client } = pg;

// We'll use environment variables for security
const supabaseHost = process.env.SUPABASE_HOST || 'db.ymhkgyfgpddifplpsnyt.supabase.co';
const supabaseUser = process.env.SUPABASE_USER || 'postgres';
const supabasePassword = process.env.SUPABASE_PASSWORD;
const supabaseDatabase = process.env.SUPABASE_DATABASE || 'postgres';
const supabasePort = process.env.SUPABASE_PORT || 5432;

// Build connection string
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${supabaseUser}:${supabasePassword}@${supabaseHost}:${supabasePort}/${supabaseDatabase}?sslmode=require`;

console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':***@'));

async function testSupabaseConnection() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // For testing only
    }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database successfully!');
    
    // Try a simple query
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    // List tables
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:');
    tableResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    await client.end();
    console.log('Disconnected from database');
    return true;
  } catch (err) {
    console.error('Error connecting to Supabase PostgreSQL database:', err);
    return false;
  }
}

// Run the test
testSupabaseConnection(); 
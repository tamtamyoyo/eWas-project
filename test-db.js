// Simple script to test database connection
import pg from 'pg';
const { Client } = pg;

// Log the connection string (with password masked)
const connectionString = process.env.DATABASE_URL || '';
console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':***@'));

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // For testing only, don't use in production
    }
  });

  try {
    await client.connect();
    console.log('Connected to the database successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    await client.end();
    console.log('Disconnected from the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

testConnection(); 
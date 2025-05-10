// Test Supabase connection using Supabase.js client
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and API key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://ymhkgyfgpddifplpsnyt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY; // You need to provide this

console.log(`Testing connection to Supabase at ${supabaseUrl}`);

async function testSupabaseClient() {
  if (!supabaseKey) {
    console.error('Error: SUPABASE_ANON_KEY environment variable is not set');
    console.error('Please set it to your Supabase project anon key');
    return false;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');

    // Try to fetch some data to test the connection
    console.log('Testing query to Supabase...');
    const { data, error } = await supabase
      .from('profiles')  // Assuming 'profiles' table exists
      .select('*')
      .limit(5);

    if (error) {
      throw error;
    }

    console.log('Query successful!');
    console.log(`Fetched ${data?.length || 0} rows from 'profiles' table`);
    
    // Try to fetch RLS policies (requires auth)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.warn('Warning: Could not fetch tables:', tablesError.message);
    } else {
      console.log('Tables in database:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }

    return true;
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
    return false;
  }
}

// Run the test
testSupabaseClient(); 
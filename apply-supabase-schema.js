import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase connection details
const SUPABASE_URL = 'https://ymhkgyfgpddiflpsnyt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaGtneWZncGRkaWZscHNueXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNTM1ODY5NywiZXhwIjoyMDMwOTM0Njk3fQ.Iqb37FpIOQ9DqfDXdKqrK1A1QvDBrNcuMi5h3jK-mBM';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applySqlSchema() {
  try {
    // Read the SQL schema file
    const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    // Split the content into separate SQL statements
    const statements = schemaContent.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Execute each statement sequentially
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      console.log(`SQL: ${statement.substring(0, 100)}...`);

      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully.`);
      }
    }

    console.log('Schema migration completed successfully.');
  } catch (error) {
    console.error('Failed to apply SQL schema:', error);
  }
}

// Run the migration
applySqlSchema(); 
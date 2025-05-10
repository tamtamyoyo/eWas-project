// Script to generate SQL for Supabase schema based on drizzle schema
import fs from 'fs';
import path from 'path';

// Read schema file content
const schemaFilePath = path.join(process.cwd(), 'shared', 'schema.ts');
const schemaContent = fs.readFileSync(schemaFilePath, 'utf8');

// Function to extract table definitions from the schema content
function extractTableDefinitions(content) {
  const tables = {};
  
  // Find all pgTable definitions
  const tableRegex = /export const (\w+) = pgTable\("(\w+)",\s*\{([^}]+)\}\);/gs;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const variableName = match[1];
    const tableName = match[2];
    const columnsContent = match[3];
    
    tables[variableName] = {
      name: tableName,
      columns: parseColumns(columnsContent)
    };
  }
  
  return tables;
}

// Parse columns from a table definition
function parseColumns(columnsContent) {
  const columns = {};
  const columnRegex = /(\w+):\s*(\w+)\("([^"]+)"\)(\.[^,]+)?,/g;
  let match;
  
  while ((match = columnRegex.exec(columnsContent)) !== null) {
    const columnName = match[1];
    const columnType = match[2];
    const columnDbName = match[3];
    const modifiers = match[4] || '';
    
    columns[columnName] = {
      name: columnDbName,
      type: columnType,
      modifiers: parseModifiers(modifiers)
    };
  }
  
  return columns;
}

// Parse column modifiers like primaryKey, notNull, etc.
function parseModifiers(modifiersStr) {
  const modifiers = {};
  
  if (modifiersStr.includes('.primaryKey()')) {
    modifiers.primaryKey = true;
  }
  
  if (modifiersStr.includes('.notNull()')) {
    modifiers.notNull = true;
  }
  
  if (modifiersStr.includes('.unique()')) {
    modifiers.unique = true;
  }
  
  if (modifiersStr.includes('.defaultNow()')) {
    modifiers.default = 'CURRENT_TIMESTAMP';
  }
  
  if (modifiersStr.includes('.default(')) {
    const defaultMatch = modifiersStr.match(/\.default\(([^)]+)\)/);
    if (defaultMatch) {
      modifiers.default = defaultMatch[1];
    }
  }
  
  if (modifiersStr.includes('.references(')) {
    const refMatch = modifiersStr.match(/\.references\(\(\) => (\w+)\.(\w+)/);
    if (refMatch) {
      modifiers.references = {
        table: refMatch[1],
        column: refMatch[2]
      };
      
      if (modifiersStr.includes('onDelete: "cascade"')) {
        modifiers.onDelete = 'CASCADE';
      }
    }
  }
  
  return modifiers;
}

// Convert Drizzle type to PostgreSQL type
function getPgType(column) {
  const typeMap = {
    serial: 'SERIAL',
    text: 'TEXT',
    integer: 'INTEGER',
    boolean: 'BOOLEAN',
    timestamp: 'TIMESTAMP WITH TIME ZONE',
    jsonb: 'JSONB'
  };
  
  let type = typeMap[column.type] || 'TEXT';
  
  // Handle array types
  if (column.name.endsWith('_urls') || column.name.endsWith('s_array')) {
    type += '[]';
  }
  
  return type;
}

// Generate SQL for a table
function generateTableSQL(tableName, tableDefinition) {
  const columns = Object.entries(tableDefinition.columns).map(([colName, column]) => {
    const type = getPgType(column);
    const notNull = column.modifiers.notNull ? 'NOT NULL' : '';
    const primaryKey = column.modifiers.primaryKey ? 'PRIMARY KEY' : '';
    const unique = column.modifiers.unique ? 'UNIQUE' : '';
    const defaultClause = column.modifiers.default ? `DEFAULT ${column.modifiers.default}` : '';
    
    return `  "${column.name}" ${type} ${notNull} ${primaryKey} ${unique} ${defaultClause}`.trim().replace(/\s+/g, ' ');
  }).join(',\n');
  
  return `-- Create table ${tableName}
CREATE TABLE IF NOT EXISTS "${tableName}" (
${columns}
);

`;
}

// Generate SQL for foreign keys
function generateForeignKeysSQL(tables) {
  let sql = '';
  
  Object.values(tables).forEach(table => {
    Object.values(table.columns).forEach(column => {
      if (column.modifiers.references) {
        const referencedTable = tables[column.modifiers.references.table];
        if (!referencedTable) return; // Skip if referenced table not found
        
        const foreignKeyName = `fk_${table.name}_${column.name}_${referencedTable.name}`;
        
        sql += `-- Add foreign key from ${table.name}.${column.name} to ${referencedTable.name}.${column.modifiers.references.column}
ALTER TABLE "${table.name}" ADD CONSTRAINT "${foreignKeyName}" 
  FOREIGN KEY ("${column.name}") REFERENCES "${referencedTable.name}" ("${column.modifiers.references.column}")`;
        
        if (column.modifiers.onDelete) {
          sql += ` ON DELETE ${column.modifiers.onDelete}`;
        }
        
        sql += `;\n\n`;
      }
    });
  });
  
  return sql;
}

// Main function to generate SQL
function generateSQL() {
  const tables = extractTableDefinitions(schemaContent);
  
  let sqlContent = `-- Supabase Schema Migration
-- Generated on ${new Date().toISOString()}

`;

  // Create tables
  Object.entries(tables).forEach(([_, table]) => {
    sqlContent += generateTableSQL(table.name, table);
  });
  
  // Add foreign key constraints
  sqlContent += generateForeignKeysSQL(tables);

  // Write to file
  const outputPath = path.join(process.cwd(), 'supabase-schema.sql');
  fs.writeFileSync(outputPath, sqlContent, 'utf8');
  console.log(`Schema SQL generated at ${outputPath}`);
}

// Run the generator
generateSQL(); 
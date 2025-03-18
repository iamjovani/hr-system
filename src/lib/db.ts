import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Make sure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'hr-system.db');

// Check if we're in a read-only filesystem (like production environments)
let db: Database.Database;
try {
  // Try to open the database with write permissions
  db = new Database(dbPath, { fileMustExist: false });
  
  // Test write access by executing a simple query
  db.prepare('PRAGMA user_version = 1').run();
  
  console.log('Database opened with write permissions');
} catch (error) {
  console.warn('Unable to open database with write permissions:', error);
  console.log('Falling back to in-memory database');
  
  // Fall back to in-memory database if we can't write to the filesystem
  db = new Database(':memory:');
  
  // Add this to help with debugging
  console.log('Using in-memory database');
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    payRate REAL NOT NULL,
    password TEXT NOT NULL DEFAULT 'password'
  );
  
  CREATE TABLE IF NOT EXISTS time_records (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    clockInTime TEXT NOT NULL,
    clockOutTime TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id)
  );
  
  CREATE TABLE IF NOT EXISTS admins (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL
  );
`);

// Check if we need to seed initial data (this will run for in-memory DB every time)
const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };

if (employeeCount.count === 0) {
  // Seed initial employees
  const insertEmployee = db.prepare('INSERT INTO employees (id, name, payRate, password) VALUES (?, ?, ?, ?)');
  
  insertEmployee.run('1001', 'John Doe', 15.50, 'password');
  insertEmployee.run('1002', 'Jane Smith', 18.75, 'password');
  insertEmployee.run('1003', 'Robert Johnson', 20.00, 'password');
  
  // Seed admin user
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'admin123');
  
  console.log('Database seeded with initial data');
}

// Check if we need to add password field to existing employees
try {
  // Try to check if the password field exists
  db.prepare('SELECT password FROM employees LIMIT 1').get();
} catch (error) {
  // If error, then password field doesn't exist, so add it
  console.log('Adding password field to employees table...');
  db.exec('ALTER TABLE employees ADD COLUMN password TEXT NOT NULL DEFAULT "password"');
  console.log('Password field added to employees table');
}

export default db;
// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Make sure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(path.join(dataDir, 'hr-system.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    payRate REAL NOT NULL
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

// Check if we need to seed initial data
const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };

if (employeeCount.count === 0) {
  // Seed initial employees
  const insertEmployee = db.prepare('INSERT INTO employees (id, name, payRate) VALUES (?, ?, ?)');
  
  insertEmployee.run('1001', 'John Doe', 15.50);
  insertEmployee.run('1002', 'Jane Smith', 18.75);
  insertEmployee.run('1003', 'Robert Johnson', 20.00);
  
  // Seed admin user
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'admin123');
  
  console.log('Database seeded with initial data');
}

export default db;
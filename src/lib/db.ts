import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { hashSync } from 'bcryptjs';

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
    password TEXT NOT NULL DEFAULT 'password123'
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

  CREATE TABLE IF NOT EXISTS time_off_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    ptoTotal INTEGER NOT NULL,
    ptoRemaining INTEGER NOT NULL,
    sickDaysTotal INTEGER NOT NULL,
    sickDaysRemaining INTEGER NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id),
    UNIQUE(employeeId, year)
  );

  CREATE TABLE IF NOT EXISTS time_off_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    requestType TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    durationHours INTEGER NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id)
  );
`);

// Check if we need to seed initial data (this will run for in-memory DB every time)
const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };

if (employeeCount.count === 0) {
  // Hash the default password
  const defaultPassword = hashSync('password123', 10);
  const adminPassword = hashSync('admin123', 10);
  
  // Seed initial employees
  const insertEmployee = db.prepare('INSERT INTO employees (id, name, payRate, password) VALUES (?, ?, ?, ?)');
  
  insertEmployee.run('1001', 'John Doe', 15.50, defaultPassword);
  insertEmployee.run('1002', 'Jane Smith', 18.75, defaultPassword);
  insertEmployee.run('1003', 'Robert Johnson', 20.00, defaultPassword);
  
  // Seed admin user
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', adminPassword);
  
  console.log('Database seeded with initial data');
}

// Check if we need to add password field to existing employees
try {
  // Try to check if the password field exists
  db.prepare('SELECT password FROM employees LIMIT 1').get();
} catch (error) {
  // If error, then password field doesn't exist, so add it
  console.log('Adding password field to employees table...');
  const defaultPassword = hashSync('password123', 10);
  db.exec(`ALTER TABLE employees ADD COLUMN password TEXT NOT NULL DEFAULT '${defaultPassword}'`);
  console.log('Password field added to employees table');
}

// Set pragmas for performance
db.pragma('journal_mode = WAL');

// Add autoClockOut column to time_records if it doesn't exist
const columns = db.prepare(`PRAGMA table_info(time_records)`).all();
const columnNames = columns.map((col: any) => col.name);

if (!columnNames.includes('autoClockOut')) {
  db.exec(`ALTER TABLE time_records ADD COLUMN autoClockOut INTEGER DEFAULT 0;`);
  console.log('Added autoClockOut column to time_records table');
}

// Create system_logs table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL
  );
`);

// Check if we need to initialize time off allocations for existing employees
const allocationsCount = db.prepare('SELECT COUNT(*) as count FROM time_off_allocations').get() as { count: number };
if (allocationsCount.count === 0) {
  const currentYear = new Date().getFullYear();
  const employees = db.prepare('SELECT id FROM employees').all() as { id: string }[];
  
  // Default PTO and sick days for new employees
  const defaultPTO = 80; // 10 days (8 hours each)
  const defaultSickDays = 40; // 5 days (8 hours each)
  
  const insertAllocation = db.prepare(
    'INSERT INTO time_off_allocations (employeeId, year, ptoTotal, ptoRemaining, sickDaysTotal, sickDaysRemaining) VALUES (?, ?, ?, ?, ?, ?)'
  );
  
  for (const employee of employees) {
    insertAllocation.run(employee.id, currentYear, defaultPTO, defaultPTO, defaultSickDays, defaultSickDays);
  }
  
  console.log(`Initialized time off allocations for ${employees.length} employees`);
}

// Migrate any plain text passwords to hashed passwords
try {
  // Check for plain text passwords (they will be shorter than hashed ones)
  const plainTextEmployees = db.prepare(
    'SELECT id, password FROM employees WHERE length(password) < 30'
  ).all() as { id: string; password: string }[];

  const plainTextAdmins = db.prepare(
    'SELECT username, password FROM admins WHERE length(password) < 30'
  ).all() as { username: string; password: string }[];

  // Update employee passwords
  if (plainTextEmployees.length > 0) {
    const updateEmployeePassword = db.prepare(
      'UPDATE employees SET password = ? WHERE id = ?'
    );

    for (const employee of plainTextEmployees) {
      const hashedPassword = hashSync(employee.password, 10);
      updateEmployeePassword.run(hashedPassword, employee.id);
    }
    console.log(`Migrated ${plainTextEmployees.length} employee passwords to hashed format`);
  }

  // Update admin passwords
  if (plainTextAdmins.length > 0) {
    const updateAdminPassword = db.prepare(
      'UPDATE admins SET password = ? WHERE username = ?'
    );

    for (const admin of plainTextAdmins) {
      const hashedPassword = hashSync(admin.password, 10);
      updateAdminPassword.run(hashedPassword, admin.username);
    }
    console.log(`Migrated ${plainTextAdmins.length} admin passwords to hashed format`);
  }
} catch (error) {
  console.error('Error during password migration:', error);
}

export default db;
// src/app/api/employees/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, payRate } = await request.json();
    
    if (!name || typeof payRate !== 'number') {
      return NextResponse.json(
        { error: 'Name and pay rate are required' },
        { status: 400 }
      );
    }
    
    // Generate a new ID (sequential from 1004 upwards)
    const lastId = db.prepare('SELECT MAX(CAST(id as INT)) as maxId FROM employees').get() as { maxId: number };
    const newId = String(Math.max(1004, (lastId.maxId || 1003) + 1));
    
    // Insert the new employee
    db.prepare(
      'INSERT INTO employees (id, name, payRate) VALUES (?, ?, ?)'
    ).run(newId, name, payRate);
    
    // Return the created employee
    const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(newId);
    
    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
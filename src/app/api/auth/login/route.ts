// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { compare } from 'bcryptjs';

interface Admin {
  username: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // First get the admin by username only
    const admin = db.prepare(
      'SELECT * FROM admins WHERE username = ?'
    ).get(username) as Admin | undefined;
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hash
    const isValidPassword = await compare(password, admin.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ 
      id: 'admin', 
      name: 'Administrator', 
      payRate: 0,
      isAdmin: true 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
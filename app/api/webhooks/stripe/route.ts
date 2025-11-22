// Stripe webhook disabled - using mock payment instead
// This route is kept for future Stripe integration

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Mock webhook - payment is handled directly in booking creation
  return NextResponse.json({ 
    received: true,
    message: 'Mock payment mode - webhook not needed' 
  });
}


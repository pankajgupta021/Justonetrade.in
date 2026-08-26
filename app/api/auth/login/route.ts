import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validation/auth';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientKey(request, 'login'), { limit: 10, windowSecs: 900 });
  if (!rl.success) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
    );
  }

  try {
    const body = await request.json();

    const validatedData = loginSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email or password.',
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = validatedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Invalid email or password.',
          },
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Invalid email or password.',
          },
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled. Please contact support.',
          },
        },
        { status: 403 }
      );
    }

    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            countryCode: user.countryCode,
            contactNumber: user.contactNumber,
            role: user.role,
            isActive: user.isActive,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during login.',
        },
      },
      { status: 500 }
    );
  }
}

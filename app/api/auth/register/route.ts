import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { registerSchema } from '@/lib/validation/auth';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientKey(request, 'register'), { limit: 5, windowSecs: 3600 });
  if (!rl.success) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
    );
  }

  try {
    const body = await request.json();

    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please check the provided information.',
            fields: validatedData.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { fullName, email, countryCode, contactNumber, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT_ERROR',
            message: 'An account with this email already exists.',
          },
        },
        { status: 409 }
      );
    }


    const existingPhone = await prisma.user.findFirst({
      where: { countryCode, contactNumber },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT_ERROR',
            message: 'An account with this phone number already exists.',
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const now = new Date();
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        countryCode,
        contactNumber,
        passwordHash,
        role: 'SUBSCRIBER',
        isActive: true,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        contactNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: { user } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during registration.',
        },
      },
      { status: 500 }
    );
  }
}

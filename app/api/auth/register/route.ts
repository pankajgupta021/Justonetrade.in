import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { registerSchema } from '@/lib/validation/auth';

export async function POST(request: Request) {
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

    const { fullName, email, phone, password } = validatedData.data;

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
      where: { phone },
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
        phone,
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
        phone: true,
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

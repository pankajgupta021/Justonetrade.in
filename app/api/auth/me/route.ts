import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth.isAuthorized || !auth.user) {
      return auth.response;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: auth.user.id,
            fullName: auth.user.fullName,
            email: auth.user.email,
            countryCode: auth.user.countryCode,
            contactNumber: auth.user.contactNumber,
            role: auth.user.role,
            isActive: auth.user.isActive,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while fetching user data.',
        },
      },
      { status: 500 }
    );
  }
}

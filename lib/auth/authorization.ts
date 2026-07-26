import { getSession } from './session';
import { NextResponse } from 'next/server';
import { Role } from '../generated/prisma/client';

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'You must be logged in to access this resource.' } },
        { status: 401 }
      )
    };
  }

  return {
    isAuthorized: true,
    user: session.user,
  };
}

export async function requireRole(allowedRoles: Role[]) {
  const auth = await requireAuth();
  
  if (!auth.isAuthorized || !auth.user) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      isAuthorized: false,
      response: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource.' } },
        { status: 403 }
      )
    };
  }

  return {
    isAuthorized: true,
    user: auth.user,
  };
}

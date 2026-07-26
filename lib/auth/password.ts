import * as argon2 from 'argon2';
// Hash a plain text password using Argon2id.
export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
  });
}

//  Verify a plain text password against a stored Argon2id hash.

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

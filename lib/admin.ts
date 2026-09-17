import crypto from 'crypto';

/**
 * Retrieve the master admin secret from environment variables.
 * Fallbacks to REVALIDATE_SECRET or a default dev token for local testing.
 */
export function getAdminSecret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.REVALIDATE_SECRET ||
    'onecoder-secret-token-change-in-production'
  ).trim();
}

/**
 * Generate a cryptographically secure HMAC token for a specific comment deletion.
 * This token is unique to this comment ID and cannot be used to delete other comments.
 */
export function generateCommentDeleteToken(commentId: string): string {
  const secret = getAdminSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(`comment-delete:${commentId}`)
    .digest('hex');
}

/**
 * Verify whether the given token matches the comment's HMAC token or the master admin secret.
 */
export function verifyCommentDeleteToken(commentId: string, token: string): boolean {
  if (!commentId || !token) return false;

  const masterSecret = getAdminSecret();
  if (token === masterSecret) return true;

  const expectedToken = generateCommentDeleteToken(commentId);
  try {
    const a = Buffer.from(token, 'hex');
    const b = Buffer.from(expectedToken, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

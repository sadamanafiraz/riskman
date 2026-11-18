import { clerkMiddleware } from '@clerk/nextjs/server';
// Participant endpoints use a database-backed guest cookie; only teacher endpoints use Clerk.
export default clerkMiddleware();
export const config={matcher:['/sign-in(.*)','/sign-up(.*)','/sign-out','/api/me','/api/classes(.*)']};

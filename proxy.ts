import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.pathname === '/') {
    url.pathname = '/ai-search-visibility';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};

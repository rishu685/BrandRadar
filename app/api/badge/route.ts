import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand') || 'Brand';
  const score = searchParams.get('score') || '85';
  const numScore = parseInt(score, 10) || 85;

  const color =
    numScore >= 80 ? '#10B981' : numScore >= 60 ? '#F59E0B' : '#EF4444';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210" height="28" viewBox="0 0 210 28" fill="none" role="img" aria-label="BrandRadar GEO Score: ${numScore}/100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#18181B" />
      <stop offset="100%" stop-color="#27272A" />
    </linearGradient>
  </defs>
  <clipPath id="r">
    <rect width="210" height="28" rx="6" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="135" height="28" fill="url(#grad)"/>
    <rect x="135" width="75" height="28" fill="${color}"/>
    <g fill="#fff" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" text-rendering="geometricPrecision" font-size="11" font-weight="600">
      <text x="68" y="18" fill="#fff" opacity="0.95">BrandRadar · ${brand}</text>
      <text x="172" y="18" fill="#fff">${numScore}/100</text>
    </g>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

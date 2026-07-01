import type { NextConfig } from 'next';

const hasExternalApiUrl = Boolean(process.env.NEXT_PUBLIC_API_URL);
const isVercelBuild = Boolean(process.env.VERCEL);

if (isVercelBuild && !hasExternalApiUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL es obligatoria para desplegar apps/web en Vercel. Configura una API remota antes de publicar.',
  );
}

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (hasExternalApiUrl || process.env.NODE_ENV !== 'development') {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;

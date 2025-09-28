import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker (only in production)
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Optimize for production
  compress: true,
  
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Disable turbopack in development to avoid manifest issues
    // Remove --turbopack from package.json scripts instead
  }),
  
  // Enable experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001']
    },
    // Optimize development
    ...(process.env.NODE_ENV === 'development' && {
      optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog']
    })
  },
  
  // Configure webpack for Monaco Editor, PDF.js and stability
  webpack: (config, { isServer, dev }) => {
    // Handle Monaco Editor and PDF.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        canvas: false,
      }
      
      // Configure PDF.js worker
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.min.js',
      }
    }
    
    // Development optimizations to prevent build manifest issues
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next']
      }
      
      // Reduce memory usage in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    return config
  },
  
  // Remove api config - not valid in Next.js 15
  // API configuration is now handled in route files
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/editor',
        destination: '/',
        permanent: true,
      },
    ]
  }
};

export default nextConfig;

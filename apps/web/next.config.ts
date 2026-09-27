import type { NextConfig } from 'next';
import path from 'node:path';
const nextConfig: NextConfig = { transpilePackages: ['@usn/ui', '@usn/types', '@usn/config', '@usn/utils'], output: 'standalone', outputFileTracingRoot: path.join(process.cwd(), '../..') };
export default nextConfig;

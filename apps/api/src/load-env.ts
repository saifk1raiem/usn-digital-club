import { config } from 'dotenv';

// Prisma can load .env while modules are being evaluated. Apply a local-only
// development override before AppModule (and PrismaClient) are imported.
config({ path: '.env.local', override: true, quiet: true });

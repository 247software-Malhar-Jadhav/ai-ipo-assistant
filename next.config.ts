import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + native node deps must not be bundled by webpack on the server.
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer"],
  eslint: {
    // Don't fail production builds on lint warnings; lint is run separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

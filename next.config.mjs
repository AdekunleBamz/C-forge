import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    "@bamzzstudio/cforge-abi",
    "@bamzzstudio/cforge-addresses",
    "@bamzzstudio/cforge-core",
    "@bamzzstudio/cforge-react",
    "@bamzzstudio/cforge-wallets",
  ],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@bamzzstudio/cforge-abi": path.resolve("../C-forge-sdk/packages/abi/src/index.ts"),
      "@bamzzstudio/cforge-addresses": path.resolve("../C-forge-sdk/packages/addresses/src/index.ts"),
      "@bamzzstudio/cforge-core": path.resolve("../C-forge-sdk/packages/core/src/index.ts"),
      "@bamzzstudio/cforge-react": path.resolve("../C-forge-sdk/packages/react/src/index.ts"),
      "@bamzzstudio/cforge-wallets": path.resolve("../C-forge-sdk/packages/wallets/src/index.ts"),
    };
    return config;
  },
};

export default nextConfig;

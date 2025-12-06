/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle problematic packages
  serverExternalPackages: ["pino", "thread-stream", "@copilotkit/runtime"],

  // Transpile CopilotKit packages
  transpilePackages: ["@copilotkit/react-core", "@copilotkit/react-ui"],

  // Skip ESLint during builds (run separately)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack config to handle CopilotKit issues
  webpack: (config, { isServer }) => {
    // Externalize problematic packages on server
    if (isServer) {
      config.externals = [...(config.externals || []), "@copilotkit/runtime"];
    }
    return config;
  },
};

export default nextConfig;

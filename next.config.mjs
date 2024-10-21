// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
})({
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
});

export default nextConfig;

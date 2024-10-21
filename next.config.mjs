// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // 開発モードでのみ無効化
})({
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
});

export default nextConfig;

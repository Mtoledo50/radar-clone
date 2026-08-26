/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: process.cwd(), // 🆕 força o Turbopack a usar o frontend como raiz
  },
  // typescript: { ignoreBuildErrors: true },  ← REMOVER esta linha
};
export default nextConfig;
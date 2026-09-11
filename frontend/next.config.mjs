/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['radar.contacerta.com.br', 'localhost', '127.0.0.1'],

  output: 'standalone',
  turbopack: {
    root: process.cwd(), // 🆕 força o Turbopack a usar o frontend como raiz
  },
  // typescript: { ignoreBuildErrors: true },  ← REMOVER esta linha
};
export default nextConfig;
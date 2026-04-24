const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Permite importar do diretório backend/ que fica fora de site/
    config.resolve.alias['@backend'] = path.resolve(__dirname, '..', 'backend');
    return config;
  },
  // Permite imports de fora do diretório raiz do Next.js
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;

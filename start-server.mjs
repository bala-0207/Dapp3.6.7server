#!/usr/bin/env node

/**
 * ZK-PRET Integrated Server Startup Script
 * 
 * This script starts the integrated HTTP server that provides API access
 * to all ZK-PRET backend tools and functionality.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting ZK-PRET Integrated Server...');
console.log('📁 Project Directory:', __dirname);

// Check if build directory exists
const buildPath = join(__dirname, 'build');
if (!existsSync(buildPath)) {
  console.log('📦 Build directory not found. Running build first...');
  try {
    await execAsync('npm run build', { cwd: __dirname });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check if server build exists
const serverBuildPath = join(__dirname, 'build', 'server');
if (!existsSync(serverBuildPath)) {
  console.log('🔧 Server build not found. Building server...');
  try {
    await execAsync('npm run server:build', { cwd: __dirname });
    console.log('✅ Server build completed successfully');
  } catch (error) {
    console.error('❌ Server build failed:', error.message);
    process.exit(1);
  }
}

console.log('🎯 Starting integrated server with timeout protection...');

// Start the server with timeout protection
try {
  const { startServer } = await import('./build/server/integrated-server.js');
  
  // Add startup timeout protection
  const startupTimeout = setTimeout(() => {
    console.error('❌ Server startup timeout after 30 seconds');
    console.log('⚠️  This usually means the health check is hanging');
    console.log('⚠️  The server should now have timeout protection to handle this');
    process.exit(1);
  }, 30000);
  
  await startServer();
  clearTimeout(startupTimeout);
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
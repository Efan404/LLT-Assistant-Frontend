#!/usr/bin/env node

/**
 * Switch backend URL between local and production
 * Usage: node switch-backend.js [local|prod]
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../src/utils/config.ts');
const LOCAL_URL = 'http://localhost:8886';
const PROD_URL = 'https://cs5351.efan.dev';

function switchBackend(env) {
  const configContent = fs.readFileSync(configPath, 'utf-8');
  
  let newUrl;
  let message;
  
  if (env === 'local') {
    newUrl = LOCAL_URL;
    message = '✅ Switched to LOCAL backend (http://localhost:8886)';
  } else if (env === 'prod') {
    newUrl = PROD_URL;
    message = '✅ Switched to PRODUCTION backend (https://cs5351.efan.dev)';
  } else {
    console.error('❌ Usage: node switch-backend.js [local|prod]');
    process.exit(1);
  }
  
  // Replace the URL in config file (avoid matching commented lines)
  const updatedContent = configContent.replace(
    /^(\s*)URL: 'https?:\/\/[^']*'/m,
    `$1URL: '${newUrl}'`
  );
  
  fs.writeFileSync(configPath, updatedContent, 'utf-8');
  console.log(message);
  console.log('📄 Modified: src/utils/config.ts');
  console.log('💡 Remember to reload VSCode extension (Cmd/Ctrl+Shift+P → "Developer: Reload Window")');
}

// Get environment from command line argument
const env = process.argv[2];

if (!env) {
  // Check current setting
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const match = configContent.match(/URL: '(https?:\/\/[^']*)'/);
  
  if (match) {
    const currentUrl = match[1];
    console.log('🔍 Current backend URL:', currentUrl);
    console.log('');
    console.log('Usage:');
    console.log('  node switch-backend.js local  # Switch to localhost:8886');
    console.log('  node switch-backend.js prod   # Switch to cs5351.efan.dev');
  }
  process.exit(0);
}

switchBackend(env);

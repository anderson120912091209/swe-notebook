#!/usr/bin/env node
/**
 * Postinstall script to fix @anderson120912091209/mathlive-custom package.json paths
 * This fixes the incorrect paths that prevent Turbopack from resolving the package
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'node_modules', '@anderson120912091209', 'mathlive-custom', 'package.json');

if (fs.existsSync(packagePath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Fix the paths to point to dist folder
    pkg.main = './dist/mathlive.min.js';
    pkg.module = './dist/mathlive.min.mjs';
    pkg.types = './dist/types/mathlive.d.ts';
    
    // Fix exports paths
    if (pkg.exports && pkg.exports['.']) {
      const defaultExport = pkg.exports['.'];
      if (defaultExport.browser) {
        if (defaultExport.browser.production) {
          defaultExport.browser.production.import = './dist/mathlive.min.mjs';
          defaultExport.browser.production.require = './dist/mathlive.min.js';
          defaultExport.browser.production.types = './dist/types/mathlive.d.ts';
        }
        if (defaultExport.browser.development) {
          defaultExport.browser.development.import = './dist/mathlive.mjs';
          defaultExport.browser.development.require = './dist/mathlive.js';
          defaultExport.browser.development.types = './dist/types/mathlive.d.ts';
        }
      }
      if (defaultExport.node) {
        defaultExport.node.types = './dist/types/mathlive-ssr.d.ts';
        defaultExport.node.import = './dist/mathlive-ssr.min.mjs';
      }
      if (defaultExport.default) {
        defaultExport.default.import = './dist/mathlive.min.mjs';
        defaultExport.default.require = './dist/mathlive.min.js';
        defaultExport.default.types = './dist/types/mathlive.d.ts';
      }
    }
    
    // Fix other exports
    if (pkg.exports) {
      if (pkg.exports['./vue']) {
        pkg.exports['./vue'] = './dist/vue-mathlive.mjs';
      }
      if (pkg.exports['./fonts.css']) {
        pkg.exports['./fonts.css'] = './dist/mathlive-fonts.css';
      }
      if (pkg.exports['./static.css']) {
        pkg.exports['./static.css'] = './dist/mathlive-static.css';
      }
      if (pkg.exports['./ssr']) {
        pkg.exports['./ssr'].types = './dist/types/mathlive-ssr.d.ts';
        pkg.exports['./ssr'].import = './dist/mathlive-ssr.min.mjs';
      }
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    console.log('✅ Fixed @anderson120912091209/mathlive-custom package.json paths');
  } catch (error) {
    console.warn('⚠️  Could not fix mathlive package.json:', error.message);
  }
} else {
  console.log('ℹ️  @anderson120912091209/mathlive-custom not found, skipping fix');
}


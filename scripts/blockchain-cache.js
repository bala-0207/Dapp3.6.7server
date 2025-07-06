#!/usr/bin/env node

/**
 * Local Blockchain Cache Manager
 * Saves and restores complete blockchain state to skip setup time
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BLOCKCHAIN_CACHE_DIR = 'cached-blockchain';
const CACHE_METADATA_FILE = path.join(BLOCKCHAIN_CACHE_DIR, 'cache-metadata.json');
const BLOCKCHAIN_STATE_FILE = path.join(BLOCKCHAIN_CACHE_DIR, 'blockchain-state.json');
const DEPLOYED_CONTRACTS_FILE = path.join(BLOCKCHAIN_CACHE_DIR, 'deployed-contracts.json');

// Files that affect blockchain setup
const BLOCKCHAIN_DEPENDENCIES = [
    'src/contracts/with-sign/GLEIFEnhancedVerifierSmartContractWithSign.ts',
    'src/zk-programs/with-sign/GLEIFEnhancedZKProgramWithSign.ts',
    'src/core/OracleRegistry.ts',
    'src/tests/with-sign/EnhancedGLEIFVerificationTestWithSign.ts'
];

function calculateFileChecksum(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function calculateDependencyHash() {
    const checksums = {};
    for (const file of BLOCKCHAIN_DEPENDENCIES) {
        checksums[file] = calculateFileChecksum(file);
    }
    
    // Create combined hash of all dependencies
    const combinedContent = JSON.stringify(checksums, Object.keys(checksums).sort());
    return crypto.createHash('sha256').update(combinedContent).digest('hex');
}

function loadCacheMetadata() {
    if (!fs.existsSync(CACHE_METADATA_FILE)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(CACHE_METADATA_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function isCacheValid() {
    console.log('🔍 Checking blockchain cache validity...');
    
    const metadata = loadCacheMetadata();
    if (!metadata) {
        console.log('📝 No cache metadata found');
        return false;
    }
    
    const currentHash = calculateDependencyHash();
    const cachedHash = metadata.dependencyHash;
    
    if (currentHash !== cachedHash) {
        console.log('🔄 Dependencies changed, cache invalid');
        console.log(`   Current:  ${currentHash}`);
        console.log(`   Cached:   ${cachedHash}`);
        return false;
    }
    
    // Check if all cache files exist
    const requiredFiles = [BLOCKCHAIN_STATE_FILE, DEPLOYED_CONTRACTS_FILE];
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            console.log(`❌ Missing cache file: ${file}`);
            return false;
        }
    }
    
    console.log('✅ Blockchain cache is valid');
    console.log(`📅 Cached on: ${metadata.cachedAt}`);
    return true;
}

function saveCacheMetadata(additionalData = {}) {
    if (!fs.existsSync(BLOCKCHAIN_CACHE_DIR)) {
        fs.mkdirSync(BLOCKCHAIN_CACHE_DIR, { recursive: true });
    }
    
    const metadata = {
        dependencyHash: calculateDependencyHash(),
        cachedAt: new Date().toISOString(),
        version: '1.0.0',
        files: BLOCKCHAIN_DEPENDENCIES,
        ...additionalData
    };
    
    fs.writeFileSync(CACHE_METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log(`💾 Cache metadata saved: ${CACHE_METADATA_FILE}`);
}

function saveBlockchainState(blockchainData) {
    if (!fs.existsSync(BLOCKCHAIN_CACHE_DIR)) {
        fs.mkdirSync(BLOCKCHAIN_CACHE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(BLOCKCHAIN_STATE_FILE, JSON.stringify(blockchainData, null, 2));
    console.log(`💾 Blockchain state cached: ${BLOCKCHAIN_STATE_FILE}`);
}

function loadBlockchainState() {
    if (!fs.existsSync(BLOCKCHAIN_STATE_FILE)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(BLOCKCHAIN_STATE_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function saveDeployedContracts(contractData) {
    if (!fs.existsSync(BLOCKCHAIN_CACHE_DIR)) {
        fs.mkdirSync(BLOCKCHAIN_CACHE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(DEPLOYED_CONTRACTS_FILE, JSON.stringify(contractData, null, 2));
    console.log(`💾 Contract deployment cached: ${DEPLOYED_CONTRACTS_FILE}`);
}

function loadDeployedContracts() {
    if (!fs.existsSync(DEPLOYED_CONTRACTS_FILE)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(DEPLOYED_CONTRACTS_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function clearCache() {
    console.log('🗑️ Clearing blockchain cache...');
    if (fs.existsSync(BLOCKCHAIN_CACHE_DIR)) {
        fs.rmSync(BLOCKCHAIN_CACHE_DIR, { recursive: true, force: true });
        console.log('✅ Cache cleared');
    } else {
        console.log('ℹ️ No cache to clear');
    }
}

function getCacheStats() {
    if (!fs.existsSync(BLOCKCHAIN_CACHE_DIR)) {
        return { exists: false };
    }
    
    const metadata = loadCacheMetadata();
    const stats = fs.statSync(BLOCKCHAIN_CACHE_DIR);
    
    // Calculate total cache size
    let totalSize = 0;
    function calculateSize(dir) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            if (stat.isDirectory()) {
                calculateSize(itemPath);
            } else {
                totalSize += stat.size;
            }
        }
    }
    calculateSize(BLOCKCHAIN_CACHE_DIR);
    
    return {
        exists: true,
        valid: isCacheValid(),
        metadata,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        sizeBytes: totalSize,
        sizeKB: Math.round(totalSize / 1024),
        files: fs.readdirSync(BLOCKCHAIN_CACHE_DIR)
    };
}

// Export for use in other modules
export {
    isCacheValid,
    saveCacheMetadata,
    saveBlockchainState,
    loadBlockchainState,
    saveDeployedContracts,
    loadDeployedContracts,
    clearCache,
    getCacheStats,
    BLOCKCHAIN_CACHE_DIR
};

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            const valid = isCacheValid();
            console.log(`Cache status: ${valid ? 'VALID' : 'INVALID'}`);
            process.exit(valid ? 0 : 1);
            
        case 'clear':
            clearCache();
            break;
            
        case 'stats':
            const stats = getCacheStats();
            if (!stats.exists) {
                console.log('📊 No blockchain cache exists');
            } else {
                console.log('📊 Blockchain Cache Stats:');
                console.log(`   Valid: ${stats.valid ? '✅' : '❌'}`);
                console.log(`   Size: ${stats.sizeKB}KB`);
                console.log(`   Created: ${stats.createdAt}`);
                console.log(`   Modified: ${stats.modifiedAt}`);
                console.log(`   Files: ${stats.files.join(', ')}`);
                if (stats.metadata) {
                    console.log(`   Cached on: ${stats.metadata.cachedAt}`);
                }
            }
            break;
            
        default:
            console.log('Usage: node blockchain-cache.js <command>');
            console.log('Commands:');
            console.log('  check  - Check if cache is valid');
            console.log('  clear  - Clear the cache');
            console.log('  stats  - Show cache statistics');
    }
}

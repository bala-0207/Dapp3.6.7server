#!/usr/bin/env node

/**
 * Smart ZK Pre-compilation with Change Detection
 * Only recompiles when source files have changed
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PRECOMPILED_DIR = 'precompiled-zk';
const CHECKSUMS_FILE = path.join(PRECOMPILED_DIR, 'checksums.json');

// Source files to monitor for changes
const SOURCE_FILES = [
    'src/zk-programs/with-sign/GLEIFEnhancedZKProgramWithSign.ts',
    'src/contracts/with-sign/GLEIFEnhancedVerifierSmartContractWithSign.ts',
    'src/zk-programs/with-sign/GLEIFEnhancedComplianceData.ts'
];

function calculateFileChecksum(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

function loadPreviousChecksums() {
    if (!fs.existsSync(CHECKSUMS_FILE)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(CHECKSUMS_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveCurrentChecksums(checksums) {
    if (!fs.existsSync(PRECOMPILED_DIR)) {
        fs.mkdirSync(PRECOMPILED_DIR, { recursive: true });
    }
    fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify({
        ...checksums,
        lastCompiled: new Date().toISOString()
    }, null, 2));
}

function detectChanges() {
    console.log('🔍 Checking for changes in ZK source files...');
    
    const previousChecksums = loadPreviousChecksums();
    const currentChecksums = {};
    const changes = [];

    for (const file of SOURCE_FILES) {
        const currentChecksum = calculateFileChecksum(file);
        const previousChecksum = previousChecksums[file];
        
        currentChecksums[file] = currentChecksum;
        
        if (currentChecksum !== previousChecksum) {
            if (previousChecksum === undefined) {
                changes.push(`📄 New file: ${file}`);
            } else if (currentChecksum === null) {
                changes.push(`❌ Deleted file: ${file}`);
            } else {
                changes.push(`📝 Modified: ${file}`);
            }
        }
    }

    return { changes, currentChecksums };
}

async function smartPrecompile() {
    console.log('🤖 Smart ZK Pre-compilation with Change Detection');
    console.log('================================================');
    
    const { changes, currentChecksums } = detectChanges();
    
    if (changes.length === 0) {
        console.log('✅ No changes detected in ZK source files');
        console.log('🚀 Using existing precompiled artifacts');
        
        // Check if precompiled files exist
        const zkVkFile = path.join(PRECOMPILED_DIR, 'gleif-enhanced-zk-program.vk.json');
        const scVkFile = path.join(PRECOMPILED_DIR, 'gleif-enhanced-smart-contract.vk.json');
        
        if (fs.existsSync(zkVkFile) && fs.existsSync(scVkFile)) {
            console.log('💾 Precompiled verification keys are up to date');
            console.log(`📁 Location: ${PRECOMPILED_DIR}/`);
            return;
        } else {
            console.log('⚠️ Precompiled files missing, forcing recompilation...');
        }
    } else {
        console.log('🔄 Changes detected:');
        changes.forEach(change => console.log(`   ${change}`));
        console.log('');
    }
    
    console.log('🔨 Starting ZK compilation process...');
    
    try {
        // Dynamic import after TypeScript compilation
        const { GLEIFEnhancedZKProgram } = await import('../build/zk-programs/with-sign/GLEIFEnhancedZKProgramWithSign.js');
        const { GLEIFEnhancedVerifierSmartContractWithSign } = await import('../build/contracts/with-sign/GLEIFEnhancedVerifierSmartContractWithSign.js');
        
        if (!fs.existsSync(PRECOMPILED_DIR)) {
            fs.mkdirSync(PRECOMPILED_DIR, { recursive: true });
        }
        
        // Compile ZK Program
        console.log('🧮 Compiling ZK Program...');
        const startZK = Date.now();
        const zkResult = await GLEIFEnhancedZKProgram.compile();
        const zkTime = Date.now() - startZK;
        
        fs.writeFileSync(
            path.join(PRECOMPILED_DIR, 'gleif-enhanced-zk-program.vk.json'),
            JSON.stringify({
                verificationKey: zkResult.verificationKey,
                compiledAt: new Date().toISOString(),
                compileTimeMs: zkTime,
                type: 'GLEIFEnhancedZKProgram',
                sourceFiles: SOURCE_FILES.filter(f => f.includes('zk-programs'))
            }, null, 2)
        );
        
        // Compile Smart Contract
        console.log('🏛️ Compiling Smart Contract...');
        const startSC = Date.now();
        const scResult = await GLEIFEnhancedVerifierSmartContractWithSign.compile();
        const scTime = Date.now() - startSC;
        
        fs.writeFileSync(
            path.join(PRECOMPILED_DIR, 'gleif-enhanced-smart-contract.vk.json'),
            JSON.stringify({
                verificationKey: scResult.verificationKey,
                compiledAt: new Date().toISOString(),
                compileTimeMs: scTime,
                type: 'GLEIFEnhancedVerifierSmartContract',
                sourceFiles: SOURCE_FILES.filter(f => f.includes('contracts'))
            }, null, 2)
        );
        
        // Save checksums for next run
        saveCurrentChecksums(currentChecksums);
        
        const totalTime = zkTime + scTime;
        console.log('\n✅ Smart Pre-compilation Complete!');
        console.log(`⏱️ Total time: ${totalTime}ms`);
        console.log(`💾 Verification keys updated in: ${PRECOMPILED_DIR}/`);
        
    } catch (error) {
        console.error('\n❌ Smart pre-compilation failed:', error.message);
        process.exit(1);
    }
}

// Enhanced build script that includes smart precompilation
async function buildWithSmartPrecompile() {
    console.log('🏗️ Enhanced Build Process');
    console.log('========================');
    
    // Step 1: TypeScript compilation
    console.log('📦 Compiling TypeScript...');
    const { execSync } = await import('child_process');
    
    try {
        execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
        console.log('✅ TypeScript compilation complete');
    } catch (error) {
        console.error('❌ TypeScript compilation failed');
        process.exit(1);
    }
    
    // Step 2: Smart ZK precompilation
    await smartPrecompile();
    
    console.log('\n🎉 Enhanced Build Complete!');
    console.log('💡 Use PRECOMPILED mode for instant ZK proofs');
}

// Run based on command line arguments
const command = process.argv[2];

if (command === 'check') {
    // Just check for changes without compiling
    const { changes } = detectChanges();
    if (changes.length === 0) {
        console.log('✅ No changes detected');
        process.exit(0);
    } else {
        console.log('🔄 Changes detected:');
        changes.forEach(change => console.log(`   ${change}`));
        process.exit(1);
    }
} else if (command === 'force') {
    // Force recompilation regardless of changes
    console.log('🔨 Force recompilation mode');
    const fs = await import('fs');
    if (fs.existsSync(CHECKSUMS_FILE)) {
        fs.unlinkSync(CHECKSUMS_FILE);
    }
    await smartPrecompile();
} else if (command === 'build') {
    // Full build with smart precompilation
    await buildWithSmartPrecompile();
} else {
    // Default: smart precompile only
    await smartPrecompile();
}

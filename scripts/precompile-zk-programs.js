#!/usr/bin/env node

/**
 * Pre-compilation script for ZK Programs
 * Generates and saves verification keys for production use
 */

import { GLEIFEnhancedZKProgram } from '../build/zk-programs/with-sign/GLEIFEnhancedZKProgramWithSign.js';
import { GLEIFEnhancedVerifierSmartContractWithSign } from '../build/contracts/with-sign/GLEIFEnhancedVerifierSmartContractWithSign.js';
import fs from 'fs';
import path from 'path';

const PRECOMPILED_DIR = 'precompiled-zk';
const ZK_PROGRAM_VK_FILE = path.join(PRECOMPILED_DIR, 'gleif-enhanced-zk-program.vk.json');
const SMART_CONTRACT_VK_FILE = path.join(PRECOMPILED_DIR, 'gleif-enhanced-smart-contract.vk.json');

async function precompileZKPrograms() {
    console.log('🚀 Starting ZK Program Pre-compilation Process...');
    console.log('===============================================');
    
    // Create precompiled directory
    if (!fs.existsSync(PRECOMPILED_DIR)) {
        fs.mkdirSync(PRECOMPILED_DIR, { recursive: true });
        console.log(`📁 Created directory: ${PRECOMPILED_DIR}`);
    }
    
    try {
        // 1. Compile ZK Program and save verification key
        console.log('\n🧮 Compiling Enhanced GLEIF ZK Program...');
        const startZK = Date.now();
        
        const zkProgramResult = await GLEIFEnhancedZKProgram.compile();
        
        const zkCompileTime = Date.now() - startZK;
        console.log(`✅ ZK Program compiled in ${zkCompileTime}ms`);
        
        // Save ZK Program verification key
        fs.writeFileSync(ZK_PROGRAM_VK_FILE, JSON.stringify({
            verificationKey: zkProgramResult.verificationKey,
            compiledAt: new Date().toISOString(),
            compileTimeMs: zkCompileTime,
            type: 'GLEIFEnhancedZKProgram'
        }, null, 2));
        
        console.log(`💾 ZK Program verification key saved: ${ZK_PROGRAM_VK_FILE}`);
        
        // 2. Compile Smart Contract and save verification key
        console.log('\n🏛️ Compiling Enhanced GLEIF Smart Contract...');
        const startSC = Date.now();
        
        const smartContractResult = await GLEIFEnhancedVerifierSmartContractWithSign.compile();
        
        const scCompileTime = Date.now() - startSC;
        console.log(`✅ Smart Contract compiled in ${scCompileTime}ms`);
        
        // Save Smart Contract verification key
        fs.writeFileSync(SMART_CONTRACT_VK_FILE, JSON.stringify({
            verificationKey: smartContractResult.verificationKey,
            compiledAt: new Date().toISOString(),
            compileTimeMs: scCompileTime,
            type: 'GLEIFEnhancedVerifierSmartContract'
        }, null, 2));
        
        console.log(`💾 Smart Contract verification key saved: ${SMART_CONTRACT_VK_FILE}`);
        
        // 3. Generate summary
        const totalTime = zkCompileTime + scCompileTime;
        console.log('\n📊 Pre-compilation Summary:');
        console.log('============================');
        console.log(`🧮 ZK Program compile time: ${zkCompileTime}ms`);
        console.log(`🏛️ Smart Contract compile time: ${scCompileTime}ms`);
        console.log(`⏱️ Total compilation time: ${totalTime}ms`);
        console.log(`📁 Verification keys stored in: ${PRECOMPILED_DIR}/`);
        
        // 4. Create usage instructions
        const usageFile = path.join(PRECOMPILED_DIR, 'README.md');
        const usageContent = `# Precompiled ZK Artifacts

Generated on: ${new Date().toISOString()}
Total compilation time: ${totalTime}ms

## Files:
- \`gleif-enhanced-zk-program.vk.json\` - ZK Program verification key
- \`gleif-enhanced-smart-contract.vk.json\` - Smart Contract verification key

## Usage:
These precompiled verification keys can be used to skip compilation in production:

\`\`\`bash
# Use precompiled mode
node ./build/tests/with-sign/EnhancedGLEIFVerificationTestWithSign.js "COMPANY" "TESTNET" "PRECOMPILED"
\`\`\`

## Performance Benefits:
- ⚡ Skip ~${Math.round(totalTime/1000)} seconds of compilation time
- 🚀 Instant proof generation
- 🏭 Production-ready deployment
`;
        
        fs.writeFileSync(usageFile, usageContent);
        
        console.log('\n🎉 ZK Program Pre-compilation Complete!');
        console.log(`📖 Usage instructions: ${usageFile}`);
        console.log('\n💡 Now you can use PRECOMPILED mode for instant proof generation!');
        
    } catch (error) {
        console.error('\n❌ Pre-compilation failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    precompileZKPrograms().catch(err => {
        console.error('💥 Unhandled Error:', err);
        process.exit(1);
    });
}

export { precompileZKPrograms };

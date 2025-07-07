import { BusinessStdIntegrityOptimMerkleTestUtils } from './BusinessStdIntegrityOptimMerkleVerificationTestWithSignUtils.js';
import * as fs from 'fs';
import path from 'path';

/**
 * Business Standard Integrity Optimized Merkle Verification Test
 * 
 * This test demonstrates the complete MerkleTree-based approach for Business Standard validation.
 * It covers:
 * - All 24 required fields from data.json schema
 * - Additional fields that can use existing ZKRegex functions (fun0, fun1, fun2)
 * - Complete document data storage in MerkleTree
 * - Selective disclosure via witnesses
 * - Oracle-signed data integrity
 * 
 * Architecture:
 * - MerkleTree stores ALL document fields (complete data)
 * - Witnesses prove specific fields for validation
 * - ZK circuit validates business logic on selected fields
 * - Oracle signature ensures data integrity
 * 
 * Coverage:
 * - Core compliance: 24 required fields (100% schema coverage)
 * - Enhanced compliance: 38 fields (24 required + 14 additional ZKRegex)
 * - Pattern validation: 6 core + 8 enhanced fields using fun0, fun1, fun2
 * - Enum/Boolean/Array/String validation: Complete business logic
 */

async function main() {
  console.log('🌳 Business Standard Integrity Optimized Merkle Verification Test');
  console.log('=' .repeat(80));
  console.log('📋 Testing comprehensive BL document validation using MerkleTree approach');
  console.log('🎯 Goal: 100% field coverage with optimized ZK proof generation');
  console.log('');

  // Check if file argument provided
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('❌ Error: Please provide BL JSON file path');
    console.error('Usage: node BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js <path-to-bl-json>');
    console.error('Example: node BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js ./src/data/scf/BILLOFLADING/actualBL1-VALID.json');
    process.exit(1);
  }

  const filePath = args[0];
  
  // Resolve full path for BOL file based on project structure  
  const projectRoot = process.cwd();
  console.log('🏠 Project root:', projectRoot);
  
  let resolvedFilePath = filePath;
  
  // If the file is just a filename (not full path), resolve it to the correct directory
  if (!path.isAbsolute(filePath) && !filePath.includes('/') && !filePath.includes('\\')) {
    resolvedFilePath = path.join(projectRoot, 'src', 'data', 'scf', 'BILLOFLADING', filePath);
    console.log('📂 Resolved BOL file path:', resolvedFilePath);
  }
  
  console.log('');
  console.log('📋 Final file path:', resolvedFilePath);
  
  try {
    // Load and validate BL data
    console.log(`📂 Loading BL data from: ${resolvedFilePath}`);
    
    if (!fs.existsSync(resolvedFilePath)) {
      throw new Error(`File not found: ${resolvedFilePath}`);
    }
    
    const blDataRaw = fs.readFileSync(resolvedFilePath, 'utf8');
    const blData = JSON.parse(blDataRaw);
    
    console.log('✅ BL data loaded successfully');
    console.log(`📄 Document Type: ${blData.transportDocumentTypeCode || 'Unknown'}`);
    console.log(`🚢 Carrier: ${blData.carrierCode || 'Unknown'}`);
    console.log(`📋 Document Reference: ${blData.transportDocumentReference || 'Unknown'}`);
    console.log('');

    // Print test overview
    console.log('🧪 Test Overview:');
    console.log('  1. Create MerkleTree with ALL document fields');
    console.log('  2. Generate oracle signature for data integrity');
    console.log('  3. Test core compliance (24 required fields)');
    console.log('  4. Test enhanced compliance (38 total fields)');
    console.log('  5. Deploy and interact with smart contract');
    console.log('  6. Verify all business logic validations');
    console.log('');

    // Run comprehensive test
    const testResult = await BusinessStdIntegrityOptimMerkleTestUtils.runComprehensiveTest(blData);
    
    if (testResult.success) {
      console.log('\n🎉 SUCCESS: All Business Standard Merkle tests passed!');
      console.log('=' .repeat(60));
      console.log('📊 Final Results:');
      if (testResult.coreResult) {
        console.log(`   ✅ Core Compliance: ${testResult.coreResult.publicOutput.isBLCompliant.toString()}`);
      }
      if (testResult.enhancedResult) {
        console.log(`   ✅ Enhanced Compliance: ${testResult.enhancedResult.publicOutput.isBLCompliant.toString()}`);
      }
      if (testResult.contractState) {
        console.log(`   📈 Total Verifications: ${testResult.contractState.totalVerifications.toString()}`);
        console.log(`   🎯 Success Rate: ${testResult.contractState.successRate.toString()}%`);
        console.log(`   🔗 Merkle Root: ${testResult.contractState.merkleRoot.toString()}`);
      }
      console.log('');
      console.log('🌟 Key Achievements:');
      console.log('   ✅ 100% coverage of required 24 fields');
      console.log('   ✅ Enhanced validation with additional ZKRegex fields');
      console.log('   ✅ Constant circuit size regardless of total fields');
      console.log('   ✅ Selective disclosure capability');
      console.log('   ✅ Oracle-signed data integrity');
      console.log('   ✅ Smart contract integration');
      console.log('');
      console.log('🚀 Business Standard Merkle system is production-ready!');
      
    } else {
      console.log('\n❌ FAILURE: Business Standard Merkle test failed');
      console.error('Error details:', testResult.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', (error as Error).message);
    console.error('Stack trace:', (error as Error).stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Export function for direct execution from integrated server
export async function executeBSDIVerificationDirect(parameters: any): Promise<any> {
  try {
    console.log('=== BSDI DIRECT EXECUTION START ===');
    console.log('🔧 Direct BSDI Verification execution started');
    console.log('Parameters received:', JSON.stringify(parameters, null, 2));
    console.log('Execution Mode: DIRECT FUNCTION CALL (no CLI args)');
    console.log('======================================');
    
    const bolFile = parameters.filePath || 'BOL-VALID-1.json';
    
    console.log('📋 Using parameters:');
    console.log('  BOL File:', bolFile);
    console.log('');
    
    // Resolve full path for BOL file based on project structure
    const projectRoot = process.cwd();
    console.log('🏠 Project root:', projectRoot);
    
    let resolvedFilePath = bolFile;
    
    // If the file is just a filename (not full path), resolve it to the correct directory
    if (!path.isAbsolute(bolFile) && !bolFile.includes('/') && !bolFile.includes('\\')) {
      resolvedFilePath = path.join(projectRoot, 'src', 'data', 'scf', 'BILLOFLADING', bolFile);
      console.log('📂 Resolved BOL file path:', resolvedFilePath);
    }
    
    console.log('');
    console.log('📋 Final file path:', resolvedFilePath);
    console.log('');
    
    console.log('📋 Loading BOL data...');
    
    // Load and validate BL data
    if (!fs.existsSync(resolvedFilePath)) {
      throw new Error(`BOL file not found: ${resolvedFilePath}`);
    }
    
    const blDataRaw = fs.readFileSync(resolvedFilePath, 'utf8');
    const blData = JSON.parse(blDataRaw);
    
    console.log('✅ BOL data loaded successfully');
    console.log(`📄 Document Type: ${blData.transportDocumentTypeCode || 'Unknown'}`);
    console.log(`😢 Carrier: ${blData.carrierCode || 'Unknown'}`);
    console.log(`📋 Document Reference: ${blData.transportDocumentReference || 'Unknown'}`);
    console.log('');
    
    console.log('🚀 Starting Business Standard Integrity verification...');
    
    // Run comprehensive BSDI test
    const testResult = await BusinessStdIntegrityOptimMerkleTestUtils.runComprehensiveTest(blData);
    
    console.log('');
    console.log('🏆 BSDI Verification completed via direct execution');
    console.log('Result success:', testResult.success);
    console.log('=== BSDI DIRECT EXECUTION SUCCESS ===');
    
    return {
      success: testResult.success,
      result: testResult,
      executionMode: 'direct-bsdi-verification',
      timestamp: new Date().toISOString(),
      processedParameters: {
        bolFile: resolvedFilePath
      },
      documentInfo: {
        documentType: blData.transportDocumentTypeCode,
        carrier: blData.carrierCode,
        reference: blData.transportDocumentReference
      }
    };
    
  } catch (error) {
    console.error('');
    console.error('💥 Direct BSDI Verification failed:', error);
    console.error('=== BSDI DIRECT EXECUTION FAILED ===');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionMode: 'direct-bsdi-verification',
      timestamp: new Date().toISOString(),
      stackTrace: error instanceof Error ? error.stack : undefined
    };
  }
}

// Run the test only if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('\n💥 MAIN FUNCTION ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
}

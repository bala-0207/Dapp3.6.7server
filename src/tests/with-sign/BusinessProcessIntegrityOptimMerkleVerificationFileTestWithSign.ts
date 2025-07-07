import { BusinessProcessIntegrityOptimMerkleTestUtils } from './BusinessProcessIntegrityOptimMerkleVerificationFileTestWithSignUtils.js';
import parseBpmn from '../../utils/parsebpmn.js';
import path from 'path';

/**
 * Business Process Integrity OptimMerkle Verification Test (Main Entry Point)
 * 
 * This test demonstrates OptimMerkle-enhanced BPMN process verification while maintaining
 * complete backward compatibility with the existing system.
 * 
 * Key Features:
 * - Same BPMN file inputs as existing system
 * - Same ZK regex circuits (verifyProcessSCF, verifyProcessSTABLECOIN, verifyProcessDVP)
 * - Enhanced with Poseidon hashing, Merkle trees, and advanced oracle signatures
 * - Zero breaking changes to existing code
 * 
 * Usage:
 * node ./build/tests/with-sign/BusinessProcessIntegrityOptimMerkleVerificationFileTestWithSign.js 
 * SCF 
 * ./src/data/scf/process/EXPECTED/bpmn-SCF-Example-Process-Expected.bpmn
 * ./src/data/scf/process/ACTUAL/bpmn-SCF-Example-Execution-Actual-Accepted-1.bpmn
 */

// Parse command line arguments (same as existing system)
// Also support module-based execution from integrated server
let businessProcessType: string | undefined;
let expectedBPMNFileName: string | undefined;
let actualBPMNFileName: string | undefined;

// Check if arguments are provided via command line
if (process.argv.length >= 5) {
  [, , businessProcessType, expectedBPMNFileName, actualBPMNFileName] = process.argv;
} else if (process.env.BPI_PROCESS_TYPE && process.env.BPI_EXPECTED_FILE && process.env.BPI_ACTUAL_FILE) {
  // Support environment variables for integrated server
  businessProcessType = process.env.BPI_PROCESS_TYPE;
  expectedBPMNFileName = process.env.BPI_EXPECTED_FILE;
  actualBPMNFileName = process.env.BPI_ACTUAL_FILE;
}

async function main() {
  console.log('🌳 Business Process Integrity OptimMerkle Verification Test');
  console.log('=' .repeat(80));
  console.log('🎯 Enhanced BPMN verification with OptimMerkle security');
  console.log('🔄 Maintaining full backward compatibility with existing ZK regex');
  console.log('');
  
  // Validate command line arguments
  if (!businessProcessType || !expectedBPMNFileName || !actualBPMNFileName) {
    console.error('❌ Error: Missing required arguments');
    console.error('Usage: node BusinessProcessIntegrityOptimMerkleVerificationFileTestWithSign.js <PROCESS_TYPE> <EXPECTED_BPMN> <ACTUAL_BPMN>');
    console.error('Example: node BusinessProcessIntegrityOptimMerkleVerificationFileTestWithSign.js SCF expected.bpmn actual.bpmn');
    process.exit(1);
  }
  
  console.log('📂 Input Files:');
  console.log('  Expected BPMN:', expectedBPMNFileName);
  console.log('  Actual BPMN:', actualBPMNFileName);
  console.log('  Process Type:', businessProcessType);
  console.log('');
  
  try {
    // ===== STEP 1: PARSE BPMN FILES (same as existing system) =====
    console.log('📋 Parsing BPMN files...');
    
    // Resolve full paths for BPMN files based on project structure
    const projectRoot = process.cwd();
    console.log('🏠 Project root:', projectRoot);
    
    // Construct full paths to the BPMN files
    let expectedFilePath = expectedBPMNFileName;
    let actualFilePath = actualBPMNFileName;
    
    // If the files are just filenames (not full paths), resolve them to the correct directories
    if (!path.isAbsolute(expectedBPMNFileName) && !expectedBPMNFileName.includes('/') && !expectedBPMNFileName.includes('\\')) {
      expectedFilePath = path.join(projectRoot, 'src', 'data', 'scf', 'process', 'EXPECTED', expectedBPMNFileName);
      console.log('📂 Resolved expected file path:', expectedFilePath);
    }
    
    if (!path.isAbsolute(actualBPMNFileName) && !actualBPMNFileName.includes('/') && !actualBPMNFileName.includes('\\')) {
      actualFilePath = path.join(projectRoot, 'src', 'data', 'scf', 'process', 'ACTUAL', actualBPMNFileName);
      console.log('📂 Resolved actual file path:', actualFilePath);
    }
    
    console.log('');
    console.log('📋 Final file paths:');
    console.log('  Expected BPMN:', expectedFilePath);
    console.log('  Actual BPMN:', actualFilePath);
    console.log('');
    
    const expectedPath = await parseBpmn(expectedFilePath) || "";
    const actualPath = await parseBpmn(actualFilePath) || "";
    
    if (!expectedPath || !actualPath) {
      throw new Error(`Failed to parse BPMN files. Please check file paths and content.\nExpected: ${expectedFilePath}\nActual: ${actualFilePath}`);
    }
    
    console.log('✅ BPMN files parsed successfully');
    console.log('📋 Expected Pattern:', expectedPath);
    console.log('🎯 Actual Path:', actualPath);
    console.log('');
    
    // ===== STEP 2: RUN OPTIMERKLE VERIFICATION =====
    console.log('🚀 Starting OptimMerkle Enhanced Verification...');
    console.log('');
    
    const result = await BusinessProcessIntegrityOptimMerkleTestUtils.runOptimMerkleVerification(
      businessProcessType, 
      expectedPath, 
      actualPath,
      {
        expectedFile: expectedFilePath,
        actualFile: actualFilePath
      }
    );
    
    // ===== STEP 3: DISPLAY RESULTS =====
    console.log('');
    console.log('🏆 FINAL OPTIMERKLE VERIFICATION RESULTS:');
    console.log('=' .repeat(60));
    
    if (result.success) {
      console.log('🎉 SUCCESS: OptimMerkle Process Verification PASSED!');
      console.log('');
      console.log('📊 Verification Components:');
      console.log(`   🔍 ZK Regex Validation:    ${result.zkRegexResult ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   ✍️ Oracle Signature:       ${result.oracleVerified ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   🧾 Merkle Verification:    ${result.merkleVerified ? '✅ PASS' : '❌ FAIL'}`);
      console.log('');
      console.log('🔐 Cryptographic Evidence:');
      console.log(`   🌳 Merkle Root: ${result.merkleRoot?.slice(0, 40)}...`);
      console.log(`   🔐 Process Hash: ${result.processHash?.slice(0, 40)}...`);
      console.log('');
      console.log('🌟 OptimMerkle Enhancements:');
      console.log('   ✅ Poseidon hash-based data integrity');
      console.log('   ✅ Merkle tree for efficient batch verification');
      console.log('   ✅ Enhanced oracle signature verification');
      console.log('   ✅ Selective disclosure capability');
      console.log('   ✅ Full backward compatibility maintained');
      console.log('');
      console.log('🎯 Process Compliance: VERIFIED IN ZERO KNOWLEDGE');
      
    } else {
      console.log('❌ FAILURE: OptimMerkle Process Verification FAILED');
      console.error('💥 Error Details:', result.error);
      console.log('');
      console.log('🔍 Troubleshooting:');
      console.log('   • Check BPMN file paths and accessibility');
      console.log('   • Verify process type is valid (SCF, STABLECOIN, DVP)');
      console.log('   • Ensure oracle service is accessible');
      console.log('   • Check network connectivity for oracle data');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('');
    console.error('💥 CRITICAL ERROR:', (error as Error).message);
    console.error('🚨 Stack trace:', (error as Error).stack);
    console.error('');
    console.error('🔧 Please check:');
    console.error('   • File paths are correct and accessible');
    console.error('   • BPMN files are valid and properly formatted');
    console.error('   • All dependencies are installed');
    console.error('   • Network connection for oracle services');
    
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('💥 UNCAUGHT EXCEPTION:', error.message);
  console.error('🚨 Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('🚨 Reason:', reason);
  process.exit(1);
});

// Export function for direct execution from integrated server
export async function executeBPIVerificationDirect(parameters: any): Promise<any> {
  try {
    console.log('=== BPI DIRECT EXECUTION START ===');
    console.log('🔧 Direct BPI Verification execution started');
    console.log('Parameters received:', JSON.stringify(parameters, null, 2));
    console.log('Execution Mode: DIRECT FUNCTION CALL (no CLI args)');
    console.log('======================================');
    
    const processType = parameters.processType || 'SCF';
    const expectedFile = parameters.expectedProcessFile || 'SCF-Expected.bpmn';
    const actualFile = parameters.actualProcessFile || 'SCF-Accepted1.bpmn';
    
    console.log('📋 Using parameters:');
    console.log('  Process Type:', processType);
    console.log('  Expected File:', expectedFile);
    console.log('  Actual File:', actualFile);
    console.log('');
    
    // Resolve full paths for BPMN files based on project structure
    const projectRoot = process.cwd();
    console.log('🏠 Project root:', projectRoot);
    
    // Construct full paths to the BPMN files
    let expectedFilePath = expectedFile;
    let actualFilePath = actualFile;
    
    // If the files are just filenames (not full paths), resolve them to the correct directories
    if (!path.isAbsolute(expectedFile) && !expectedFile.includes('/') && !expectedFile.includes('\\')) {
      expectedFilePath = path.join(projectRoot, 'src', 'data', 'scf', 'process', 'EXPECTED', expectedFile);
      console.log('📂 Resolved expected file path:', expectedFilePath);
    }
    
    if (!path.isAbsolute(actualFile) && !actualFile.includes('/') && !actualFile.includes('\\')) {
      actualFilePath = path.join(projectRoot, 'src', 'data', 'scf', 'process', 'ACTUAL', actualFile);
      console.log('📂 Resolved actual file path:', actualFilePath);
    }
    
    console.log('');
    console.log('📋 Final file paths:');
    console.log('  Expected BPMN:', expectedFilePath);
    console.log('  Actual BPMN:', actualFilePath);
    console.log('');
    
    console.log('📋 Parsing BPMN files...');
    
    // Parse BPMN files using the resolved paths
    const expectedPath = await parseBpmn(expectedFilePath) || "";
    const actualPath = await parseBpmn(actualFilePath) || "";
    
    if (!expectedPath || !actualPath) {
      throw new Error(`Failed to parse BPMN files. Please check file paths and content.\nExpected: ${expectedFilePath}\nActual: ${actualFilePath}`);
    }
    
    console.log('✅ BPMN files parsed successfully');
    console.log('📋 Expected Pattern:', expectedPath);
    console.log('🎯 Actual Path:', actualPath);
    console.log('');
    
    console.log('🚀 Starting OptimMerkle Enhanced Verification...');
    
    // Run OptimMerkle verification
    const result = await BusinessProcessIntegrityOptimMerkleTestUtils.runOptimMerkleVerification(
      processType,
      expectedPath,
      actualPath,
      {
        expectedFile: expectedFilePath,
        actualFile: actualFilePath
      }
    );
    
    console.log('');
    console.log('🏆 BPI Verification completed via direct execution');
    console.log('Result success:', result.success);
    console.log('=== BPI DIRECT EXECUTION SUCCESS ===');
    
    return {
      success: result.success,
      result: result,
      executionMode: 'direct-bpi-verification',
      timestamp: new Date().toISOString(),
      processedParameters: {
        processType,
        expectedFile: expectedFilePath,
        actualFile: actualFilePath
      },
      parsedPaths: {
        expectedPath,
        actualPath
      }
    };
    
  } catch (error) {
    console.error('');
    console.error('💥 Direct BPI Verification failed:', error);
    console.error('=== BPI DIRECT EXECUTION FAILED ===');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionMode: 'direct-bpi-verification',
      timestamp: new Date().toISOString(),
      stackTrace: error instanceof Error ? error.stack : undefined
    };
  }
}

// Run the main function only if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('');
    console.error('💥 MAIN FUNCTION ERROR:', error.message);
    console.error('🚨 Stack trace:', error.stack);
    process.exit(1);
  });
}

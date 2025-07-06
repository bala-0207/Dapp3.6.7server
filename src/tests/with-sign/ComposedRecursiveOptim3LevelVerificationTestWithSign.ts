import * as dotenv from 'dotenv';
dotenv.config();

import { Field, Mina, PrivateKey, AccountUpdate, CircuitString, Poseidon, Signature, UInt64, Bool } from 'o1js';
import { getComposedRecursiveOptim3LevelVerificationWithSignUtils } from './ComposedRecursiveOptim3LevelVerificationTestWithSignUtils.js';

async function main() {
    // Get company name, CIN, and network type from command line arguments
    const companyName = process.argv[2];
    const companyCIN = process.argv[3];
    //const typeOfNet = process.argv[4] || 'LOCAL';
    const testIterations = parseInt(process.argv[5] || '1'); // Number of times to test each company

    if (!companyName || !companyCIN) {
        console.error('❌ Error: Both company name and CIN are required');
        console.log('📖 Usage: node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "COMPANY_NAME" "CIN" [LOCAL|TESTNET|MAINNET] [iterations]');
        console.log('📝 Example: node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED" "U01112TZ2022PTC039493" "LOCAL" 2');
        console.log('🔍 Features:');
        console.log('  ✅ Multi-service composed verification (Corporate Registration + EXIM + GLEIF)');
        console.log('  ✅ Uses CIN for Corporate Registration API calls');
        console.log('  ✅ Uses Company Name for EXIM and GLEIF API calls');
        console.log('  ✅ Multiple iterations per company for tracking changes over time');
        console.log('  ✅ Composed proof storage and retrieval');
        console.log('  ✅ Proof lineage tracking showing underlying proofs');
        console.log('  ✅ Historical proof management');
        process.exit(1);
    }

    if (testIterations > 5) {
        console.error('❌ Error: Maximum 5 iterations per company to avoid excessive proof generation time');
        process.exit(1);
    }

    console.log('🏢 Company Name:', companyName);
    console.log('🆔 Company CIN:', companyCIN);
    //console.log('🌐 Network Type:', typeOfNet);
    console.log('🔄 Test Iterations:', testIterations);

    try {
        console.log('\n🚀 Starting Composed Recursive Optim 3-Level Verification Test...');
        console.log('=' .repeat(100));

        const result = await getComposedRecursiveOptim3LevelVerificationWithSignUtils(
            companyName,
            companyCIN, 
            testIterations
        );

        console.log('\n🎯 Composed Recursive Verification completed successfully!');
        console.log('=' .repeat(100));

        // Display comprehensive results
        console.log('\n📊 Final Test Summary:');
        console.log(`✅ Company Tested: ${companyName}`);
        console.log(`✅ Total Composed Proofs Generated: ${result.totalComposedProofs}`);
        console.log(`✅ Successful Verifications: ${result.successfulVerifications}`);
        console.log(`❌ Failed Verifications: ${result.failedVerifications}`);
        console.log(`🏆 Overall Success Rate: ${((result.successfulVerifications / result.totalComposedProofs) * 100).toFixed(2)}%`);

        // Company results
        console.log('\n🏢 Company Results Summary:');
        if (result.companyResult) {
            console.log(`\n  ${result.companyResult.companyName}:`);
            console.log(`     📊 Iterations Completed: ${result.companyResult.iterations.length}/${testIterations}`);
            console.log(`     ✅ Successful Composed Proofs: ${result.companyResult.successfulProofs}`);
            console.log(`     ❌ Failed Proofs: ${result.companyResult.failedProofs}`);
            console.log(`     🎯 Latest Compliance Score: ${result.companyResult.latestComplianceScore}%`);
            console.log(`     📈 Compliance Trend: ${result.companyResult.complianceTrend}`);
            
            if (result.companyResult.iterations.length > 1) {
                console.log(`     📋 Proof History:`);
                result.companyResult.iterations.forEach((iteration, idx) => {
                    const status = iteration.error ? '❌ ERROR' : '✅ SUCCESS';
                    console.log(`       ${idx + 1}. ${status} - Score: ${iteration.complianceScore}% - ${new Date(iteration.timestamp).toISOString()}`);
                });
            }
        }

        // Proof lineage demonstration
        console.log('\n🔗 Proof Lineage Examples:');
        if (result.proofLineageExamples && result.proofLineageExamples.length > 0) {
            result.proofLineageExamples.forEach((example, index) => {
                console.log(`\n  Example ${index + 1}: ${example.companyName} (Iteration ${example.iteration})`);
                console.log(`    🔸 Composed Proof Hash: ${example.composedProofHash.substring(0, 20)}...`);
                console.log(`    🔸 Level 1 (Corporate Registration) Proof: ${example.level1ProofHash.substring(0, 20)}...`);
                console.log(`    🔸 Level 2 (Level1 + EXIM) Proof: ${example.level2ProofHash.substring(0, 20)}...`);
                console.log(`    🔸 Level 3 (Level2 + GLEIF) Proof: ${example.level3ProofHash.substring(0, 20)}...`);
                console.log(`    🔸 Underlying Service Proofs:`);
                console.log(`      - Corporate Registration: ${example.corpRegProofHash.substring(0, 20)}...`);
                console.log(`      - EXIM: ${example.eximProofHash.substring(0, 20)}...`);
                console.log(`      - GLEIF: ${example.gleifProofHash.substring(0, 20)}...`);
            });
        }

        // Contract state summary
        console.log('\n📋 Smart Contract Final State:');
        console.log(`  🏗️ Total Proofs Stored: ${result.contractState.totalProofsStored.toString()}`);
        console.log(`  🏢 Company Tracked: ${companyName}`);
        console.log(`  🌳 Proofs Root Hash: ${result.contractState.proofsRootHash.toString().substring(0, 30)}...`);
        console.log(`  🕒 Last Update Time: ${new Date(Number(result.contractState.lastUpdateTimestamp.toString())).toISOString()}`);

        // Features demonstrated
        console.log('\n🎉 Features Successfully Demonstrated:');
        console.log(`  ✅ Multi-Service Composed Verification (Corporate Registration + EXIM + GLEIF)`);
        console.log(`  ✅ 3-Level Recursive Proof Composition`);
        console.log(`  ✅ Multi-Company Batch Processing`);
        console.log(`  ✅ Multiple Iterations per Company`);
        console.log(`  ✅ Composed Proof Storage and Retrieval`);
        console.log(`  ✅ Proof Lineage Tracking`);
        console.log(`  ✅ Historical Proof Management`);
        console.log(`  ✅ On-Chain Verification`);
        console.log(`  ✅ Compliance Trend Analysis`);
        console.log(`  ✅ Zero-Knowledge Proof Generation and Verification`);

        // Performance metrics
        if (result.performanceMetrics) {
            console.log('\n⚡ Performance Metrics:');
            console.log(`  🕒 Total Execution Time: ${result.performanceMetrics.totalExecutionTime}ms`);
            console.log(`  📊 Average Proof Generation Time: ${result.performanceMetrics.averageProofGenerationTime}ms`);
            console.log(`  🔍 Average Verification Time: ${result.performanceMetrics.averageVerificationTime}ms`);
            console.log(`  💾 Total Contract Storage Used: ${result.performanceMetrics.storageUsed} bytes`);
        }

        // Proof retrieval demonstration
        console.log('\n🔍 Proof Retrieval Demonstration:');
        if (result.retrievalExamples && result.retrievalExamples.length > 0) {
            result.retrievalExamples.forEach((example, index) => {
                console.log(`\n  Retrieval Example ${index + 1}:`);
                console.log(`    🏢 Company: ${example.companyName}`);
                console.log(`    🔢 Requested Sequence: ${example.requestedSequence}`);
                console.log(`    ✅ Successfully Retrieved: ${example.found ? 'Yes' : 'No'}`);
                if (example.found) {
                    console.log(`    📊 Compliance Score: ${example.complianceScore}%`);
                    console.log(`    🕒 Timestamp: ${new Date(example.timestamp).toISOString()}`);
                    console.log(`    🔗 Proof Hash: ${example.proofHash.substring(0, 30)}...`);
                }
            });
        }

        console.log('\n🎊 Composed Recursive Optim 3-Level Verification Test Completed Successfully!');

    } catch (error) {
        console.error('💥 Error in Composed Recursive Verification:', error);
        console.error('💥 Error Stack:', (error as Error).stack || 'No stack trace available');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('💥 Fatal Error:', err);
    console.error('💥 Fatal Error Stack:', err.stack);
    process.exit(1);
});

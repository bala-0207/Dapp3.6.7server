/**
 * Enhanced GLEIF Utils Test Script
 * 
 * This script demonstrates:
 * 1. Complete JSON object printing for GLEIF API response
 * 2. ZK optimization analysis using the JSON structure groupings
 * 
 * Usage: node GLEIFCompleteAnalysis.js "Company Name" "TESTNET"
 */

const { fetchGLEIFCompanyDataWithFullDetails } = require('./GLEIFEnhancedUtils.js');

async function demonstrateCompleteJSONAnalysis() {
    const companyName = process.argv[2] || "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED";
    //const networkType = process.argv[3] || "TESTNET";

    console.log('🚀 GLEIF COMPLETE JSON ANALYSIS DEMONSTRATION');
    console.log('='.repeat(100));
    console.log(`📋 Company: ${companyName}`);
    //console.log(`🌐 Network: ${networkType}`);

    try {
        // This will print:
        // 1. Complete JSON with all attributes, relationships, and links
        // 2. Detailed analysis of each section
        // 3. ZK optimization recommendations based on the JSON structure
        const result = await fetchGLEIFCompanyDataWithFullDetails(companyName);
        
        console.log('\n🎉 ANALYSIS COMPLETE!');
        console.log('\nKey Benefits Demonstrated:');
        console.log('✅ Complete JSON visibility - all nested objects printed');
        console.log('✅ Structured grouping analysis for ZK optimization');
        console.log('✅ Field bundling recommendations based on actual API structure');
        console.log('✅ Constraint cost analysis for different verification scenarios');
        
        return result;
    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        process.exit(1);
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateCompleteJSONAnalysis();
}

module.exports = { demonstrateCompleteJSONAnalysis };

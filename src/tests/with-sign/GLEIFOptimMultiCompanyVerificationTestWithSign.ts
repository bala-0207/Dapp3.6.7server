import * as dotenv from 'dotenv';
dotenv.config();

import { getGLEIFOptimMultiCompanyVerificationWithSignUtils } from './GLEIFOptimMultiCompanyVerificationTestWithSignUtils.js';

async function main() {
    // Get company names and network type from command line arguments
    const companyNamesArg = process.argv[2];
    //const typeOfNet = process.argv[3] || 'TESTNET';
    
    if (!companyNamesArg) {
        console.error('❌ Error: Company names are required');
        console.log('📖 Usage: node GLEIFOptimMultiCompanyVerificationTestWithSign.js "COMPANY1,COMPANY2" [TESTNET|MAINNET]');
        console.log('📝 Example: node GLEIFOptimMultiCompanyVerificationTestWithSign.js "Apple Inc.,Microsoft Corporation" "TESTNET"');
        console.log('📝 Example: node GLEIFOptimMultiCompanyVerificationTestWithSign.js "DEUTSCHE BANK AKTIENGESELLSCHAFT,JPMorgan Chase & Co." "TESTNET"');
        process.exit(1);
    }
    
    // Parse company names from comma-separated string
    const companyNames = companyNamesArg.split(',').map(name => name.trim()).filter(name => name.length > 0);
    
    if (companyNames.length === 0) {
        console.error('❌ Error: At least one company name is required');
        process.exit(1);
    }
    
    if (companyNames.length > 10) {
        console.error('❌ Error: Maximum 10 companies supported in this demo');
        process.exit(1);
    }
    
    console.log('🏢 Company Names:', companyNames);
    //console.log('🌐 Network Type:', typeOfNet);
    console.log('📊 Total Companies to Process:', companyNames.length);
    
    try {
        const result = await getGLEIFOptimMultiCompanyVerificationWithSignUtils(companyNames);
        
        console.log('\n🎯 Multi-Company Verification completed successfully!');
        console.log('\n📊 Final Summary:');
        console.log(`✅ Total Companies Processed: ${result.verificationResults.length}`);
        console.log(`✅ Successful Verifications: ${result.verificationResults.filter((r: any) => !r.error).length}`);
        console.log(`❌ Failed Verifications: ${result.verificationResults.filter((r: any) => r.error).length}`);
        console.log(`🏆 Compliant Companies: ${result.verificationResults.filter((r: any) => r.isCompliant).length}`);
        console.log(`⚠️ Non-Compliant Companies: ${result.verificationResults.filter((r: any) => !r.isCompliant && !r.error).length}`);
        
        console.log('\n🏢 Company Status Details with Compliance Fields:');
        result.verificationResults.forEach((company: any, index: number) => {
            const status = company.error ? '❌ ERROR' : (company.isCompliant ? '✅ COMPLIANT' : '⚠️ NON-COMPLIANT');
            console.log(`\n  ${index + 1}. ${company.companyName}: ${status}`);
            if (!company.error) {
                console.log(`     📄 LEI: ${company.lei}`);
                console.log(`     📊 Score: ${company.complianceScore}%`);
                console.log(`     🕒 Verified: ${new Date(Number(company.verificationTime)).toISOString()}`);
                
                if (company.complianceFields) {
                    console.log(`\n     📋 GLEIF Compliance Field Values:`);
                    console.log(`       🏢 Entity Status: "${company.complianceFields.entityStatus}" ${company.businessRules?.entityActive ? '✅' : '❌'}`);
                    console.log(`       📋 Registration Status: "${company.complianceFields.registrationStatus}" ${company.businessRules?.registrationIssued ? '✅' : '❌'}`);
                    console.log(`       🔍 Conformity Flag: "${company.complianceFields.conformityFlag}" ${company.businessRules?.conformityOk ? '✅' : '❌'}`);
                    console.log(`       📅 Last Update: "${company.complianceFields.lastUpdateDate}" ${company.businessRules?.validDates ? '✅' : '❌'}`);
                    console.log(`       📅 Next Renewal: "${company.complianceFields.nextRenewalDate}" ${company.businessRules?.validDates ? '✅' : '❌'}`);
                    console.log(`       🏦 BIC Codes: "${company.complianceFields.bicCodes}"`);
                    console.log(`       📊 MIC Codes: "${company.complianceFields.micCodes}"`);
                    console.log(`       🏢 Managing LOU: "${company.complianceFields.managingLou}"`);
                    
                    if (company.businessRules) {
                        const passedRules = Object.values(company.businessRules).filter(Boolean).length;
                        console.log(`\n     🎯 Business Rules Analysis (${passedRules}/5 passed):`);
                        console.log(`       Entity Active: ${company.businessRules.entityActive ? '✅ Pass' : '❌ Fail'}`);
                        console.log(`       Registration Issued: ${company.businessRules.registrationIssued ? '✅ Pass' : '❌ Fail'}`);
                        console.log(`       Conformity OK: ${company.businessRules.conformityOk ? '✅ Pass' : '❌ Fail'}`);
                        console.log(`       Valid Dates: ${company.businessRules.validDates ? '✅ Pass' : '❌ Fail'}`);
                        console.log(`       Valid LEI: ${company.businessRules.validLEI ? '✅ Pass' : '❌ Fail'}`);
                    }
                    
                    if (company.stateChanges) {
                        console.log(`\n     📈 Smart Contract State Changes:`);
                        console.log(`       Total Companies: ${company.stateChanges.totalCompaniesBefore} → ${company.stateChanges.totalCompaniesAfter}`);
                        console.log(`       Compliant Companies: ${company.stateChanges.compliantCompaniesBefore} → ${company.stateChanges.compliantCompaniesAfter}`);
                        console.log(`       Global Compliance Score: ${company.stateChanges.globalScoreBefore}% → ${company.stateChanges.globalScoreAfter}%`);
                    }
                }
            } else {
                console.log(`     ❌ Error: ${company.error}`);
            }
        });
        
        console.log('\n🎉 Multi-Company GLEIF Verification Demo Completed Successfully!');
        console.log('📋 Features Demonstrated:');
        console.log('  ✅ Multiple company verification in single contract');
        console.log('  ✅ Global compliance statistics tracking');
        console.log('  ✅ Individual company state management');
        console.log('  ✅ Merkle tree-based company registry');
        console.log('  ✅ Aggregate compliance scoring');
        console.log('  ✅ Real-time GLEIF API integration');
        console.log('  ✅ Zero-knowledge proof generation and verification');
        console.log('  ✅ Smart contract state updates');
        
        // Uncomment the line below if you want to see the full proof JSONs
        // console.log('📄 Generated Proofs:', result.proofs.map(p => p.toJSON()));
        
    } catch (error) {
        console.error('💥 Error:', error);
        console.error('💥 Error Stack:', (error as Error).stack || 'No stack trace available');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('💥 Fatal Error:', err);
    console.error('💥 Fatal Error Stack:', err.stack);
    process.exit(1);
});

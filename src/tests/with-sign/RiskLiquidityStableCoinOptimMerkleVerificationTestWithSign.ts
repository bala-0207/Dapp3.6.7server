/**
 * ====================================================================
 * Risk Liquidity StableCoin OptimMerkle Verification Test
 * ====================================================================
 * End-to-end verification test for StableCoin Proof of Reserves scenario
 * Follows modular pattern: API → data prep → signature → witnesses → ZK → contract
 * ====================================================================
 */

import { Field, Mina, PrivateKey, AccountUpdate, CircuitString, Poseidon, Signature, UInt64 } from 'o1js';
import { getPrivateKeyFor } from '../../core/OracleRegistry.js';
import { 
    fetchRiskLiquidityStableCoinOptimMerkleData,
    processStableCoinRiskData,
    buildStableCoinRiskMerkleStructure,
    calculateStableCoinRiskMetrics,
    validateStableCoinRiskData,
    generateStableCoinRiskSummary
} from '../../utils/RiskLiquidityStableCoinOptimMerkleUtils.js';
import { loadContractPortfolio } from '../../utils/ACTUSOptimMerkleAPI.js';
import {
    RiskLiquidityStableCoinOptimMerkleZKProgramWithSign,
    createStableCoinRiskComplianceData,
    validateStableCoinRiskComplianceData
} from '../../zk-programs/with-sign/RiskLiquidityStableCoinOptimMerkleZKProgramWithSign.js';
import { RiskLiquidityStableCoinOptimMerkleSmartContract } from '../../contracts/with-sign/RiskLiquidityStableCoinOptimMerkleSmartContract.js';

// =================================== Main Verification Function ===================================

export async function executeRiskLiquidityStableCoinOptimMerkleVerification(
    backingRatioThreshold: number = 100,
    liquidityRatioThreshold: number = 20,
    concentrationLimit: number = 25,
    qualityThreshold: number = 80,
    actusUrl: string = 'http://localhost:8083/eventsBatch',
    contractPortfolio?: string | any[],
    regulatoryFramework?: string,
    jurisdictionOverride?: string  // NEW: CLI jurisdiction parameter
): Promise<{
    success: boolean;
    proof: any;
    contractStatus: {
        beforeVerification: number;
        afterVerification: number;
    };
    riskMetrics: any;
    summary: string;
}> {
    console.log('🚀 Starting StableCoin Proof of Reserves OptimMerkle Verification...');
    
    try {
        // =================================== Step 1: Setup Blockchain Environment ===================================
        console.log('📋 Setting up blockchain environment...');
        
        const useProof = false; // Set to true for production
        const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
        Mina.setActiveInstance(Local);

        const deployerAccount = Local.testAccounts[0];
        const deployerKey = deployerAccount.key;
        const senderAccount = Local.testAccounts[1];
        const senderKey = senderAccount.key;

        // =================================== Step 2: Compile ZK Program and Smart Contract ===================================
        console.log('🔧 Compiling ZK program and smart contract...');
        
        await RiskLiquidityStableCoinOptimMerkleZKProgramWithSign.compile();
        const { verificationKey } = await RiskLiquidityStableCoinOptimMerkleSmartContract.compile();
        
        console.log('✅ Compilation successful');

        // =================================== Step 3: Deploy Smart Contract ===================================
        console.log('📦 Deploying smart contract...');
        
        const zkAppKey = PrivateKey.random();
        const zkAppAddress = zkAppKey.toPublicKey();
        const zkApp = new RiskLiquidityStableCoinOptimMerkleSmartContract(zkAppAddress);

        const deployTxn = await Mina.transaction(deployerAccount, async () => {
            AccountUpdate.fundNewAccount(deployerAccount);
            await zkApp.deploy({ verificationKey });
        });
        
        await deployTxn.sign([deployerKey, zkAppKey]).send();
        console.log('✅ Smart contract deployed');

        // Get initial contract status (should be 100)
        const initialStatus = zkApp.riskComplianceStatus.get().toBigInt();
        console.log(`📊 Initial contract status: ${initialStatus}`);

        // =================================== Step 4: Fetch and Process ACTUS Data ===================================
        console.log('🌐 Fetching ACTUS data for StableCoin scenario...');
        
        const actusResponse = await fetchRiskLiquidityStableCoinOptimMerkleData(actusUrl, contractPortfolio);
        
        // Load contracts for balance sheet analysis
        const contracts = Array.isArray(contractPortfolio) ? contractPortfolio : await loadContractPortfolio(contractPortfolio);
        
        // SIMPLIFIED: Use explicit jurisdiction parameter (no fallbacks)
        if (!jurisdictionOverride) {
            throw new Error('Jurisdiction parameter is required. Use: US or EU');
        }
        
        const finalJurisdiction = jurisdictionOverride;
        console.log(`\n🏛️ JURISDICTION: ${finalJurisdiction}`);
        
        const stableCoinRiskData = await processStableCoinRiskData(
            actusResponse,
            contracts, // Pass contracts for principal-based analysis
            backingRatioThreshold,
            liquidityRatioThreshold,
            concentrationLimit,
            qualityThreshold,
            1000000, // outstandingTokensAmount (will be overridden by actual liability amounts)
            1.0,     // tokenValue
            10,      // liquidityThreshold
            5000,    // newInvoiceAmount
            11,      // newInvoiceEvaluationMonth
            finalJurisdiction // Pass final jurisdiction for compliance validation
        );
        
        // 🚨 CRITICAL: Extract regulatory compliance data for ZK program validation
        const { validateRegulatoryCompliance } = await import('../../utils/ConfigurableRegulatoryFrameworks.js');
        const regulatoryComplianceResult = await validateRegulatoryCompliance(contracts, finalJurisdiction);
        
        console.log(`\n🏦 REGULATORY COMPLIANCE ASSESSMENT:`);
        console.log(`   Jurisdiction: ${regulatoryComplianceResult.jurisdiction}`);
        console.log(`   Overall Score: ${regulatoryComplianceResult.overallScore}%`);
        console.log(`   Threshold: ${regulatoryComplianceResult.complianceThreshold}%`);
        console.log(`   Status: ${regulatoryComplianceResult.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
        if (regulatoryComplianceResult.violations.length > 0) {
            console.log(`   🚨 Violations:`);
            regulatoryComplianceResult.violations.forEach(violation => {
                console.log(`      - ${violation}`);
            });
        }
        console.log(`   Details: ${regulatoryComplianceResult.details}`);
        
        // 🚨 IMPORTANT: If regulatory compliance fails, the ZK proof SHOULD fail
        if (!regulatoryComplianceResult.compliant) {
            console.log(`\n⚠️  WARNING: This portfolio fails regulatory compliance!`);
            console.log(`   The ZK program will now reject this portfolio due to regulatory violations.`);
            console.log(`   Expected result: ZK proof generation should FAIL.`);
        } else {
            console.log(`\n✅ Portfolio meets all regulatory requirements.`);
            console.log(`   The ZK program should accept this portfolio.`);
            console.log(`   Expected result: ZK proof generation should SUCCEED.`);
        }
        
        console.log(`📈 Processed ${stableCoinRiskData.periodsCount} periods with reserve categorization`);

        // =================================== Step 5: Calculate StableCoin Risk Metrics ===================================
        console.log('📊 Calculating StableCoin reserve metrics...');
        
        const riskMetrics = calculateStableCoinRiskMetrics(stableCoinRiskData);
        validateStableCoinRiskData(stableCoinRiskData);
        
        console.log(`🪙 Average Backing Ratio: ${riskMetrics.averageBackingRatio.toFixed(2)}%`);
        console.log(`💧 Average Liquidity Ratio: ${riskMetrics.averageLiquidityRatio.toFixed(2)}%`);
        console.log(`🎯 Max Concentration Risk: ${riskMetrics.maxConcentrationRisk.toFixed(2)}%`);
        console.log(`⭐ Average Asset Quality: ${riskMetrics.averageAssetQuality.toFixed(2)}`);
        console.log(`✅ Backing Compliance: ${riskMetrics.backingCompliant ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Liquidity Compliance: ${riskMetrics.liquidityCompliant ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Concentration Compliance: ${riskMetrics.concentrationCompliant ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Quality Compliance: ${riskMetrics.qualityCompliant ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Overall StableCoin Compliance: ${riskMetrics.overallCompliant ? 'PASSED' : 'FAILED'}`);

        // =================================== Step 6: Create ZK Compliance Data ===================================
        console.log('📋 Creating ZK compliance data structure...');
        
        // Calculate aggregated totals for StableCoin
        const reserveComponents = {
            cashReservesTotal: stableCoinRiskData.cashReserves.reduce((sum, val) => sum + val, 0),
            treasuryReservesTotal: stableCoinRiskData.treasuryReserves.reduce((sum, val) => sum + val, 0),
            corporateReservesTotal: stableCoinRiskData.corporateReserves.reduce((sum, val) => sum + val, 0),
            otherReservesTotal: stableCoinRiskData.otherReserves.reduce((sum, val) => sum + val, 0)
        };
        
        const tokenInfo = {
            outstandingTokensTotal: stableCoinRiskData.outstandingTokens.reduce((sum, val) => sum + val, 0),
            tokenValue: stableCoinRiskData.tokenValue
        };
        
        const qualityMetrics = {
            averageLiquidityScore: stableCoinRiskData.liquidityScores.reduce((sum, val) => sum + val, 0) / stableCoinRiskData.liquidityScores.length,
            averageCreditRating: stableCoinRiskData.creditRatings.reduce((sum, val) => sum + val, 0) / stableCoinRiskData.creditRatings.length,
            averageMaturity: stableCoinRiskData.maturityProfiles.reduce((sum, val) => sum + val, 0) / stableCoinRiskData.maturityProfiles.length,
            assetQualityScore: riskMetrics.averageAssetQuality
        };
        
        const thresholds = {
            backingRatioThreshold: stableCoinRiskData.backingRatioThreshold,
            liquidityRatioThreshold: stableCoinRiskData.liquidityRatioThreshold,
            concentrationLimit: stableCoinRiskData.concentrationLimit,
            qualityThreshold: stableCoinRiskData.qualityThreshold
        };
        
        const additionalParams = {
            periodsCount: stableCoinRiskData.periodsCount,
            liquidityThreshold: stableCoinRiskData.liquidityThreshold,
            newInvoiceAmount: stableCoinRiskData.newInvoiceAmount,
            newInvoiceEvaluationMonth: stableCoinRiskData.newInvoiceEvaluationMonth
        };
        
        const calculatedMetrics = {
            backingRatio: riskMetrics.averageBackingRatio,
            liquidityRatio: riskMetrics.averageLiquidityRatio,
            concentrationRisk: riskMetrics.maxConcentrationRisk,
            backingCompliant: riskMetrics.backingCompliant,
            liquidityCompliant: riskMetrics.liquidityCompliant,
            concentrationCompliant: riskMetrics.concentrationCompliant,
            qualityCompliant: riskMetrics.qualityCompliant,
            stableCoinCompliant: riskMetrics.overallCompliant
        };

        // =================================== Step 7: Build Merkle Tree Structure ===================================
        console.log('🌳 Building Merkle tree structure...');
        
        // ✅ ZK-COMPLIANT: Pass the same aggregated totals to tree builder and ZK program
        const merkleStructure = buildStableCoinRiskMerkleStructure(stableCoinRiskData, {
            cashReservesTotal: reserveComponents.cashReservesTotal,
            treasuryReservesTotal: reserveComponents.treasuryReservesTotal,
            corporateReservesTotal: reserveComponents.corporateReservesTotal,
            otherReservesTotal: reserveComponents.otherReservesTotal,
            outstandingTokensTotal: tokenInfo.outstandingTokensTotal,
            averageLiquidityScore: qualityMetrics.averageLiquidityScore,
            averageCreditRating: qualityMetrics.averageCreditRating,
            averageMaturity: qualityMetrics.averageMaturity,
            assetQualityScore: qualityMetrics.assetQualityScore
        });
        const merkleRoot = merkleStructure.merkleRoot;
        
        console.log(`🔐 Merkle root: ${merkleRoot.toString()}`);

        // =================================== Step 8: Create Oracle Signature ===================================
        console.log('🔑 Creating oracle signature...');
        
        const registryPrivateKey = getPrivateKeyFor('RISK');
        const oracleSignature = Signature.create(registryPrivateKey, [merkleRoot]);
        
        console.log('✅ Oracle signature created');

        // =================================== Step 9: Create ZK Compliance Data Structure ===================================
        console.log('📋 Creating ZK compliance data structure...');
        
        const zkComplianceData = createStableCoinRiskComplianceData(
            stableCoinRiskData.companyID,
            stableCoinRiskData.companyName,
            reserveComponents,
            tokenInfo,
            qualityMetrics,
            thresholds,
            additionalParams,
            merkleRoot,
            calculatedMetrics,
            // 🚨 NEW: Pass regulatory compliance data to ZK program
            {
                jurisdiction: regulatoryComplianceResult.jurisdiction,
                score: regulatoryComplianceResult.overallScore,
                threshold: regulatoryComplianceResult.complianceThreshold,
                compliant: regulatoryComplianceResult.compliant
            },
            Date.now() // ✅ FIXED: Pass current timestamp as parameter
        );
        
        validateStableCoinRiskComplianceData(zkComplianceData);
        console.log('✅ ZK compliance data structure created and validated');

        // =================================== Step 10: Generate ZK Proof ===================================
        console.log('🔒 Generating ZK proof...');
        
        const currentTimestamp = UInt64.from(Date.now());
        const proof = await RiskLiquidityStableCoinOptimMerkleZKProgramWithSign.proveStableCoinRiskCompliance(
            currentTimestamp,
            zkComplianceData,
            oracleSignature,
            merkleStructure.witnesses.companyInfo,
            merkleStructure.witnesses.reserves,
            merkleStructure.witnesses.tokens,
            merkleStructure.witnesses.qualityMetrics,
            merkleStructure.witnesses.thresholds
        );
        
        console.log('✅ ZK proof generated successfully');
        console.log(`📊 Proof public output - StableCoin Compliant: ${proof.publicOutput.stableCoinCompliant.toBoolean()}`);
        console.log(`📊 Proof public output - Regulatory Compliant: ${proof.publicOutput.regulatoryCompliant.toBoolean()}`);
        console.log(`📊 Proof public output - Regulatory Score: ${proof.publicOutput.regulatoryScore.toString()}`);
        console.log(`📊 Proof public output - Backing Ratio: ${proof.publicOutput.backingRatio.toString()}`);
        console.log(`📊 Proof public output - Liquidity Ratio: ${proof.publicOutput.liquidityRatio.toString()}`);
        console.log(`📊 Proof public output - Concentration Risk: ${proof.publicOutput.concentrationRisk.toString()}`);
        console.log(`📊 Proof public output - Asset Quality Score: ${proof.publicOutput.assetQualityScore.toString()}`);

        // =================================== Step 11: Verify Proof with Smart Contract ===================================
        console.log('📋 Verifying proof with smart contract...');
        
        const verificationTxn = await Mina.transaction(senderAccount, async () => {
            await zkApp.verifyStableCoinRiskComplianceWithProof(proof);
        });
        
        const proofTxn = await verificationTxn.prove();
        await verificationTxn.sign([senderKey]).send();
        
        console.log('✅ Proof verified by smart contract');

        // =================================== Step 12: Check Final Contract Status ===================================
        const finalStatus = zkApp.riskComplianceStatus.get().toBigInt();
        const totalVerifications = zkApp.totalVerifications.get().toBigInt();
        
        console.log(`📊 Final contract status: ${finalStatus}`);
        console.log(`🔢 Total verifications: ${totalVerifications}`);

        // =================================== Step 13: Generate Summary Report ===================================
        const summary = generateStableCoinRiskSummary(stableCoinRiskData, riskMetrics);
        console.log('\n' + summary);

        // =================================== Return Results ===================================
        return {
            success: true,
            proof: proof,
            contractStatus: {
                beforeVerification: Number(initialStatus),
                afterVerification: Number(finalStatus)
            },
            riskMetrics: riskMetrics,
            summary: summary
        };
        
    } catch (error) {
        console.error('❌ StableCoin Risk verification failed:', error);
        return {
            success: false,
            proof: null,
            contractStatus: {
                beforeVerification: 100,
                afterVerification: 100
            },
            riskMetrics: null,
            summary: `Verification failed: ${error}`
        };
    }
}

// =================================== CLI Entry Point ===================================

// =================================== Load Jurisdiction Thresholds ===================================
async function loadJurisdictionThresholds(jurisdiction: string) {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // Navigate from build/tests/with-sign/ to src/data/RISK/StableCoin/SETTINGS/
        const settingsPath = path.join(
            __dirname, 
            '../../../src/data/RISK/StableCoin/SETTINGS',
            `${jurisdiction}-Professional-Thresholds.json`
        );
        
        console.log(`📊 Loading thresholds from: ${settingsPath}`);
        const thresholds = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        console.log(`✅ Loaded ${jurisdiction} professional thresholds`);
        
        return thresholds.operationalThresholds;
    } catch (error) {
        console.error(`❌ Error loading thresholds for ${jurisdiction}:`, error);
        throw new Error(`Failed to load thresholds for jurisdiction: ${jurisdiction}`);
    }
}

async function main() {
    // Enhanced argument parsing with jurisdiction support
    const initialStatus = parseFloat(process.argv[2]) || 100;
    const actusUrl = process.argv[3] || 'http://localhost:8083/eventsBatch';
    const portfolioPath = process.argv[4]; // Portfolio file path
    const executionMode = process.argv[5] || 'ultra_strict'; // Execution mode
    const jurisdictionCLI = process.argv[6]; // NEW: Jurisdiction parameter (US/EU)
    
    // Jurisdiction parameter is now REQUIRED
    if (!jurisdictionCLI) {
        console.error(`❌ Error: Jurisdiction parameter is required!`);
        console.log('\n📖 Usage: node test.js <threshold> <url> <config> <mode> <jurisdiction>');
        console.log('   jurisdiction: US or EU (REQUIRED)');
        console.log('   Examples:');
        console.log('     node test.js 100 http://api.url config.json ultra_strict US');
        console.log('     node test.js 100 http://api.url config.json ultra_strict EU');
        process.exit(1);
    }
    
    // Validate jurisdiction parameter
    if (!['US', 'EU'].includes(jurisdictionCLI.toUpperCase())) {
        console.error(`❌ Error: Invalid jurisdiction '${jurisdictionCLI}'. Must be 'US' or 'EU'.`);
        process.exit(1);
    }
    
    // Load jurisdiction-specific thresholds from SETTINGS directory
    const jurisdictionThresholds = await loadJurisdictionThresholds(jurisdictionCLI.toUpperCase());
    
    // Set stablecoin-specific thresholds from SETTINGS files (NO HARDCODING)
    const backingRatioThreshold = jurisdictionThresholds.backingRatioThreshold;
    const liquidityRatioThreshold = jurisdictionThresholds.liquidityRatioThreshold;
    const concentrationLimit = jurisdictionThresholds.concentrationLimit; // Will be overridden by config if present
    const qualityThreshold = jurisdictionThresholds.qualityThreshold;
    
    // Load portfolio configuration if provided as file path
    let finalContractPortfolio = undefined;
    let configConcentrationLimit = 25; // Default concentration limit
    
    if (portfolioPath && portfolioPath.endsWith('.json')) {
        console.log(`📁 Loading portfolio configuration from: ${portfolioPath}`);
        const fs = await import('fs');
        const loadedConfig = JSON.parse(fs.readFileSync(portfolioPath, 'utf8'));
        console.log(`✅ Portfolio loaded: ${loadedConfig.portfolioMetadata?.portfolioId || 'Unknown'}`);
        
        // Extract contracts from the configuration file
        finalContractPortfolio = loadedConfig.contracts || loadedConfig;
        
        // Read concentration limit from config if available
        if (loadedConfig.portfolioMetadata?.complianceTarget?.concentrationLimit) {
            configConcentrationLimit = loadedConfig.portfolioMetadata.complianceTarget.concentrationLimit;
            console.log(`📊 Using concentration limit from config: ${configConcentrationLimit}%`);
        }
        
        console.log(`✅ Extracted ${finalContractPortfolio?.length || 0} contracts from configuration`);
        // Debug: Show loaded contract details
        console.log(`🔍 LOADED CONTRACTS DEBUG:`);
        finalContractPortfolio?.forEach((contract: any, index: number) => {
            console.log(`   Contract ${contract.contractID || index}: ${contract.contractType} - ${contract.notionalPrincipal} ${contract.currency}`);
        });
    }
    
    // Use concentration limit from config file if available, otherwise use jurisdiction threshold
    const finalConcentrationLimit = configConcentrationLimit !== 25 ? configConcentrationLimit : concentrationLimit;
    
    console.log(`🎯 StableCoin Backing Ratio Threshold: ${backingRatioThreshold}%`);
    console.log(`🎯 StableCoin Liquidity Ratio Threshold: ${liquidityRatioThreshold}%`);
    console.log(`🎯 StableCoin Concentration Limit: ${finalConcentrationLimit}%`);
    console.log(`🎯 StableCoin Quality Threshold: ${qualityThreshold}`);
    console.log(`🌐 ACTUS API URL: ${actusUrl}`);
    if (portfolioPath) {
        console.log(`📁 Portfolio Path: ${portfolioPath}`);
    }
    console.log(`🚀 Execution Mode: ${executionMode}`);
    console.log(`🏛️ Jurisdiction: ${jurisdictionCLI}`);
    
    const result = await executeRiskLiquidityStableCoinOptimMerkleVerification(
        backingRatioThreshold,
        liquidityRatioThreshold,
        finalConcentrationLimit,
        qualityThreshold,
        actusUrl,
        finalContractPortfolio,
        undefined, // No longer using regulatoryFramework from config
        jurisdictionCLI?.toUpperCase()  // Pass CLI jurisdiction parameter (normalized)
    );
    
    if (result.success) {
        console.log('\n🎉 StableCoin Risk verification completed successfully!');
        console.log(`📊 Status Change: ${result.contractStatus.beforeVerification} → ${result.contractStatus.afterVerification}`);
        
        if (result.contractStatus.afterVerification === 90) {
            console.log('✅ STABLECOIN COMPLIANCE ACHIEVED - Contract status changed to 90');
        } else {
            console.log('❌ STABLECOIN COMPLIANCE NOT ACHIEVED - Contract status remains at 100');
        }
    } else {
        console.log('\n❌ StableCoin Risk verification failed');
        process.exit(1);
    }
}

// Run the main function
main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});

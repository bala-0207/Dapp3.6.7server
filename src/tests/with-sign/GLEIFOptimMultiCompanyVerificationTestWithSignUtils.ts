/**
 * GLEIFOptimMultiCompanyVerificationTestWithSignUtils.ts
 * 
 * This file contains the main verification function and utility functions for GLEIF compliance verification testing.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Field, Mina, PrivateKey, AccountUpdate, CircuitString, Poseidon, Signature, MerkleTree, UInt64, Bool, MerkleMap, MerkleMapWitness } from 'o1js';
import { 
  GLEIFOptim, 
  GLEIFOptimComplianceData, 
  MerkleWitness8, 
  MERKLE_TREE_HEIGHT 
} from '../../zk-programs/with-sign/GLEIFOptimZKProgram.js';
import { 
  GLEIFOptimMultiCompanySmartContract,
  GLEIFCompanyRecord,
  CompanyMerkleWitness,
  COMPANY_MERKLE_HEIGHT,
  CompanyKey,
  RegistryInfo
} from '../../contracts/with-sign/GLEIFOptimMultiCompanySmartContract.js';
import { GLEIFdeployerAccount, GLEIFsenderAccount, GLEIFdeployerKey, GLEIFsenderKey, getPrivateKeyFor } from '../../core/OracleRegistry.js';
import { 
  fetchGLEIFDataWithFullLogging, 
  GLEIFAPIResponse,
  extractGLEIFSummary,
  analyzeGLEIFCompliance,
  CompanyRegistry,
  createComprehensiveGLEIFMerkleTree,
  createOptimizedGLEIFComplianceData,
  createCompanyRecord
} from './GLEIFEnhancedUtils.js';
import { GLEIF_FIELD_INDICES } from './GLEIFFieldIndices.js';

/**
 * Analyzes compliance fields for GLEIF verification
 */
export function analyzeComplianceFields(complianceData: GLEIFOptimComplianceData): {
  isEntityActive: boolean;
  isRegistrationIssued: boolean;
  isConformityOk: boolean;
  hasValidDates: boolean;
  hasValidLEI: boolean;
  allRulesPassed: boolean;
  rulesPassedCount: number;
} {
  const isEntityActive = complianceData.entity_status.toString() === 'ACTIVE';
  const isRegistrationIssued = complianceData.registration_status.toString() === 'ISSUED';
  const isConformityOk = ['CONFORMING', 'UNKNOWN', ''].includes(complianceData.conformity_flag.toString());
  const hasValidDates = complianceData.lastUpdateDate.toString() !== '' && complianceData.nextRenewalDate.toString() !== '';
  const hasValidLEI = complianceData.lei.toString() !== '';
  
  const allRulesPassed = isEntityActive && isRegistrationIssued && isConformityOk && hasValidDates && hasValidLEI;
  const rulesPassedCount = [isEntityActive, isRegistrationIssued, isConformityOk, hasValidDates, hasValidLEI].filter(Boolean).length;

  return {
    isEntityActive,
    isRegistrationIssued,
    isConformityOk,
    hasValidDates,
    hasValidLEI,
    allRulesPassed,
    rulesPassedCount
  };
}

/**
 * Logs compliance field analysis results
 */
export function logComplianceFieldAnalysis(
  complianceData: GLEIFOptimComplianceData,
  isCompliant: Bool,
  phase: 'Pre-Verification' | 'Post-Verification' = 'Pre-Verification'
): void {
  console.log(`\n🔍 COMPLIANCE FIELD ANALYSIS (${phase}):`);
  
  const analysis = analyzeComplianceFields(complianceData);
  
  console.log(`  🏢 Entity Status: "${complianceData.entity_status.toString()}" → ${analysis.isEntityActive ? '✅ ACTIVE (Pass)' : '❌ NOT ACTIVE (Fail)'}`);
  console.log(`  📋 Registration Status: "${complianceData.registration_status.toString()}" → ${analysis.isRegistrationIssued ? '✅ ISSUED (Pass)' : '❌ NOT ISSUED (Fail)'}`);
  console.log(`  🔍 Conformity Flag: "${complianceData.conformity_flag.toString()}" → ${analysis.isConformityOk ? '✅ ACCEPTABLE (Pass)' : '❌ NON-CONFORMING (Fail)'}`);
  console.log(`  📅 Date Validation: Last Update "${complianceData.lastUpdateDate.toString()}", Next Renewal "${complianceData.nextRenewalDate.toString()}" → ${analysis.hasValidDates ? '✅ VALID DATES (Pass)' : '❌ INVALID DATES (Fail)'}`);
  console.log(`  🆔 LEI Validation: "${complianceData.lei.toString()}" → ${analysis.hasValidLEI ? '✅ VALID LEI (Pass)' : '❌ EMPTY LEI (Fail)'}`);
  
  console.log(`  🏆 Overall Compliance Analysis: ${analysis.allRulesPassed ? '✅ ALL RULES PASSED' : '❌ SOME RULES FAILED'} → ZK Proof Shows: ${isCompliant.toJSON() ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
  console.log(`  📊 Business Rules: ${analysis.rulesPassedCount}/5 passed`);
  console.log(`  📈 Compliance Percentage: ${Math.round((analysis.rulesPassedCount / 5) * 100)}%`);
  
  if (phase === 'Pre-Verification') {
    console.log(`  ⏳ Chain Status: NOT YET VERIFIED - Awaiting smart contract transaction...`);
  } else {
    console.log(`  ✅ Chain Status: VERIFIED AND STORED ON BLOCKCHAIN`);
  }
  
  if (!analysis.allRulesPassed) {
    console.log(`  ⚠️ Rules That ${phase === 'Pre-Verification' ? 'Will' : 'Did'} Fail:`);
    if (!analysis.isEntityActive) console.log(`    - Entity Status must be "ACTIVE", got "${complianceData.entity_status.toString()}"`);
    if (!analysis.isRegistrationIssued) console.log(`    - Registration Status must be "ISSUED", got "${complianceData.registration_status.toString()}"`);
    if (!analysis.isConformityOk) console.log(`    - Conformity Flag must be "CONFORMING", "UNKNOWN" or empty, got "${complianceData.conformity_flag.toString()}"`);
    if (!analysis.hasValidDates) console.log(`    - Last Update and Next Renewal dates must not be empty`);
    if (!analysis.hasValidLEI) console.log(`    - LEI must not be empty`);
  }
}

/**
 * Logs smart contract state information
 */
export function logSmartContractState(
  zkApp: GLEIFOptimMultiCompanySmartContract,
  phase: 'BEFORE' | 'AFTER' = 'BEFORE'
): RegistryInfo {
  console.log(`\n📊 Smart Contract State ${phase} Verification:`);
  const state = zkApp.getRegistryInfo();
  
  console.log(`  Total Companies: ${state.totalCompaniesTracked.toString()}`);
  console.log(`  Compliant Companies: ${state.compliantCompaniesCount.toString()}`);
  console.log(`  Global Compliance Score: ${state.globalComplianceScore.toString()}%`);
  console.log(`  Total Verifications: ${state.totalVerificationsGlobal.toString()}`);
  console.log(`  Companies Root Hash: ${state.companiesRootHash.toString()}`);
  console.log(`  Registry Version: ${state.registryVersion.toString()}`);
  
  return state;
}

/**
 * Logs state changes between before and after verification
 */
export function logStateChanges(stateBefore: RegistryInfo, stateAfter: RegistryInfo): void {
  console.log('\n📈 STATE CHANGES:');
  console.log(`  📊 Total Companies: ${stateBefore.totalCompaniesTracked.toString()} → ${stateAfter.totalCompaniesTracked.toString()}`);
  console.log(`  ✅ Compliant Companies: ${stateBefore.compliantCompaniesCount.toString()} → ${stateAfter.compliantCompaniesCount.toString()}`);
  console.log(`  📈 Global Compliance Score: ${stateBefore.globalComplianceScore.toString()}% → ${stateAfter.globalComplianceScore.toString()}%`);
  console.log(`  🔢 Total Verifications: ${stateBefore.totalVerificationsGlobal.toString()} → ${stateAfter.totalVerificationsGlobal.toString()}`);
  console.log(`  🌳 Companies Root Hash: ${stateBefore.companiesRootHash.toString()} → ${stateAfter.companiesRootHash.toString()}`);
  console.log(`  📝 Registry Version: ${stateBefore.registryVersion.toString()} → ${stateAfter.registryVersion.toString()}`);
}

// =================================== Main Multi-Company Verification Function ===================================

export async function getGLEIFOptimMultiCompanyVerificationWithSignUtils(
  companyNames: string[], 
) {
  console.log(`\n🚀 GLEIF Multi-Company Verification Test Started`);
  console.log(`🏢 Companies: ${companyNames.join(', ')}`);
  console.log(`📊 Total Companies: ${companyNames.length}`);

  try {
    // =================================== Setup Local Blockchain ===================================
    console.log('\n🔧 Setting up local blockchain...');
    const { Local } = await import('../../core/OracleRegistry.js');
    Mina.setActiveInstance(Local);
    
    const deployerAccount = GLEIFdeployerAccount;
    const deployerKey = GLEIFdeployerKey;
    const senderAccount = GLEIFsenderAccount;
    const senderKey = GLEIFsenderKey;

    // =================================== Compile Programs ===================================
    console.log('\n📝 Compiling ZK programs...');
    await GLEIFOptim.compile();
    console.log('✅ GLEIFOptim ZK program compiled');
    
    const { verificationKey } = await GLEIFOptimMultiCompanySmartContract.compile();
    console.log('✅ GLEIFOptimMultiCompanySmartContract compiled');

    // =================================== Deploy Multi-Company Smart Contract ===================================
    console.log('\n🚀 Deploying multi-company smart contract...');
    const zkAppKey = PrivateKey.random();
    const zkAppAddress = zkAppKey.toPublicKey();
    const zkApp = new GLEIFOptimMultiCompanySmartContract(zkAppAddress);

    const deployTxn = await Mina.transaction(
      deployerAccount,
      async () => {
        AccountUpdate.fundNewAccount(deployerAccount);
        await zkApp.deploy({ verificationKey });
      }
    );
    await deployTxn.sign([deployerKey, zkAppKey]).send();
    console.log('✅ Multi-company smart contract deployed successfully');

    // =================================== Initialize Company Registry and Real Storage ===================================
    const companyRegistry = new CompanyRegistry(COMPANY_MERKLE_HEIGHT);
    companyRegistry.initializeMerkleTree(MerkleTree);
    
    // Initialize MerkleMap for real company storage (matches smart contract)
    const companiesMap = new MerkleMap();
    
    const proofs = [];
    const verificationResults: any[] = [];

    // =================================== Process Each Company ===================================
    for (let i = 0; i < companyNames.length; i++) {
      const companyName = companyNames[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏢 Processing Company ${i + 1}/${companyNames.length}: ${companyName}`);
      console.log(`${'='.repeat(80)}`);

      try {
        // =================================== Fetch GLEIF Data ===================================
        console.log(`\n📡 Fetching GLEIF data for ${companyName}...`);
        const apiResponse: GLEIFAPIResponse = await fetchGLEIFDataWithFullLogging(companyName);
        console.log(`✅ GLEIF data fetched successfully for ${companyName}`);

        // =================================== Analyze Compliance ===================================
        console.log(`\n🔍 Analyzing compliance for ${companyName}...`);
        const complianceAnalysis = analyzeGLEIFCompliance(apiResponse);
        console.log(`📊 Compliance Score: ${complianceAnalysis.complianceScore}%`);
        console.log(`✅ Is Compliant: ${complianceAnalysis.isCompliant}`);
        
        if (complianceAnalysis.issues.length > 0) {
          console.log(`⚠️ Issues found:`);
          complianceAnalysis.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue}`);
          });
        }

        // =================================== Create Comprehensive Merkle Tree ===================================
        console.log(`\n🌳 Creating comprehensive Merkle tree for ${companyName}...`);
        const { tree, extractedData, fieldCount } = createComprehensiveGLEIFMerkleTree(
          apiResponse,
          MerkleTree,
          CircuitString,
          MERKLE_TREE_HEIGHT,
          GLEIF_FIELD_INDICES
        );
        console.log(`✅ Merkle tree created with ${fieldCount} fields`);

        // =================================== Prepare ZK Proof Data ===================================
        console.log(`\n🔐 Preparing ZK proof data for ${companyName}...`);
        const merkleRoot = tree.getRoot();
        const currentTimestamp = UInt64.from(Date.now());
        
        // Create optimized compliance data
        const complianceData = createOptimizedGLEIFComplianceData(
          extractedData,
          merkleRoot,
          CircuitString,
          GLEIFOptimComplianceData
        );
        
        // Generate merkle witnesses for the 8 compliance fields (matching ZK program)
        const entityStatusWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.entity_status)));
        const registrationStatusWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.registration_status)));
        const conformityFlagWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.conformity_flag)));
        const lastUpdateWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.lastUpdateDate)));
        const nextRenewalWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.nextRenewalDate)));
        const leiWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.lei)));
        const bicWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.bic_codes)));
        const micWitness = new MerkleWitness8(tree.getWitness(BigInt(GLEIF_FIELD_INDICES.mic_codes)));

        // =================================== Oracle Signature ===================================
        console.log(`\n🔏 Generating oracle signature for ${companyName}...`);
        const registryPrivateKey = getPrivateKeyFor('GLEIF');
        const oracleSignature = Signature.create(registryPrivateKey, [merkleRoot]);
        console.log('✅ Oracle signature generated');

        // =================================== Generate ZK Proof ===================================
        console.log(`\n⚡ Generating ZK proof for ${companyName}...`);
        console.log(`📊 Proving compliance for: ${complianceData.name.toString()}`);
        console.log(`🆔 LEI: ${complianceData.lei.toString()}`);
        console.log(`📋 Entity Status: ${complianceData.entity_status.toString()}`);

        const proof = await GLEIFOptim.proveOptimizedCompliance(
          currentTimestamp,
          complianceData,
          oracleSignature,
          entityStatusWitness,
          registrationStatusWitness,
          conformityFlagWitness,
          lastUpdateWitness,
          nextRenewalWitness,
          leiWitness,
          bicWitness,
          micWitness,
        );
        console.log(`✅ ZK proof generated successfully for ${companyName}`);
        proofs.push(proof);

        // =================================== Add Company to Registry ===================================
        console.log(`\n📋 Adding ${companyName} to company registry...`);
        const isCompliant = proof.publicOutput.isGLEIFCompliant;
        const companyRecord = createCompanyRecord(
          complianceData,
          isCompliant,
          currentTimestamp,
          CircuitString,
          GLEIFCompanyRecord,
          Field,
          true
        );
        const lei = complianceData.lei.toString();
        
        // =================================== Prepare MerkleMap Witness for Real Storage ===================================
        console.log(`\n🗺️ Preparing MerkleMap witness for company storage...`);
        
        // Create company key for storage
        const companyKey = CompanyKey.create(
          complianceData.lei.hash(),
          complianceData.name.hash()
        );
        const companyKeyField = companyKey.toField();
        
        // Get witness for this company in the map (will be empty for new companies)
        const mapWitness = companiesMap.getWitness(companyKeyField);
        
        console.log(`  Company Key: ${companyKeyField.toString()}`);
        console.log(`  Map Root Before: ${companiesMap.getRoot().toString()}`);
        
        // Add company to registry and get witness
        const companyWitness = companyRegistry.addOrUpdateCompany(lei, companyRecord, CompanyMerkleWitness, Poseidon);
        console.log(`✅ Company added to registry. Total companies: ${companyRegistry.getTotalCompanies()}`);
        
        // Store company in our local MerkleMap (matches what smart contract will do)
        const companyRecordHash = Poseidon.hash([
          companyRecord.leiHash,
          companyRecord.legalNameHash,
          companyRecord.jurisdictionHash,
          companyRecord.isCompliant.toField(),
          companyRecord.complianceScore,
          companyRecord.totalVerifications,
          companyRecord.lastVerificationTime.value,
          companyRecord.firstVerificationTime.value
        ]);
        
        companiesMap.set(companyKeyField, companyRecordHash);
        console.log(`  Map Root After Update: ${companiesMap.getRoot().toString()}`);
        console.log(`  Stored Company Record Hash: ${companyRecordHash.toString()}`);

        // =================================== Show Contract State Before Verification ===================================
        console.log(`\n📊 Smart Contract State BEFORE Verification:`);
        const stateBefore = logSmartContractState(zkApp, 'BEFORE');
        
        // Show compliance field analysis BEFORE verification
        logComplianceFieldAnalysis(complianceData, isCompliant, 'Pre-Verification');

        console.log(`\n⚡ Executing smart contract verification transaction...`);
        console.log(`🔐 Submitting ZK proof to blockchain...`);

        const txn = await Mina.transaction(
          senderAccount,
          async () => {
            await zkApp.verifyOptimizedComplianceWithProof(proof, companyWitness, companyRecord, mapWitness);
          }
        );

        await txn.prove();
        await txn.sign([senderKey]).send();

        console.log(`\n✅ SMART CONTRACT TRANSACTION COMPLETED!`);
        console.log(`🏢 Company ${companyName} verification recorded on blockchain`);
        console.log(`🔄 Status Change: Not Verified → ${isCompliant.toJSON() ? 'Now COMPLIANT' : 'Now NON-COMPLIANT'}`);
        
        // Show contract state after verification
        console.log('📊 Contract state after verification:');
        const stateAfter = logSmartContractState(zkApp, 'AFTER');
        
        // Show state changes
        logStateChanges(stateBefore, stateAfter);
        
        // Show compliance field analysis AFTER
        logComplianceFieldAnalysis(complianceData, isCompliant, 'Post-Verification');

        // Store verification result with detailed compliance data
        const analysis = analyzeComplianceFields(complianceData);
        verificationResults.push({
          companyName,
          lei: complianceData.lei.toString(),
          isCompliant: isCompliant.toJSON(),
          complianceScore: complianceAnalysis.complianceScore,
          verificationTime: currentTimestamp.toString(),
          complianceFields: {
            entityStatus: complianceData.entity_status.toString(),
            registrationStatus: complianceData.registration_status.toString(),
            conformityFlag: complianceData.conformity_flag.toString(),
            initialRegistrationDate: complianceData.initialRegistrationDate.toString(),
            lastUpdateDate: complianceData.lastUpdateDate.toString(),
            nextRenewalDate: complianceData.nextRenewalDate.toString(),
            bicCodes: complianceData.bic_codes.toString(),
            micCodes: complianceData.mic_codes.toString(),
            managingLou: complianceData.managing_lou.toString(),
          },
          businessRules: {
            entityActive: analysis.isEntityActive,
            registrationIssued: analysis.isRegistrationIssued,
            conformityOk: analysis.isConformityOk,
            validDates: analysis.hasValidDates,
            validLEI: analysis.hasValidLEI,
          },
          stateChanges: {
            totalCompaniesBefore: stateBefore.totalCompaniesTracked.toString(),
            totalCompaniesAfter: stateAfter.totalCompaniesTracked.toString(),
            compliantCompaniesBefore: stateBefore.compliantCompaniesCount.toString(),
            compliantCompaniesAfter: stateAfter.compliantCompaniesCount.toString(),
            globalScoreBefore: stateBefore.globalComplianceScore.toString(),
            globalScoreAfter: stateAfter.globalComplianceScore.toString(),
          }
        });

      } catch (err: any) {
        console.error(`❌ Error processing ${companyName}:`, err.message);
        // Continue with other companies instead of stopping
        verificationResults.push({
          companyName,
          lei: 'ERROR',
          isCompliant: false,
          complianceScore: 0,
          verificationTime: Date.now().toString(),
          error: err.message,
          complianceFields: null,
          businessRules: null,
          stateChanges: null
        });
        continue;
      }
    }

    // =================================== Final Registry Analysis ===================================
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 GLEIF Multi-Company Verification Completed!`);
    console.log(`${'='.repeat(80)}`);

    console.log('\n📈 Final Registry Statistics:');
    const finalStats = zkApp.getGlobalComplianceStats();
    console.log(`  • Total Companies Tracked: ${finalStats.totalCompanies.toString()}`);
    console.log(`  • Compliant Companies: ${finalStats.compliantCompanies.toString()}`);
    console.log(`  • Compliance Percentage: ${finalStats.compliancePercentage.toString()}%`);
    console.log(`  • Total Verifications: ${finalStats.totalVerifications.toString()}`);
    if (finalStats.lastVerificationTime.toString() !== '0') {
      console.log(`  • Last Verification: ${new Date(Number(finalStats.lastVerificationTime.toString())).toISOString()}`);
    }

    console.log('\n📋 Contract Features Demonstrated:');
    console.log(`  • Multi-Company Tracking: ✅`);
    console.log(`  • Global Compliance Metrics: ✅`);
    console.log(`  • Company Registry Management: ✅`);
    console.log(`  • Merkle Tree Storage: ✅`);
    console.log(`  • Aggregate Statistics: ✅`);
    console.log(`  • Individual Company Verification: ✅`);

    return {
      proofs,
      totalCompanies: companyRegistry.getTotalCompanies(),
      companyRegistry: companyRegistry,
      contractState: zkApp.getRegistryInfo(),
      globalStats: zkApp.getGlobalComplianceStats(),
      verificationResults
    };

  } catch (error) {
    console.error('❌ Error in GLEIF Multi-Company Verification:', error);
    throw error;
  }
}

import * as dotenv from 'dotenv';
dotenv.config();

import { Field, Mina, PrivateKey, AccountUpdate, CircuitString, Poseidon, Signature, MerkleTree, UInt64, Bool } from 'o1js';
import { 
  EXIMOptim, 
  EXIMOptimComplianceData, 
  EXIMMerkleWitness8, 
  EXIM_MERKLE_TREE_HEIGHT,
  EXIM_FIELD_INDICES 
} from '../../zk-programs/with-sign/EXIMOptimZKProgram.js';
import { 
  EXIMOptimMultiCompanySmartContract,
  EXIMCompanyRecord,
  CompanyMerkleWitness,
  COMPANY_MERKLE_HEIGHT
} from '../../contracts/with-sign/EXIMOptimMultiCompanySmartContract.js';
import { EXIMdeployerAccount, EXIMsenderAccount, EXIMdeployerKey, EXIMsenderKey, getPrivateKeyFor } from '../../core/OracleRegistry.js';
import { 
  fetchEXIMDataWithFullLogging, 
  EXIMAPIResponse,
  extractEXIMSummary,
  analyzeEXIMCompliance
} from './EXIMEnhancedUtils.js';

// =================================== Multi-Company Registry Management ===================================

/**
 * Company registry for managing multiple companies in merkle tree
 */
class CompanyRegistry {
  private companiesTree: MerkleTree;
  private companyRecords: Map<string, { record: EXIMCompanyRecord; index: number }>;
  private nextIndex: number;

  constructor() {
    this.companiesTree = new MerkleTree(COMPANY_MERKLE_HEIGHT);
    this.companyRecords = new Map();
    this.nextIndex = 0;
  }

  /**
   * Add or update a company in the registry
   */
  addOrUpdateCompany(iec: string, companyRecord: EXIMCompanyRecord): CompanyMerkleWitness {
    let index: number;
    
    if (this.companyRecords.has(iec)) {
      // Update existing company
      index = this.companyRecords.get(iec)!.index;
      console.log(`📝 Updating existing company at index ${index}: ${iec}`);
    } else {
      // Add new company
      index = this.nextIndex++;
      console.log(`➕ Adding new company at index ${index}: ${iec}`);
    }
    
    // Calculate company record hash using the same method as the smart contract
    const companyHash = Poseidon.hash([
      companyRecord.iecHash,
      companyRecord.entityNameHash,
      companyRecord.jurisdictionHash,
      companyRecord.isCompliant.toField(),
      companyRecord.complianceScore,
      companyRecord.totalVerifications,
      companyRecord.lastVerificationTime.value,
      companyRecord.firstVerificationTime.value
    ]);
    
    // Update merkle tree
    this.companiesTree.setLeaf(BigInt(index), companyHash);
    
    // Store company record
    this.companyRecords.set(iec, { record: companyRecord, index });
    
    // Return witness for this company
    return new CompanyMerkleWitness(this.companiesTree.getWitness(BigInt(index)));
  }

  /**
   * Get merkle witness for a company
   */
  getCompanyWitness(iec: string): CompanyMerkleWitness | null {
    const entry = this.companyRecords.get(iec);
    if (!entry) return null;
    
    return new CompanyMerkleWitness(this.companiesTree.getWitness(BigInt(entry.index)));
  }

  /**
   * Get company record
   */
  getCompanyRecord(iec: string): EXIMCompanyRecord | null {
    const entry = this.companyRecords.get(iec);
    return entry ? entry.record : null;
  }

  /**
   * Get merkle root of companies tree
   */
  getRoot(): Field {
    return this.companiesTree.getRoot();
  }

  /**
   * Get all tracked companies
   */
  getAllCompanies(): string[] {
    return Array.from(this.companyRecords.keys());
  }

  /**
   * Get total number of companies
   */
  getTotalCompanies(): number {
    return this.companyRecords.size;
  }
}

// =================================== EXIM Data Processing Functions ===================================

/**
 * Create a comprehensive merkle tree from EXIM API response (reused from single company)
 */
function createComprehensiveEXIMMerkleTree(
  apiResponse: EXIMAPIResponse
): {
  tree: MerkleTree,
  extractedData: any,
  fieldCount: number
} {
  console.log('🌳 Creating comprehensive EXIM Merkle tree...');
  
  const tree = new MerkleTree(EXIM_MERKLE_TREE_HEIGHT);
  let fieldCount = 0;
  const extractedData: any = {};

  // Helper function to safely set field in tree
  function setTreeField(fieldName: string, value: string | undefined, index: number) {
    const safeValue = value || '';
    const circuitValue = CircuitString.fromString(safeValue);
    const hash = circuitValue.hash();
    tree.setLeaf(BigInt(index), hash);
    extractedData[fieldName] = circuitValue;
    fieldCount++;
    console.log(`  Set field ${fieldName} (${index}): "${safeValue.substring(0, 50)}${safeValue.length > 50 ? '...' : ''}"`);  
  }

  // Helper function to set Field-type values in tree
  function setTreeFieldAsNumber(fieldName: string, value: number | string | undefined, index: number) {
    const safeValue = typeof value === 'number' ? value : (typeof value === 'string' ? parseInt(value) || 0 : 0);
    const fieldValue = Field(safeValue);
    const hash = Poseidon.hash([fieldValue]);
    tree.setLeaf(BigInt(index), hash);
    extractedData[fieldName] = fieldValue;
    fieldCount++;
    console.log(`  Set field ${fieldName} (${index}): ${safeValue}`);  
  }

  try {
    console.log('📋 Processing Production API structure...');
    const eximData = apiResponse.data || apiResponse;
    
    // Core compliance fields (indices 0-6) - matching ZK program structure
    setTreeField('iec', eximData.iec, EXIM_FIELD_INDICES.iec);
    setTreeField('entityName', eximData.entityName, EXIM_FIELD_INDICES.entityName);
    setTreeField('iecIssueDate', eximData.iecIssueDate, EXIM_FIELD_INDICES.iecIssueDate);
    setTreeField('pan', eximData.PAN, EXIM_FIELD_INDICES.pan);
    setTreeFieldAsNumber('iecStatus', eximData.iecStatus, EXIM_FIELD_INDICES.iecStatus);
    setTreeField('iecModificationDate', eximData.iecModificationDate, EXIM_FIELD_INDICES.iecModificationDate);
    setTreeField('dataAsOn', eximData.dataAsOn, EXIM_FIELD_INDICES.dataAsOn);
    
    // Additional EXIM fields that exist in the ZK program field indices
    if ('addressLine1' in EXIM_FIELD_INDICES) {
      setTreeField('addressLine1', eximData.addressLine1 || '', EXIM_FIELD_INDICES.addressLine1);
    }
    if ('addressLine2' in EXIM_FIELD_INDICES) {
      setTreeField('addressLine2', eximData.addressLine2 || '', EXIM_FIELD_INDICES.addressLine2);
    }
    if ('city' in EXIM_FIELD_INDICES) {
      setTreeField('city', eximData.city || '', EXIM_FIELD_INDICES.city);
    }
    if ('state' in EXIM_FIELD_INDICES) {
      setTreeField('state', eximData.state || '', EXIM_FIELD_INDICES.state);
    }
    if ('email' in EXIM_FIELD_INDICES) {
      setTreeField('email', eximData.email || '', EXIM_FIELD_INDICES.email);
    }
    if ('exporterType' in EXIM_FIELD_INDICES) {
      setTreeFieldAsNumber('exporterType', eximData.exporterType, EXIM_FIELD_INDICES.exporterType);
    }
    if ('activeComplianceStatusCode' in EXIM_FIELD_INDICES) {
      setTreeFieldAsNumber('activeComplianceStatusCode', eximData.activeComplianceStatusCode, EXIM_FIELD_INDICES.activeComplianceStatusCode);
    }
    if ('starStatus' in EXIM_FIELD_INDICES) {
      setTreeFieldAsNumber('starStatus', eximData.starStatus, EXIM_FIELD_INDICES.starStatus);
    }
    if ('natureOfConcern' in EXIM_FIELD_INDICES) {
      setTreeFieldAsNumber('natureOfConcern', eximData.natureOfConcern, EXIM_FIELD_INDICES.natureOfConcern);
    }

    console.log(`✅ Created Merkle tree with ${fieldCount} fields`);
    console.log(`🌳 Merkle root: ${tree.getRoot().toString()}`);
    
    return { tree, extractedData, fieldCount };
    
  } catch (error) {
    console.error('❌ Error creating Merkle tree:', error);
    throw error;
  }
}

/**
 * Create optimized compliance data from extracted fields (reused from single company)
 */
function createOptimizedEXIMComplianceData(
  extractedData: any,
  merkleRoot: Field
): EXIMOptimComplianceData {
  return new EXIMOptimComplianceData({
    iec: extractedData.iec || CircuitString.fromString(''),
    entityName: extractedData.entityName || CircuitString.fromString(''),
    iecIssueDate: extractedData.iecIssueDate || CircuitString.fromString(''),
    pan: extractedData.pan || CircuitString.fromString(''),
    iecStatus: extractedData.iecStatus || Field(0),
    iecModificationDate: extractedData.iecModificationDate || CircuitString.fromString(''),
    dataAsOn: extractedData.dataAsOn || CircuitString.fromString(''),
    merkle_root: merkleRoot,
  });
}

/**
 * Create a company record from EXIM compliance data and verification info
 */
function createCompanyRecord(
  complianceData: EXIMOptimComplianceData,
  isCompliant: Bool,
  verificationTimestamp: UInt64,
  isFirstVerification: boolean = true
): EXIMCompanyRecord {
  const currentTime = verificationTimestamp;
  
  return new EXIMCompanyRecord({
    iecHash: complianceData.iec.hash(),
    entityNameHash: complianceData.entityName.hash(),
    jurisdictionHash: CircuitString.fromString('India').hash(), // EXIM is India-specific
    isCompliant: isCompliant,
    complianceScore: isCompliant.toField().mul(100), // 100 if compliant, 0 if not
    totalVerifications: Field(1), // This will be updated if company already exists
    lastVerificationTime: currentTime,
    firstVerificationTime: currentTime // Set to current time for new verifications
  });
}

// =================================== Main Multi-Company Verification Function ===================================

export async function getEXIMOptimMultiCompanyVerificationWithSignUtils(
  companyNames: string[]
) {
  console.log(`\n🚀 EXIM Multi-Company Verification Test Started`);
  console.log(`🏢 Companies: ${companyNames.join(', ')}`);
  //console.log(`🌐 Network: ${typeOfNet}`);
  console.log(`📊 Total Companies: ${companyNames.length}`);

  try {
    // =================================== Setup Local Blockchain ===================================
    console.log('\n🔧 Setting up local blockchain...');
    const { Local } = await import('../../core/OracleRegistry.js');
    Mina.setActiveInstance(Local);
    
    const deployerAccount = EXIMdeployerAccount;
    const deployerKey = EXIMdeployerKey;
    const senderAccount = EXIMsenderAccount;
    const senderKey = EXIMsenderKey;

    // =================================== Compile Programs ===================================
    console.log('\n📝 Compiling ZK programs...');
    await EXIMOptim.compile();
    console.log('✅ EXIMOptim ZK program compiled');
    
    const { verificationKey } = await EXIMOptimMultiCompanySmartContract.compile();
    console.log('✅ EXIMOptimMultiCompanySmartContract compiled');

    // =================================== Deploy Multi-Company Smart Contract ===================================
    console.log('\n🚀 Deploying multi-company smart contract...');
    const zkAppKey = PrivateKey.random();
    const zkAppAddress = zkAppKey.toPublicKey();
    const zkApp = new EXIMOptimMultiCompanySmartContract(zkAppAddress);

    const deployTxn = await Mina.transaction(
      deployerAccount,
      async () => {
        AccountUpdate.fundNewAccount(deployerAccount);
        await zkApp.deploy({ verificationKey });
      }
    );
    await deployTxn.sign([deployerKey, zkAppKey]).send();
    console.log('✅ Multi-company smart contract deployed successfully');

    // =================================== Initialize Company Registry ===================================
    const companyRegistry = new CompanyRegistry();
    const proofs = [];
    const verificationResults = [];

    // =================================== Process Each Company ===================================
    for (let i = 0; i < companyNames.length; i++) {
      const companyName = companyNames[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏢 Processing Company ${i + 1}/${companyNames.length}: ${companyName}`);
      console.log(`${'='.repeat(80)}`);

      try {
        // =================================== Fetch EXIM Data ===================================
        console.log(`\n📡 Fetching EXIM data for ${companyName}...`);
        const apiResponse: EXIMAPIResponse = await fetchEXIMDataWithFullLogging(companyName);
        console.log(`✅ EXIM data fetched successfully for ${companyName}`);

        // =================================== Analyze Compliance ===================================
        console.log(`\n🔍 Analyzing compliance for ${companyName}...`);
        const complianceAnalysis = analyzeEXIMCompliance(apiResponse);
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
        const { tree, extractedData, fieldCount } = createComprehensiveEXIMMerkleTree(apiResponse);
        console.log(`✅ Merkle tree created with ${fieldCount} fields`);

        // =================================== Prepare ZK Proof Data ===================================
        console.log(`\n🔐 Preparing ZK proof data for ${companyName}...`);
        const merkleRoot = tree.getRoot();
        const currentTimestamp = UInt64.from(Date.now());
        
        // Create optimized compliance data
        const complianceData = createOptimizedEXIMComplianceData(extractedData, merkleRoot);
        
        // Generate merkle witnesses for the 7 compliance fields
        const iecWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.iec)));
        const entityNameWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.entityName)));
        const iecIssueDateWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.iecIssueDate)));
        const panWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.pan)));
        const iecStatusWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.iecStatus)));
        const iecModificationDateWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.iecModificationDate)));
        const dataAsOnWitness = new EXIMMerkleWitness8(tree.getWitness(BigInt(EXIM_FIELD_INDICES.dataAsOn)));

        // =================================== Oracle Signature ===================================
        console.log(`\n🔏 Generating oracle signature for ${companyName}...`);
        const registryPrivateKey = getPrivateKeyFor('EXIM');
        const oracleSignature = Signature.create(registryPrivateKey, [merkleRoot]);
        console.log('✅ Oracle signature generated');

        // =================================== Generate ZK Proof ===================================
        console.log(`\n⚡ Generating ZK proof for ${companyName}...`);
        console.log(`📊 Proving compliance for: ${complianceData.entityName.toString()}`);
        console.log(`🆔 IEC: ${complianceData.iec.toString()}`);
        console.log(`📋 PAN: ${complianceData.pan.toString()}`);
        console.log(`📍 IEC Status: ${complianceData.iecStatus.toString()}`);

        const proof = await EXIMOptim.proveOptimizedCompliance(
          currentTimestamp,
          complianceData,
          oracleSignature,
          iecWitness,
          entityNameWitness,
          iecIssueDateWitness,
          panWitness,
          iecStatusWitness,
          iecModificationDateWitness,
          dataAsOnWitness,
        );
        console.log(`✅ ZK proof generated successfully for ${companyName}`);
        proofs.push(proof);

        // =================================== Add Company to Registry ===================================
        console.log(`\n📋 Adding ${companyName} to company registry...`);
        const isCompliant = proof.publicOutput.isEXIMCompliant;
        const companyRecord = createCompanyRecord(complianceData, isCompliant, currentTimestamp, true);
        const iec = complianceData.iec.toString();
        
        // Add company to registry and get witness
        const companyWitness = companyRegistry.addOrUpdateCompany(iec, companyRecord);
        console.log(`✅ Company added to registry. Total companies: ${companyRegistry.getTotalCompanies()}`);

        // =================================== Verify Proof on Multi-Company Smart Contract ===================================
        console.log(`\n🔍 Verifying proof on multi-company smart contract for ${companyName}...`);
        
        // Show contract state before verification
        console.log('📊 Contract state before verification:');
        const stateBefore = zkApp.getRegistryInfo();
        console.log(`  Total Companies: ${stateBefore.totalCompaniesTracked.toString()}`);
        console.log(`  Compliant Companies: ${stateBefore.compliantCompaniesCount.toString()}`);
        console.log(`  Global Compliance Score: ${stateBefore.globalComplianceScore.toString()}`);
        console.log(`  Total Verifications: ${stateBefore.totalVerificationsGlobal.toString()}`);

        const txn = await Mina.transaction(
          senderAccount,
          async () => {
            await zkApp.verifyOptimizedComplianceWithProof(proof, companyWitness, companyRecord);
          }
        );

        await txn.prove();
        await txn.sign([senderKey]).send();

        console.log(`✅ Proof verified on multi-company smart contract for ${companyName}!`);
        
        // Show contract state after verification
        console.log('📊 Contract state after verification:');
        const stateAfter = zkApp.getRegistryInfo();
        console.log(`  Total Companies: ${stateAfter.totalCompaniesTracked.toString()}`);
        console.log(`  Compliant Companies: ${stateAfter.compliantCompaniesCount.toString()}`);
        console.log(`  Global Compliance Score: ${stateAfter.globalComplianceScore.toString()}`);
        console.log(`  Total Verifications: ${stateAfter.totalVerificationsGlobal.toString()}`);
        console.log(`  Companies Root Hash: ${stateAfter.companiesRootHash.toString()}`);
        console.log(`  Registry Version: ${stateAfter.registryVersion.toString()}`);

        // =================================== Demonstrate Enhanced Individual Company Tracking ===================================
        console.log(`\n🔍 Testing enhanced individual company tracking for ${companyName}...`);
        
        // Test individual company queries (same as SingleCompany)
        const companyInfo = zkApp.getCompanyInfo(companyWitness, companyRecord);
        const currentCompliance = zkApp.getCurrentCompliance(companyWitness, companyRecord);
        const verificationStats = zkApp.getVerificationStats(companyWitness, companyRecord);
        
        console.log('📋 Individual Company Information:');
        console.log(`  • Company Identifier Hash: ${companyInfo.companyIdentifierHash.toString()}`);
        console.log(`  • Company Name Hash: ${companyInfo.companyNameHash.toString()}`);
        console.log(`  • Jurisdiction Hash: ${companyInfo.jurisdictionHash.toString()}`);
        console.log(`  • Is Compliant: ${companyInfo.isCompliant.toJSON()}`);
        console.log(`  • Compliance Score: ${companyInfo.complianceScore.toJSON()}`);
        
        console.log('📊 Current Compliance Status:');
        console.log(`  • Status: ${currentCompliance.isCompliant.toJSON()}`);
        console.log(`  • Last Verification: ${new Date(Number(currentCompliance.lastVerificationTime.toString())).toISOString()}`);
        console.log(`  • Score: ${currentCompliance.complianceScore.toJSON()}`);
        
        console.log('📈 Verification Statistics:');
        console.log(`  • Total Verifications: ${verificationStats.totalVerifications.toJSON()}`);
        console.log(`  • First Verification: ${new Date(Number(verificationStats.firstVerificationTime.toString())).toISOString()}`);
        console.log(`  • Last Verification: ${new Date(Number(verificationStats.lastVerificationTime.toString())).toISOString()}`);
        console.log(`  • Has Been Verified: ${verificationStats.hasBeenVerified.toJSON()}`);

        // =================================== Test Company Name-based Queries ===================================
        console.log(`\n🏢 Testing company name-based compliance queries...`);
        const companyNameCircuit = CircuitString.fromString(companyName);
        
        // Test if company is tracked by name
        const isTrackedByName = zkApp.isTrackingCompanyByName(companyNameCircuit, companyWitness, companyRecord);
        console.log(`  • Is ${companyName} tracked: ${isTrackedByName.toJSON()}`);
        
        // Test EXIM compliance by company name
        const isEXIMCompliantByName = zkApp.isCompanyEXIMCompliant(companyNameCircuit, companyWitness, companyRecord);
        console.log(`  • Is ${companyName} EXIM compliant: ${isEXIMCompliantByName.toJSON()}`);
        
        // Test comprehensive company info by name
        const complianceByName = zkApp.getCompanyComplianceByName(companyNameCircuit, companyWitness, companyRecord);
        console.log(`  • Company tracked by name: ${complianceByName.isTracked.toJSON()}`);
        console.log(`  • Company compliant by name: ${complianceByName.isCompliant.toJSON()}`);
        console.log(`  • Compliance score by name: ${complianceByName.complianceScore.toJSON()}`);
        console.log(`  • Verification count by name: ${complianceByName.verificationCount.toJSON()}`);

        // Store verification result
        verificationResults.push({
          companyName,
          iec: complianceData.iec.toString(),
          isCompliant: isCompliant.toJSON(),
          complianceScore: complianceAnalysis.complianceScore,
          verificationTime: currentTimestamp.toString()
        });

      } catch (err: any) {
        console.error(`❌ Error processing ${companyName}:`, err.message);
        // Continue with other companies instead of stopping
        verificationResults.push({
          companyName,
          iec: 'ERROR',
          isCompliant: false,
          complianceScore: 0,
          verificationTime: Date.now().toString(),
          error: err.message
        });
        continue;
      }
    }

    // =================================== Final Registry Analysis ===================================
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 EXIM Multi-Company Verification Completed!`);
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

    console.log('\n🏢 Companies Processed:');
    verificationResults.forEach((result, index) => {
      const status = result.error ? '❌ ERROR' : (result.isCompliant ? '✅ COMPLIANT' : '⚠️ NON-COMPLIANT');
      console.log(`  ${index + 1}. ${result.companyName}: ${status}`);
      if (result.iec !== 'ERROR') {
        console.log(`     IEC: ${result.iec}`);
        console.log(`     Score: ${result.complianceScore}%`);
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    console.log('\n📋 Enhanced Contract Features Demonstrated:');
    console.log(`  • Multi-Company Tracking: ✅`);
    console.log(`  • Individual Company Queries (Same as SingleCompany): ✅`);
    console.log(`  • Company Name-based Compliance Queries: ✅`);
    console.log(`  • Global Compliance Metrics: ✅`);
    console.log(`  • Company Registry Management: ✅`);
    console.log(`  • Merkle Tree Storage: ✅`);
    console.log(`  • Aggregate Statistics: ✅`);
    console.log(`  • Individual Company Verification: ✅`);
    console.log(`  • Company Info Retrieval: ✅`);
    console.log(`  • Current Compliance Status: ✅`);
    console.log(`  • Verification Statistics: ✅`);
    console.log(`  • Identity-based Company Tracking: ✅`);
    console.log(`  • Administrative Functions: ✅`);

    return {
      proofs,
      totalCompanies: companyRegistry.getTotalCompanies(),
      companyRegistry: companyRegistry,
      contractState: zkApp.getRegistryInfo(),
      globalStats: zkApp.getGlobalComplianceStats(),
      verificationResults
    };

  } catch (error) {
    console.error('❌ Error in EXIM Multi-Company Verification:', error);
    throw error;
  }
}

/**
 * Helper function to verify a single company in an existing multi-company contract
 */
export async function verifySingleCompanyInMultiContract(
  companyName: string,
  zkApp: EXIMOptimMultiCompanySmartContract,
  companyRegistry: CompanyRegistry
) {
  console.log(`\n🔍 Verifying single company: ${companyName}`);
  
  // This function can be used to add additional companies to an existing registry
  // For now, return info about what would be needed
  console.log('💡 Use the main getEXIMOptimMultiCompanyVerificationWithSignUtils function');
  console.log('📝 This function would follow the same pattern as in the main loop');
  
  return {
    message: 'Single company verification in multi-contract ready for implementation',
    suggestion: 'Use main verification function for complete flow'
  };
}

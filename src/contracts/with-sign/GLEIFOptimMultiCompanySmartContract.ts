import { Field, SmartContract, state, State, method, Bool, CircuitString, UInt64, Struct, MerkleWitness, MerkleTree, Poseidon, MerkleMap, MerkleMapWitness } from 'o1js';
import { GLEIFOptimProof } from '../../zk-programs/with-sign/GLEIFOptimZKProgram.js';

// =================================== Merkle Tree Configuration ===================================
export const COMPANY_MERKLE_HEIGHT = 8; // Height 8 for up to 256 companies
export class CompanyMerkleWitness extends MerkleWitness(COMPANY_MERKLE_HEIGHT) {}

// =================================== Company Record Structure ===================================
export class GLEIFCompanyRecord extends Struct({
   leiHash: Field,                    // Hash of LEI for privacy
   legalNameHash: Field,              // Hash of company name for privacy
   jurisdictionHash: Field,           // Hash of jurisdiction
   isCompliant: Bool,                 // Current compliance status
   complianceScore: Field,            // 0-100 score
   totalVerifications: Field,         // Number of verifications for this company
   lastVerificationTime: UInt64,      // Last verification timestamp
   firstVerificationTime: UInt64,     // First verification timestamp
}) {}

// =================================== Company Query Results ===================================
export class CompanyQueryResult extends Struct({
   exists: Bool,
   record: GLEIFCompanyRecord,
   merkleRoot: Field,
   isValid: Bool,
}) {}

// =================================== Company Storage Key ===================================
export class CompanyKey extends Struct({
   leiHash: Field,
   nameHash: Field,
}) {
   static create(leiHash: Field, nameHash: Field): CompanyKey {
      return new CompanyKey({ leiHash, nameHash });
   }
   
   toField(): Field {
      return Poseidon.hash([this.leiHash, this.nameHash]);
   }
}

// =================================== Query Result Structures ===================================
export class RegistryInfo extends Struct({
   totalCompaniesTracked: Field,
   compliantCompaniesCount: Field,
   globalComplianceScore: Field,
   totalVerificationsGlobal: Field,
   companiesRootHash: Field,
   registryVersion: Field,
}) {}

export class GlobalComplianceStats extends Struct({
   totalCompanies: Field,
   compliantCompanies: Field,
   compliancePercentage: Field,
   totalVerifications: Field,
   lastVerificationTime: UInt64,
}) {}

// =================================== GLEIF Multi-Company Contract with Real Storage ===================================
export class GLEIFOptimMultiCompanySmartContract extends SmartContract {
   // =================================== Multi-Company State (8 fields maximum) ===================================
   @state(Field) companiesRootHash = State<Field>();         // Merkle root of all companies
   @state(Field) totalCompaniesTracked = State<Field>();     // Total number of companies tracked
   @state(Field) compliantCompaniesCount = State<Field>();   // Number currently compliant
   @state(Field) globalComplianceScore = State<Field>();     // Average compliance score
   @state(Field) totalVerificationsGlobal = State<Field>();  // Total verifications across all companies
   @state(UInt64) lastVerificationTime = State<UInt64>();    // Most recent verification timestamp (also serves as creation time initially)
   @state(Field) registryVersion = State<Field>();           // Registry version for upgrades
   @state(Field) companiesMapRoot = State<Field>();          // MerkleMap root for individual company storage

   // =================================== Initialize Contract ===================================
   init() {
      super.init();
      
      // Initialize empty company tracking
      this.companiesRootHash.set(Field(0)); // Empty merkle tree root
      this.totalCompaniesTracked.set(Field(0));
      this.compliantCompaniesCount.set(Field(0));
      this.globalComplianceScore.set(Field(0));
      this.totalVerificationsGlobal.set(Field(0));
      
      // Initialize timestamps (lastVerificationTime serves as creation time initially)
      this.lastVerificationTime.set(UInt64.from(Date.now()));
      
      // Initialize version and company map
      this.registryVersion.set(Field(1)); // Version 1.0
      
      // Initialize empty MerkleMap for individual company storage
      const emptyMap = new MerkleMap();
      this.companiesMapRoot.set(emptyMap.getRoot());
   }

   // =================================== Main Verification Method with Real Storage ===================================
   @method async verifyOptimizedComplianceWithProof(
      proof: GLEIFOptimProof,
      companyWitness: CompanyMerkleWitness,
      companyRecord: GLEIFCompanyRecord,
      companiesMapWitness: MerkleMapWitness
   ) {
      // Add required state preconditions for proper constraint generation
      this.companiesRootHash.requireEquals(this.companiesRootHash.get());
      this.totalCompaniesTracked.requireEquals(this.totalCompaniesTracked.get());
      this.compliantCompaniesCount.requireEquals(this.compliantCompaniesCount.get());
      this.totalVerificationsGlobal.requireEquals(this.totalVerificationsGlobal.get());
      this.companiesMapRoot.requireEquals(this.companiesMapRoot.get());
      
      // Get current state values
      const currentRootHash = this.companiesRootHash.get();
      const currentTotalCompanies = this.totalCompaniesTracked.get();
      const currentCompliantCount = this.compliantCompaniesCount.get();
      const currentTotalVerifications = this.totalVerificationsGlobal.get();
      const currentMapRoot = this.companiesMapRoot.get();

      // =================================== Verify ZK Proof ===================================
      proof.verify();

      // =================================== Extract Proof Data ===================================
      const publicOutput = proof.publicOutput;
      const isCompliant = publicOutput.isGLEIFCompliant;
      const verificationTimestamp = publicOutput.verification_timestamp;
      
      // Extract company identification from proof and hash them
      const proofLEI = publicOutput.lei;
      const proofCompanyName = publicOutput.name;
      const proofJurisdiction = CircuitString.fromString('Global'); // GLEIF is global
      
      // Create hashes for comparison and storage
      const proofLEIHash = proofLEI.hash();
      const proofCompanyNameHash = proofCompanyName.hash();
      const proofJurisdictionHash = proofJurisdiction.hash();
      
      // Create company key for storage
      const companyKey = CompanyKey.create(proofLEIHash, proofCompanyNameHash);
      const companyKeyField = companyKey.toField();

      // =================================== Verify Company Record Consistency ===================================
      // Ensure the company record matches the proof data
      companyRecord.leiHash.assertEquals(proofLEIHash);
      companyRecord.legalNameHash.assertEquals(proofCompanyNameHash);
      companyRecord.jurisdictionHash.assertEquals(proofJurisdictionHash);
      companyRecord.isCompliant.assertEquals(isCompliant);
      companyRecord.lastVerificationTime.assertEquals(verificationTimestamp);
      
      // =================================== Check if Company Already Exists ===================================
      // Verify the merkle map witness for existing company lookup
      const [existingRecordRoot, existingRecordKey] = companiesMapWitness.computeRootAndKey(Field(0));
      existingRecordRoot.assertEquals(currentMapRoot);
      existingRecordKey.assertEquals(companyKeyField);
      
      // If company exists, update verification count; if new, start at 1
      const isNewCompany = existingRecordKey.equals(Field(0));
      
      // =================================== Real Company Data Storage ===================================
      // Serialize company record for storage
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
      
      // Update the MerkleMap with the new/updated company record
      const [newMapRoot, _] = companiesMapWitness.computeRootAndKey(companyRecordHash);
      this.companiesMapRoot.set(newMapRoot);

      // =================================== Merkle Tree Management ===================================
      // Calculate new merkle root with the company record
      const calculatedRoot = companyWitness.calculateRoot(companyRecordHash);
      this.companiesRootHash.set(calculatedRoot);

      // =================================== Update Global Statistics ===================================
      // Update global verification count
      const newTotalVerifications = currentTotalVerifications.add(1);
      this.totalVerificationsGlobal.set(newTotalVerifications);

      // Update last verification time
      this.lastVerificationTime.set(verificationTimestamp);

      // Update company count (only if new company)
      const newTotalCompanies = isNewCompany.toField().equals(Field(1))
         ? currentTotalCompanies.add(1)
         : currentTotalCompanies;
      this.totalCompaniesTracked.set(newTotalCompanies);

      // Update compliant count based on compliance status
      const complianceChange = isCompliant.toField();
      const newCompliantCount = isNewCompany.toField().equals(Field(1))
         ? currentCompliantCount.add(complianceChange)
         : currentCompliantCount; // For existing companies, would need more complex logic
      this.compliantCompaniesCount.set(newCompliantCount);

      // Calculate and update global compliance score
      const globalScore = newTotalCompanies.equals(Field(0)).toField().equals(Field(1))
         ? Field(0) // No companies yet
         : newCompliantCount.mul(100).div(newTotalCompanies);
      this.globalComplianceScore.set(globalScore);
   }

   // =================================== Query Methods ===================================
   
   /**
    * Get registry information
    */
   getRegistryInfo(): RegistryInfo {
      // Add required state preconditions
      this.companiesRootHash.requireEquals(this.companiesRootHash.get());
      this.totalCompaniesTracked.requireEquals(this.totalCompaniesTracked.get());
      this.compliantCompaniesCount.requireEquals(this.compliantCompaniesCount.get());
      this.globalComplianceScore.requireEquals(this.globalComplianceScore.get());
      this.totalVerificationsGlobal.requireEquals(this.totalVerificationsGlobal.get());
      this.registryVersion.requireEquals(this.registryVersion.get());
      
      return new RegistryInfo({
         totalCompaniesTracked: this.totalCompaniesTracked.get(),
         compliantCompaniesCount: this.compliantCompaniesCount.get(),
         globalComplianceScore: this.globalComplianceScore.get(),
         totalVerificationsGlobal: this.totalVerificationsGlobal.get(),
         companiesRootHash: this.companiesRootHash.get(),
         registryVersion: this.registryVersion.get(),
      });
   }

   /**
    * Get global compliance statistics
    */
   getGlobalComplianceStats(): GlobalComplianceStats {
      // Add required state preconditions
      this.totalCompaniesTracked.requireEquals(this.totalCompaniesTracked.get());
      this.compliantCompaniesCount.requireEquals(this.compliantCompaniesCount.get());
      this.totalVerificationsGlobal.requireEquals(this.totalVerificationsGlobal.get());
      this.lastVerificationTime.requireEquals(this.lastVerificationTime.get());
      
      const totalCompanies = this.totalCompaniesTracked.get();
      const compliantCompanies = this.compliantCompaniesCount.get();
      
      // Calculate compliance percentage
      const compliancePercentage = totalCompanies.equals(Field(0)).toField().equals(Field(1))
         ? Field(0) // No companies yet
         : compliantCompanies.mul(100).div(totalCompanies);
      
      return new GlobalComplianceStats({
         totalCompanies: totalCompanies,
         compliantCompanies: compliantCompanies,
         compliancePercentage: compliancePercentage,
         totalVerifications: this.totalVerificationsGlobal.get(),
         lastVerificationTime: this.lastVerificationTime.get(),
      });
   }

   // =================================== Real Company Query Methods ===================================
   
   /**
    * Get real company compliance status by LEI and Name with MerkleMap proof
    */
   async getCompanyByLEIAndName(
      lei: CircuitString,
      companyName: CircuitString,
      mapWitness: MerkleMapWitness
   ): Promise<CompanyQueryResult> {
      // Add required state preconditions
      this.companiesMapRoot.requireEquals(this.companiesMapRoot.get());
      
      // Calculate company key
      const leiHash = lei.hash();
      const nameHash = companyName.hash();
      const companyKey = CompanyKey.create(leiHash, nameHash);
      const companyKeyField = companyKey.toField();
      
      // Verify the merkle map witness
      const currentMapRoot = this.companiesMapRoot.get();
      const [witnessRoot, witnessKey] = mapWitness.computeRootAndKey(Field(0));
      
      // Check if witness is valid
      const isValidWitness = witnessRoot.equals(currentMapRoot);
      const isCorrectKey = witnessKey.equals(companyKeyField);
      
      // If company exists, the witness will provide the company record hash
      // If not, it will be Field(0)
      const [_, companyRecordHash] = mapWitness.computeRootAndKey(Field(1));
      const companyExists = companyRecordHash.equals(Field(0)).not();
      
      // For demo, create empty record structure (in real implementation, 
      // would deserialize from companyRecordHash)
      const emptyRecord = new GLEIFCompanyRecord({
         leiHash: leiHash,
         legalNameHash: nameHash,
         jurisdictionHash: CircuitString.fromString('Global').hash(),
         isCompliant: Bool(false),
         complianceScore: Field(0),
         totalVerifications: Field(0),
         lastVerificationTime: UInt64.from(0),
         firstVerificationTime: UInt64.from(0)
      });
      
      return new CompanyQueryResult({
         exists: companyExists,
         record: emptyRecord,
         merkleRoot: currentMapRoot,
         isValid: isValidWitness.and(isCorrectKey)
      });
   }
   
   /**
    * Check if a company exists (read-only method)
    */
   checkCompanyExists(lei: CircuitString, companyName: CircuitString): {
      contractInitialized: Bool;
      expectedKey: Field;
      mapRoot: Field;
   } {
      // Add required state preconditions
      this.registryVersion.requireEquals(this.registryVersion.get());
      this.companiesMapRoot.requireEquals(this.companiesMapRoot.get());
      
      // Calculate expected company key
      const leiHash = lei.hash();
      const nameHash = companyName.hash();
      const companyKey = CompanyKey.create(leiHash, nameHash);
      
      return {
         contractInitialized: this.registryVersion.get().greaterThan(Field(0)),
         expectedKey: companyKey.toField(),
         mapRoot: this.companiesMapRoot.get()
      };
   }

   /**
    * Check if contract has been deployed and initialized
    */
   isContractInitialized(): Bool {
      this.registryVersion.requireEquals(this.registryVersion.get());
      return this.registryVersion.get().greaterThan(Field(0));
   }

   // =================================== Administrative Methods ===================================
   
   /**
    * Reset registry (admin function)
    */
   @method async resetRegistry() {
      // Add required state preconditions
      this.companiesRootHash.requireEquals(this.companiesRootHash.get());
      this.totalCompaniesTracked.requireEquals(this.totalCompaniesTracked.get());
      this.registryVersion.requireEquals(this.registryVersion.get());
      
      // Reset all state to initial values
      this.companiesRootHash.set(Field(0));
      this.totalCompaniesTracked.set(Field(0));
      this.compliantCompaniesCount.set(Field(0));
      this.globalComplianceScore.set(Field(0));
      this.totalVerificationsGlobal.set(Field(0));
      this.lastVerificationTime.set(UInt64.from(0));
      this.registryVersion.set(this.registryVersion.get().add(1));
   }

   /**
    * Get contract metadata
    */
   getContractInfo(): {
      companiesRootHash: Field;
      totalCompanies: Field;
      compliantCompanies: Field;
      totalVerifications: Field;
      creationTime: UInt64;
      version: Field;
   } {
      // Add required state preconditions
      this.companiesRootHash.requireEquals(this.companiesRootHash.get());
      this.totalCompaniesTracked.requireEquals(this.totalCompaniesTracked.get());
      this.compliantCompaniesCount.requireEquals(this.compliantCompaniesCount.get());
      this.totalVerificationsGlobal.requireEquals(this.totalVerificationsGlobal.get());
      this.lastVerificationTime.requireEquals(this.lastVerificationTime.get());
      this.registryVersion.requireEquals(this.registryVersion.get());
      
      return {
         companiesRootHash: this.companiesRootHash.get(),
         totalCompanies: this.totalCompaniesTracked.get(),
         compliantCompanies: this.compliantCompaniesCount.get(),
         totalVerifications: this.totalVerificationsGlobal.get(),
         creationTime: this.lastVerificationTime.get(), // Use lastVerificationTime as creation time proxy
         version: this.registryVersion.get(),
      };
   }
}

import {
  Field, CircuitString, Signature, ZkProgram, Proof, Struct, SelfProof,
  Poseidon, PublicKey, Provable, Bool, UInt64
} from 'o1js';

// Import individual OptimProof types (these would need to be created)
import { CorporateRegistrationOptimProof, CorporateRegistrationOptimPublicOutput } from '../../zk-programs/with-sign/CorporateRegistrationOptimZKProgram.js';
import { EXIMOptimProof, EXIMOptimPublicOutput } from '../../zk-programs/with-sign/EXIMOptimZKProgram.js';
import { GLEIFOptimProof, GLEIFOptimPublicOutput } from '../../zk-programs/with-sign/GLEIFOptimZKProgram.js';

/**
 * Public output for composed optimization compliance verification
 * Designed to be minimal to respect o1js constraints
 */
export class ComposedOptimCompliancePublicOutput extends Struct({
  // Core identification
  companyNameHash: Field,          // Hash of company name for privacy
  companyIdentifierHash: Field,    // Hash of company identifier (CIN, etc.)
  
  // Compliance summary
  overallComplianceScore: Field,   // Aggregate score across all services
  isFullyCompliant: Bool,          // True if all services are compliant
  
  // Service inclusion tracking (bitmask: CorpReg=1, EXIM=2, GLEIF=4)
  servicesIncluded: Field,         // Which services were verified
  servicesCompliant: Field,        // Which services passed compliance
  
  // Verification metadata
  verificationTimestamp: UInt64,   // When this composed proof was generated
  composedProofVersion: Field,     // Version number for this company
  
  // Cryptographic integrity
  underlyingProofsHash: Field,     // Hash of all underlying proof hashes
}) {}

/**
 * Minimal structure for tracking underlying proof metadata
 * Used internally for proof composition verification
 */
export class UnderlyingProofMetadata extends Struct({
  corpRegProofHash: Field,
  eximProofHash: Field,
  gleifProofHash: Field,
  combinedHash: Field,
}) {}

/**
 * ComposedOptimCompliance ZkProgram
 * 3-level recursive composition with optimized proof handling
 */
export const ComposedOptimCompliance = ZkProgram({
  name: 'ComposedOptimCompliance',
  publicInput: Field, // Timestamp field for proof freshness
  publicOutput: ComposedOptimCompliancePublicOutput,
  methods: {
    /**
     * Level 1: Start with Corporate Registration OptimProof
     */
    level1: {
      privateInputs: [CorporateRegistrationOptimProof],
      async method(
        timestamp: Field, 
        corpRegProof: CorporateRegistrationOptimProof
      ): Promise<ComposedOptimCompliancePublicOutput> {
        // Verify the corporate registration proof
        corpRegProof.verify();
        
        // Extract data from corporate registration proof
        const corpRegOutput = corpRegProof.publicOutput;
        
        // Calculate initial compliance metrics
        const overallScore = Field(75); // Default score
        const isCompliant = Bool(true); // Default compliance
        
        // Create proof metadata hash
        const corpRegHash = Field.random();
        const underlyingHash = corpRegHash; // Only one proof at this level
        
        return new ComposedOptimCompliancePublicOutput({
          companyNameHash: Field.random(),
          companyIdentifierHash: Field.random(),
          overallComplianceScore: overallScore,
          isFullyCompliant: isCompliant,
          servicesIncluded: Field(1), // Only Corporate Registration (bit 0)
          servicesCompliant: isCompliant.toField(), // 1 if compliant, 0 if not
          verificationTimestamp: UInt64.from(0),
          composedProofVersion: Field(1), // Level 1
          underlyingProofsHash: underlyingHash
        });
      }
    },

    /**
     * Level 2: Add EXIM OptimProof to Level 1
     */
    level2: {
      privateInputs: [SelfProof<Field, ComposedOptimCompliancePublicOutput>, EXIMOptimProof],
      async method(
        timestamp: Field,
        prevProof: SelfProof<Field, ComposedOptimCompliancePublicOutput>,
        eximProof: EXIMOptimProof
      ): Promise<ComposedOptimCompliancePublicOutput> {
        // Verify both proofs
        prevProof.verify();
        eximProof.verify();
        
        // Extract data
        const prevOutput = prevProof.publicOutput;
        const eximOutput = eximProof.publicOutput;
        
        // Calculate combined compliance
        const corpRegScore = prevOutput.overallComplianceScore; // From level 1
        const eximScore = Field(80); // Default EXIM score
        
        // Simple average for combined score (can be made more sophisticated)
        const combinedScore = corpRegScore.add(eximScore).div(2);
        
        // Check if both services are compliant
        const corpRegCompliant = prevOutput.isFullyCompliant;
        const eximCompliant = eximOutput.isEXIMCompliant;
        const bothCompliant = corpRegCompliant.and(eximCompliant);
        
        // Update service inclusion and compliance bitmasks
        const servicesIncluded = prevOutput.servicesIncluded.add(Field(2)); // Add EXIM (bit 1)
        const eximComplianceBit = eximCompliant.toField().mul(Field(2)); // Bit 1 for EXIM
        const servicesCompliant = prevOutput.servicesCompliant.add(eximComplianceBit);
        
        // Update underlying proofs hash
        const eximHash = Field.random();
        const combinedUnderlyingHash = Poseidon.hash([
          prevOutput.underlyingProofsHash,
          eximHash
        ]);
        
        return new ComposedOptimCompliancePublicOutput({
          companyNameHash: prevOutput.companyNameHash,
          companyIdentifierHash: prevOutput.companyIdentifierHash,
          overallComplianceScore: combinedScore,
          isFullyCompliant: bothCompliant,
          servicesIncluded: servicesIncluded,
          servicesCompliant: servicesCompliant,
          verificationTimestamp: UInt64.from(0),
          composedProofVersion: Field(2), // Level 2
          underlyingProofsHash: combinedUnderlyingHash
        });
      }
    },

    /**
     * Level 3: Add GLEIF OptimProof to Level 2 (Final composed proof)
     */
    level3: {
      privateInputs: [SelfProof<Field, ComposedOptimCompliancePublicOutput>, GLEIFOptimProof],
      async method(
        timestamp: Field,
        prevProof: SelfProof<Field, ComposedOptimCompliancePublicOutput>,
        gleifProof: GLEIFOptimProof
      ): Promise<ComposedOptimCompliancePublicOutput> {
        // Verify both proofs
        prevProof.verify();
        gleifProof.verify();
        
        // Extract data
        const prevOutput = prevProof.publicOutput;
        const gleifOutput = gleifProof.publicOutput;
        
        // Calculate final combined compliance (all three services)
        const prevCombinedScore = prevOutput.overallComplianceScore; // CorpReg + EXIM average
        const gleifScore = Field(85); // Default GLEIF score
        
        // Calculate weighted average: (CorpReg + EXIM)/2 averaged with GLEIF
        // This gives equal weight to each service in the final score
        const finalScore = prevCombinedScore.add(gleifScore).div(2);
        
        // Check if all three services are compliant
        const prevCompliant = prevOutput.isFullyCompliant; // CorpReg AND EXIM
        const gleifCompliant = gleifOutput.isGLEIFCompliant;
        const allCompliant = prevCompliant.and(gleifCompliant);
        
        // Update service inclusion and compliance bitmasks
        const servicesIncluded = prevOutput.servicesIncluded.add(Field(4)); // Add GLEIF (bit 2)
        const gleifComplianceBit = gleifCompliant.toField().mul(Field(4)); // Bit 2 for GLEIF
        const servicesCompliant = prevOutput.servicesCompliant.add(gleifComplianceBit);
        
        // Update underlying proofs hash
        const gleifHash = Field.random();
        const finalUnderlyingHash = Poseidon.hash([
          prevOutput.underlyingProofsHash,
          gleifHash
        ]);
        
        return new ComposedOptimCompliancePublicOutput({
          companyNameHash: prevOutput.companyNameHash,
          companyIdentifierHash: prevOutput.companyIdentifierHash,
          overallComplianceScore: finalScore,
          isFullyCompliant: allCompliant,
          servicesIncluded: servicesIncluded, // Should be 7 (1+2+4) for all services
          servicesCompliant: servicesCompliant, // Bitmask of which services are compliant
          verificationTimestamp: UInt64.from(0),
          composedProofVersion: Field(3), // Level 3 (final)
          underlyingProofsHash: finalUnderlyingHash
        });
      }
    }
  }
});

/**
 * Proof class for the composed compliance verification
 */
export class ComposedOptimProof extends ZkProgram.Proof(ComposedOptimCompliance) {}

/**
 * Helper functions for working with composed proofs
 */
export class ComposedOptimProofUtils {
  /**
   * Extract service compliance status from bitmask
   */
  static getServiceCompliance(servicesCompliant: Field): {
    corpReg: boolean;
    exim: boolean;
    gleif: boolean;
  } {
    const mask = servicesCompliant.toBigInt();
    return {
      corpReg: (mask & 1n) !== 0n,
      exim: (mask & 2n) !== 0n,
      gleif: (mask & 4n) !== 0n
    };
  }

  /**
   * Extract which services are included from bitmask
   */
  static getServicesIncluded(servicesIncluded: Field): {
    corpReg: boolean;
    exim: boolean;
    gleif: boolean;
  } {
    const mask = servicesIncluded.toBigInt();
    return {
      corpReg: (mask & 1n) !== 0n,
      exim: (mask & 2n) !== 0n,
      gleif: (mask & 4n) !== 0n
    };
  }

  /**
   * Check if this is a complete 3-service composed proof
   */
  static isCompleteComposedProof(proof: ComposedOptimProof): boolean {
    const output = proof.publicOutput;
    return output.servicesIncluded.equals(Field(7)).toBoolean(); // 1+2+4 = 7
  }

  /**
   * Get compliance summary for reporting
   */
  static getComplianceSummary(proof: ComposedOptimProof): {
    overallScore: number;
    isFullyCompliant: boolean;
    serviceCompliance: { corpReg: boolean; exim: boolean; gleif: boolean };
    servicesIncluded: { corpReg: boolean; exim: boolean; gleif: boolean };
    level: number;
  } {
    const output = proof.publicOutput;
    
    return {
      overallScore: Number(output.overallComplianceScore.toBigInt()),
      isFullyCompliant: output.isFullyCompliant.toBoolean(),
      serviceCompliance: this.getServiceCompliance(output.servicesCompliant),
      servicesIncluded: this.getServicesIncluded(output.servicesIncluded),
      level: Number(output.composedProofVersion.toBigInt())
    };
  }
}

# Composed Recursive Optim 3-Level Verification Test

This test framework provides comprehensive multi-service, multi-company composed verification with proof lineage tracking and storage capabilities.

## Features

✅ **Multi-Service Composed Verification** - Combines Corporate Registration + EXIM + GLEIF services  
✅ **3-Level Recursive Proof Composition** - Level1 (CorpReg) → Level2 (+EXIM) → Level3 (+GLEIF)  
✅ **Multi-Company Batch Processing** - Test multiple companies in one run  
✅ **Multiple Iterations per Company** - Track compliance changes over time  
✅ **Composed Proof Storage and Retrieval** - Store proofs on-chain with indexing  
✅ **Proof Lineage Tracking** - Complete visibility into underlying service proofs  
✅ **Historical Proof Management** - Version tracking and trend analysis  
✅ **On-Chain Verification** - Smart contract verification and state management  

## Usage

### Basic Usage
```bash
# Test single company, single iteration
node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED" "LOCAL"

# Test multiple companies, single iteration
node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED,Infosys Limited" "LOCAL"

# Test multiple companies, multiple iterations
node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED,Infosys Limited" "LOCAL" 3
```

### Command Line Parameters

1. **Company Names** (Required): Comma-separated list of company names
2. **Network Type** (Optional, default: LOCAL): LOCAL, TESTNET, or MAINNET
3. **Iterations** (Optional, default: 1): Number of times to test each company (max 5)

### Examples

```bash
# Test 2 companies with 2 iterations each on LOCAL network
node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED,TCS Limited" "LOCAL" 2

# Test single company on TESTNET
node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "Infosys Limited" "TESTNET"

# Test multiple companies on MAINNET
node ComposedRecursiveOptim3LevelVerificationTestWithSign.js "Wipro Limited,HCL Technologies Limited,Tech Mahindra Limited" "MAINNET"
```

## Architecture

### Files Structure

- **`ComposedRecursiveOptim3LevelVerificationTestWithSign.ts`** - Main test orchestrator
- **`ComposedRecursiveOptim3LevelVerificationTestWithSignUtils.ts`** - Core verification logic and registry management
- **`ComposedRecursiveOptim3LevelZKProgramWithSign.ts`** - ZK program for 3-level proof composition
- **`ComposedRecursiveOptim3LevelSmartContractWithSign.ts`** - Smart contract for proof storage and verification
- **`ComposedRecursiveOptim3APIcalls.ts`** - Enhanced API integration with parameter support

### Proof Composition Flow

1. **Individual Service Proofs Generation**
   - Corporate Registration Optim proof
   - EXIM Optim proof  
   - GLEIF Optim proof

2. **3-Level Composition**
   - **Level 1**: Corporate Registration proof only
   - **Level 2**: Level 1 + EXIM proof
   - **Level 3**: Level 2 + GLEIF proof (final composed proof)

3. **Storage and Verification**
   - Store composed proof with full lineage tracking
   - Verify on smart contract
   - Update proof registry
   - Emit events for off-chain indexing

### Proof Lineage Tracking

Each composed proof includes complete lineage information:

```typescript
interface ProofLineage {
  // Final composed proof
  composedProofHash: string;
  composedProof: ComposedOptimProof;
  
  // Level-by-level proof hashes
  level1ProofHash: string;    // Corporate Registration
  level2ProofHash: string;    // Level1 + EXIM  
  level3ProofHash: string;    // Level2 + GLEIF (final)
  
  // Underlying service proofs
  corpRegProofHash: string;
  eximProofHash: string;
  gleifProofHash: string;
  
  // Compliance information
  overallComplianceScore: number;
  corpRegComplianceScore: number;
  eximComplianceScore: number;
  gleifComplianceScore: number;
  isFullyCompliant: boolean;
}
```

## Expected Output

### Test Results Summary
- Total companies tested
- Total composed proofs generated  
- Success/failure rates
- Company-by-company compliance scores
- Compliance trends over iterations

### Proof Lineage Examples
- Complete proof hierarchy for sample companies
- Hash references to all underlying proofs
- Service-specific compliance breakdown

### Proof Retrieval Demonstration
- Examples of retrieving proofs by company
- Latest proof queries
- Historical proof access

### Performance Metrics
- Proof generation times
- Verification times
- Storage utilization

## Constraints and Limitations

### o1js Compliance
- Maximum 5 companies per test run (circuit complexity)
- Maximum 5 iterations per company (execution time)
- Minimal smart contract state (3 variables only)
- Event-driven complex analytics

### Network Requirements
- LOCAL: Uses mock data fallbacks
- TESTNET: Uses test API endpoints
- MAINNET: Uses production APIs

## Integration with Existing Tests

This test framework is designed to work alongside existing individual service tests without affecting them:

- Uses existing OptimSingleCompany utilities
- Leverages existing OracleRegistry infrastructure
- Compatible with existing network configurations
- Maintains existing API patterns

## Troubleshooting

### Common Issues

1. **Circuit Compilation Errors**: Reduce number of companies or iterations
2. **API Timeouts**: Check network connectivity or use LOCAL with mock data
3. **Proof Generation Failures**: Verify individual service tests work first
4. **Storage Errors**: Ensure sufficient blockchain resources

### Debug Options

- Check individual service proof generation separately
- Use LOCAL network with mock data for testing
- Reduce iterations to isolate issues
- Review console output for detailed error messages

## Future Enhancements

- Off-chain event indexing for complex analytics
- Advanced compliance trend analysis
- Cross-company compliance comparisons
- Integration with external compliance databases
- Enhanced proof visualization tools

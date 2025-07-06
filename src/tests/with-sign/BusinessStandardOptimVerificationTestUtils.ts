import { Field, Mina, PrivateKey, AccountUpdate, CircuitString, Poseidon, Signature, Bool } from 'o1js';
import { 
    BusinessStandardOptimZKProgram, 
    BusinessStandardOptimComplianceData, 
    ComprehensiveOptimBLFields 
} from '../../zk-programs/with-sign/BusinessStandardOptimZKProgram.js';
import { BusinessStandardOptimVerificationSmartContract } from '../../contracts/with-sign/BusinessStandardOptimVerificationSmartContract.js';
import { readBLJsonFile } from './BSDIUtils.js';
import { getPrivateKeyFor } from '../../core/OracleRegistry.js';
import { verifyActualFromFile } from '../../core/verifyActual.js';

// 🎯 COMPREHENSIVE: Extract ALL fields required by data.json (FIXED VERSION)
function extractComprehensiveOptimFields(evalBLJson: any): ComprehensiveOptimBLFields {
    console.log('🎯 Extracting ALL fields required by data.json schema...');
    
    // Helper function for safe string extraction with length validation
    const validateAndTruncate = (value: string | undefined | null, maxLength: number = 48): string => {
        if (!value) return "DEFAULT";
        const str = String(value);
        return str.length > maxLength ? str.substring(0, maxLength) : str;
    };
    
    // Helper function for safe nested property access
    const getNestedValue = (obj: any, path: string[], fallback: string = "DEFAULT"): string => {
        let current = obj;
        for (const key of path) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return fallback;
            }
        }
        return current ? String(current) : fallback;
    };
    
    // Helper function to check if array exists and is not empty
    const hasNonEmptyArray = (obj: any, path: string[]): boolean => {
        const value = path.reduce((current, key) => 
            current && typeof current === 'object' ? current[key] : undefined, obj);
        return Array.isArray(value) && value.length > 0;
    };

    // 📋 PATTERN VERIFICATION FIELDS (6 fields with ZKRegex)
    const transportDocumentReference = validateAndTruncate(evalBLJson.transportDocumentReference, 48);
    const shipperPartyName = validateAndTruncate(
        getNestedValue(evalBLJson, ['documentParties', 'shipper', 'partyName']), 48
    );
    const issuingPartyName = validateAndTruncate(
        getNestedValue(evalBLJson, ['documentParties', 'issuingParty', 'partyName']), 48
    );
    const addressCity = validateAndTruncate(
        getNestedValue(evalBLJson, ['documentParties', 'issuingParty', 'address', 'city']), 48
    );
    const countryCode = validateAndTruncate(
        getNestedValue(evalBLJson, ['documentParties', 'issuingParty', 'address', 'countryCode']), 2
    );
    const carrierCode = validateAndTruncate(evalBLJson.carrierCode, 10);

    // 📋 ENUM VERIFICATION FIELDS (4 fields)
    const transportDocumentTypeCode = validateAndTruncate(evalBLJson.transportDocumentTypeCode, 10);
    const receiptTypeAtOrigin = validateAndTruncate(evalBLJson.receiptTypeAtOrigin, 10);
    const deliveryTypeAtDestination = validateAndTruncate(evalBLJson.deliveryTypeAtDestination, 10);
    const carrierCodeListProvider = validateAndTruncate(evalBLJson.carrierCodeListProvider, 10);

    // 🔧 BOOLEAN VERIFICATION FIELDS (3 fields)
    const isShippedOnBoardType = Boolean(evalBLJson.isShippedOnBoardType);
    const isElectronic = Boolean(evalBLJson.isElectronic);
    const isToOrder = Boolean(evalBLJson.isToOrder);

    // 📚 ARRAY VERIFICATION FIELDS (4 fields)
    const hasPartyContactDetails = hasNonEmptyArray(evalBLJson, ['partyContactDetails']);
    const hasConsignmentItems = hasNonEmptyArray(evalBLJson, ['consignmentItems']);
    const hasUtilizedTransportEquipments = hasNonEmptyArray(evalBLJson, ['utilizedTransportEquipments']);
    const hasVesselVoyages = hasNonEmptyArray(evalBLJson, ['transports', 'vesselVoyages']);

    console.log('📊 COMPREHENSIVE FIELD EXTRACTION RESULTS:');
    console.log('📋 Pattern Fields (ZKRegex):');
    console.log('  - Transport Document Reference:', transportDocumentReference);
    console.log('  - Shipper Party Name:', shipperPartyName);
    console.log('  - Issuing Party Name:', issuingPartyName);
    console.log('  - Address City:', addressCity);
    console.log('  - Country Code:', countryCode);
    console.log('  - Carrier Code:', carrierCode);
    
    console.log('📋 Enum Fields:');
    console.log('  - Transport Document Type Code:', transportDocumentTypeCode);
    console.log('  - Receipt Type At Origin:', receiptTypeAtOrigin);
    console.log('  - Delivery Type At Destination:', deliveryTypeAtDestination);
    console.log('  - Carrier Code List Provider:', carrierCodeListProvider);
    
    console.log('🔧 Boolean Fields:');
    console.log('  - Is Shipped On Board Type:', isShippedOnBoardType);
    console.log('  - Is Electronic:', isElectronic);
    console.log('  - Is To Order:', isToOrder);
    
    console.log('📚 Array Fields:');
    console.log('  - Has Party Contact Details:', hasPartyContactDetails);
    console.log('  - Has Consignment Items:', hasConsignmentItems);
    console.log('  - Has Utilized Transport Equipments:', hasUtilizedTransportEquipments);
    console.log('  - Has Vessel Voyages:', hasVesselVoyages);

    return new ComprehensiveOptimBLFields({
        // Pattern verification fields
        transportDocumentReference: CircuitString.fromString(transportDocumentReference),
        shipperPartyName: CircuitString.fromString(shipperPartyName),
        issuingPartyName: CircuitString.fromString(issuingPartyName),
        addressCity: CircuitString.fromString(addressCity),
        countryCode: CircuitString.fromString(countryCode),
        carrierCode: CircuitString.fromString(carrierCode),
        
        // Enum verification fields
        transportDocumentTypeCode: CircuitString.fromString(transportDocumentTypeCode),
        receiptTypeAtOrigin: CircuitString.fromString(receiptTypeAtOrigin),
        deliveryTypeAtDestination: CircuitString.fromString(deliveryTypeAtDestination),
        carrierCodeListProvider: CircuitString.fromString(carrierCodeListProvider),
        
        // Boolean verification fields
        isShippedOnBoardType: Bool(isShippedOnBoardType),
        isElectronic: Bool(isElectronic),
        isToOrder: Bool(isToOrder),
        
        // Array presence verification
        hasPartyContactDetails: Bool(hasPartyContactDetails),
        hasConsignmentItems: Bool(hasConsignmentItems),
        hasUtilizedTransportEquipments: Bool(hasUtilizedTransportEquipments),
        hasVesselVoyages: Bool(hasVesselVoyages),
    });
}

function createOptimComplianceData(evalBLJsonFileName: string, evalBLJson: any): BusinessStandardOptimComplianceData {
    const expectedContent = "comprehensive_bl_verification_pattern";
    const minimalContent = evalBLJson.transportDocumentReference || "DEFAULT_REF";
    
    console.log(`Compliance data content: ${minimalContent} (${minimalContent.length} chars)`);
    
    return new BusinessStandardOptimComplianceData({
        businessStandardDataIntegrityEvaluationId: Field(0),
        expectedContent: CircuitString.fromString(expectedContent),
        actualContent: CircuitString.fromString(minimalContent),
        actualContentFilename: evalBLJsonFileName,
    });
}

export async function getBSDIOptimVerificationWithSignUtils(evalBLJsonFileName: string) {
    console.log("🚀 Starting COMPREHENSIVE ZK Business Standard Data Integrity Verification (OPTIMIZED)");
    console.log("📄 File:", evalBLJsonFileName);
    console.log("🎯 This will verify ALL requirements from data.json schema");
    
    // =================================== PRE-PROCESSING ===================================
    console.log("📖 Reading BL JSON file...");
    const evalBLJson = await readBLJsonFile(evalBLJsonFileName);
    
    // Original comprehensive validation for comparison
    console.log("🔍 Running original comprehensive validation for reference...");
    const originalValidationResult = await verifyActualFromFile(evalBLJsonFileName);
    console.log("📋 Original validation result:", originalValidationResult);
    
    // Extract ALL fields required by data.json
    console.log("🎯 Extracting comprehensive fields for ZK verification...");
    const comprehensiveFields = extractComprehensiveOptimFields(evalBLJson);
    console.log("✅ All required fields extracted successfully");
    
    // =================================== MINA SETUP ===================================
    console.log("⚙️ Setting up Mina blockchain...");
    const useProof = false;
    const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });
    Mina.setActiveInstance(Local);

    const deployerAccount = Local.testAccounts[0];
    const deployerKey = deployerAccount.key;
    const senderAccount = Local.testAccounts[1];
    const senderKey = senderAccount.key;

    console.log('🔨 Compiling comprehensive ZK program...');
    console.log('⏳ This may take longer due to comprehensive verification...');
    await BusinessStandardOptimZKProgram.compile();
    const { verificationKey } = await BusinessStandardOptimVerificationSmartContract.compile();

    const zkAppKey = PrivateKey.random();
    const zkAppAddress = zkAppKey.toPublicKey();
    const zkApp = new BusinessStandardOptimVerificationSmartContract(zkAppAddress);

    console.log("🚀 Deploying smart contract...");
    const deployTxn = await Mina.transaction(deployerAccount, async () => {
        AccountUpdate.fundNewAccount(deployerAccount);
        await zkApp.deploy({ verificationKey });
    });
    
    await deployTxn.sign([deployerKey, zkAppKey]).send();
    console.log("✅ Smart contract deployed successfully");

    // =================================== ORACLE SIGNATURE ===================================
    console.log("🔐 Generating oracle signature...");
    const complianceData = createOptimComplianceData(evalBLJsonFileName, evalBLJson);
    const complianceDataHash = Poseidon.hash(
        BusinessStandardOptimComplianceData.toFields(complianceData)
    );
    
    const registryPrivateKey = getPrivateKeyFor('BPMN');
    const oracleSignature = Signature.create(registryPrivateKey, [complianceDataHash]);

    // =================================== COMPREHENSIVE ZK PROOF ===================================
    console.log("🧮 Generating COMPREHENSIVE ZK proof...");
    console.log("🎯 Verifying ALL data.json requirements:");
    console.log("   📋 6 Pattern fields (ZKRegex: fun0, fun1, fun2)");
    console.log("   📋 4 Enum fields");
    console.log("   📋 3 Boolean fields");
    console.log("   📋 4 Array presence fields");
    console.log("🔐 This proves comprehensive compliance without revealing sensitive data");
    
    try {
        const proof = await BusinessStandardOptimZKProgram.proveCompliance(
            Field(1),                    // Public input
            CircuitString.fromString(evalBLJsonFileName), // Private input[0]
            complianceData,              // Private input[1]
            comprehensiveFields,         // Private input[2] - ALL data.json fields
            oracleSignature             // Private input[3]
        );

        console.log("🎉 COMPREHENSIVE ZK proof generated successfully!");
        console.log("🎯 Verified ALL data.json requirements in zero-knowledge!");

        // Verify proof on-chain
        console.log("🔗 Verifying comprehensive proof on blockchain...");
        console.log("📊 Initial risk value:", zkApp.risk.get().toJSON());

        const txn = await Mina.transaction(senderAccount, async () => {
            await zkApp.verifyComplianceWithProof(proof);
        });

        const proof1 = await txn.prove();
        await txn.sign([senderKey]).send();
        
        console.log("✅ SUCCESS: COMPREHENSIVE ZK proof verified on-chain!");
        console.log("📊 Final risk value:", zkApp.risk.get().toJSON());
        console.log("🎉 COMPREHENSIVE VERIFICATION COMPLETE!");
        console.log("📋 Verified:");
        console.log("   ✅ 6 Pattern fields with ZKRegex");
        console.log("   ✅ 4 Enum fields");
        console.log("   ✅ 3 Boolean fields");
        console.log("   ✅ 4 Array presence fields");
        console.log("🔐 All data.json requirements verified while preserving privacy!");
        
        return proof1;
        
    } catch (error) {
        console.error('❌ Error during comprehensive ZK proof generation:', error);
        console.log("📊 Final risk value (failed):", zkApp.risk.get().toJSON());
        throw error;
    }
}
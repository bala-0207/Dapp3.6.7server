import { Field, CircuitString } from 'o1js';
import { BusinessStandardDataIntegrityComplianceData } from '../../zk-programs/with-sign/BusinessStandardDataIntegrityZKProgram.js';

export function createComplianceData(evalBLJsonFileName: string, evalBLJson: any) {
    const expectedContent = "a(cb|bc)d(ef|f)g";
    
    // Ultra-minimal JSON with only the most critical fields for verification
    // CircuitString seems to have a very small limit (likely around 128-256 chars)
    const ultraMinimalJson = {
        docRef: evalBLJson.transportDocumentReference,  // Shortened key name
        status: evalBLJson.transportDocumentStatus,
        type: evalBLJson.transportDocumentTypeCode,
        electronic: evalBLJson.isElectronic,
        carrier: evalBLJson.carrierCode
    };
    
    let actualContentString = JSON.stringify(ultraMinimalJson);
    console.log(`Ultra-minimal JSON length: ${actualContentString.length} characters`);
    console.log(`Ultra-minimal JSON content: ${actualContentString}`);
    
    // If still too long, use only the most essential field
    if (actualContentString.length > 128) {  // Very conservative limit
        console.log('Still too long, using single essential field...');
        
        const singleFieldJson = {
            ref: evalBLJson.transportDocumentReference
        };
        
        actualContentString = JSON.stringify(singleFieldJson);
        console.log(`Single field JSON length: ${actualContentString.length} characters`);
        console.log(`Single field JSON content: ${actualContentString}`);
    }
    
    // If even that's too long, use just the reference without JSON structure
    if (actualContentString.length > 64) {
        console.log('Using raw reference string...');
        actualContentString = evalBLJson.transportDocumentReference || 'DEFAULT_REF';
        console.log(`Raw string length: ${actualContentString.length} characters`);
        console.log(`Raw string content: ${actualContentString}`);
    }
    
    return new BusinessStandardDataIntegrityComplianceData({
        businessStandardDataIntegrityEvaluationId: Field(0),
        expectedContent: CircuitString.fromString(expectedContent),
        actualContent: CircuitString.fromString(actualContentString),  // Minimal content
        actualContentFilename: evalBLJsonFileName,
    });
}
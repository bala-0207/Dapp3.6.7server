import axios from 'axios';
import * as fs from 'fs';

// declare global {
//     interface Window {
//         fs?: {
//             readFile(fileName: string, options?: { encoding: string }): Promise<string>;
//         };
//     }
// }

interface BSDIResponse {
    iec: string;
    entityName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pin: number;
    contactNo: number;
    email: string;
    iecIssueDate: string;
    exporterType: number;
    pan: string;
    iecStatus: number;
    starStatus: number;
    iecModificationDate: string;
    dataAsOn: string;
    natureOfConcern: number;
    branches: Array<{
        branchCode: number;
        badd1: string;
        badd2: string;
        city: string;
        state: string;
        pin: number;
    }>;
    directors: Array<{
        name: string;
    }>;
}

export async function fetchBSDIData(companyName: string): Promise<BSDIResponse> {
    const BASEURL = "https://0f4aef00-9db0-4057-949e-df6937e3449b.mock.pstmn.io";
    try {
        const response = await axios.get(`${BASEURL}/${companyName}`);
        console.log('BSDI API Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching BSDI data:', error.message);
        throw new Error('Failed to fetch BSDI data');
    }
}

export async function readBLJsonFile(filePath: string): Promise<any> {
    try {

        console.log(" in readBLJSON file filepath ", filePath);

        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error: any) {
        console.error('Error reading BL JSON file:', error.message);
        throw new Error('Failed to read BL JSON file');
    }
}
// export async function readBLJsonFile(fileName: string): Promise<any> {
//     try {
//         const data = await window.fs.readFile(fileName, { encoding: 'utf8' });
        
//         // Validate that it's valid JSON
//         const jsonData = JSON.parse(data);
        
//         // Optional: Add BL-specific validation here
//         if (!jsonData || typeof jsonData !== 'object') {
//             throw new Error('Invalid JSON structure in BL file');
//         }
        
//         return jsonData;
//     } catch (error: any) {
//         if (error instanceof SyntaxError) {
//             console.error('JSON parsing error:', error.message);
//             throw new Error(`Invalid JSON format in file: ${fileName}`);
//         } else {
//             console.error('Error reading BL JSON file:', error.message);
//             throw new Error(`Failed to read BL JSON file: ${fileName}`);
//         }
//     }
// }
// import axios from 'axios';
// import * as fs from 'fs';

// // Extend the Window interface to include Claude's file system API
// declare global {
//     interface Window {
//         fs?: {
//             readFile(fileName: string, options?: { encoding: string }): Promise<string>;
//         };
//     }
// }

// interface BSDIResponse {
//     iec: string;
//     entityName: string;
//     addressLine1: string;
//     addressLine2: string;
//     city: string;
//     state: string;
//     pin: number;
//     contactNo: number;
//     email: string;
//     iecIssueDate: string;
//     exporterType: number;
//     pan: string;
//     iecStatus: number;
//     starStatus: number;
//     iecModificationDate: string;
//     dataAsOn: string;
//     natureOfConcern: number;
//     branches: Array<{
//         branchCode: number;
//         badd1: string;
//         badd2: string;
//         city: string;
//         state: string;
//         pin: number;
//     }>;
//     directors: Array<{
//         name: string;
//     }>;
// }

// export async function fetchBSDIData(companyName: string): Promise<BSDIResponse> {
//     const BASEURL = "https://0f4aef00-9db0-4057-949e-df6937e3449b.mock.pstmn.io";
//     try {
//         const response = await axios.get(`${BASEURL}/${companyName}`);
//         console.log('BSDI API Response:', response.data);
//         return response.data;
//     } catch (error: any) {
//         console.error('Error fetching BSDI data:', error.message);
//         throw new Error('Failed to fetch BSDI data');
//     }
// }

// // Works both with absolute file paths (Node.js) and Claude attachments (browser)
// export async function readBLJsonFile(filePath: string): Promise<any> {
//     try {
//         let data: string;
        
//         // Check if we're in a browser environment (Claude) or Node.js
//         if (typeof window !== 'undefined' && window.fs) {
//             // Claude attachment - use browser file API
//             data = await window.fs.readFile(filePath, { encoding: 'utf8' });
//         } else {
//             // Node.js environment - use fs.promises
//             data = await fs.promises.readFile(filePath, 'utf8');
//         }
        
//         // Validate that it's valid JSON
//         const jsonData = JSON.parse(data);
        
//         // Optional: Add BL-specific validation here
//         if (!jsonData || typeof jsonData !== 'object') {
//             throw new Error('Invalid JSON structure in BL file');
//         }
        
//         return jsonData;
//     } catch (error: any) {
//         if (error instanceof SyntaxError) {
//             console.error('JSON parsing error:', error.message);
//             throw new Error(`Invalid JSON format in file: ${filePath}`);
//         } else {
//             console.error('Error reading BL JSON file:', error.message);
//             throw new Error(`Failed to read BL JSON file: ${filePath}`);
//         }
//     }
// }
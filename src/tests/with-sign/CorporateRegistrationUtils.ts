import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Cache for authentication token
let authToken: string | null = null;
let tokenExpiry: number = 0;

interface AuthResponse {
    access_token: string;
    [key: string]: any;
}

interface MasterDataRequest {
    "@entity": string;
    id: string;
    consent: string;
    reason: string;
}

/**
 * Authenticate with the API and get access token
 */
async function authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (authToken && Date.now() < tokenExpiry) {
        return authToken;
    }

    const authUrl = process.env.AUTH_URL;
    if (!authUrl) {
        throw new Error('AUTH_URL is not set in environment variables');
    }

    console.log('Authenticating with:', authUrl);

    try {
        const authResponse = await axios.post(authUrl, {}, {
            headers: {
                'x-api-key': process.env.API_KEY || '',
                'x-api-secret': process.env.API_SECRET || '',
                'x-api-version': process.env.API_VERSION || 'v3',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (authResponse.status === 200 && authResponse.data?.access_token) {
            const token = authResponse.data.access_token as string;
            authToken = token;
            // Set expiry to 50 minutes (assuming 1 hour token validity)
            tokenExpiry = Date.now() + (50 * 60 * 1000);
            console.log('Authentication successful, token received:', token.substring(0, 20) + '...');
            return token;
        } else {
            throw new Error(`Authentication failed: ${authResponse.status}`);
        }
    } catch (error: any) {
        console.error('Authentication error:', error.response?.data || error.message);
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

/**
 * Fetch master data using the authenticated token
 */
async function fetchMasterData(
    accessToken: string,
    apiUrl: string,
    cin: string
): Promise<any> {
    try {
        const body: MasterDataRequest = {
            "@entity": "in.co.sandbox.kyc.mca.master_data.request",
            id: cin,
            consent: process.env.CONSENT || 'Y',
            reason: process.env.REASON || 'basic test'
        };

        console.log('Making API request to:', apiUrl);
        console.log('Request body:', JSON.stringify(body, null, 2));

        const response = await axios.post(
            apiUrl,
            body,
            {
                headers: {
                    'Authorization': accessToken,
                    'x-api-key': process.env.API_KEY || '',
                    'x-api-version': process.env.API_VERSION || 'v3',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('Corporate Registration API Response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching master data:', error.response?.data || error.message);
        throw new Error(`Error fetching master data: ${error.response?.data || error.message}`);
    }
}

export async function fetchCorporateRegistrationData(cin: string): Promise<any> {
    let BASEURL: string | undefined;
    
    let typeOfNet = process.env.BUILD_ENV ;
    if (!typeOfNet) {
        typeOfNet = 'TESTNET';
    }
    
    console.log('Type of Network:', typeOfNet);
    console.log('CIN:', cin);
    
    if (typeOfNet === 'TESTNET') {
        console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++in sandbox++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        BASEURL = process.env.CORPREG_URL_SANDBOX_INDIA;
        if (!BASEURL) {
            throw new Error('CORPREG_URL_SANDBOX_INDIA is not set in the environment variables.');
        }
        if (!cin) {
            throw new Error('CIN is required.');
        }
        
        const accessToken = await authenticate();
        return fetchMasterData(accessToken, BASEURL, cin);
        
    } else if (typeOfNet === 'LOCAL') {
        console.log('------------------------------------------------using live API for LOCAL--------------------------------------------------');
        // Changed: LOCAL now uses live production API instead of mock
        BASEURL = process.env.CORPREG_URL_MOCK_INDIA;
        if (!BASEURL) {
            throw new Error('CORPREG_URL_MOCK_INDIA is not set in the environment variables.');
        }
        if (!cin) {
            throw new Error('CIN is required.');
        }
        
        // For LOCAL, now use authenticated live API request like production
        // const accessToken = await authenticate();
        // return fetchMasterData(accessToken, BASEURL, cin);
        const response = await axios.get(`${BASEURL}/${cin}`);
        return  response.data;
        
    } else {
        console.log('///////////////////////////////////////////////in prod//////////////////////////////////////////////');
        BASEURL = process.env.CORPREG_URL_PROD_INDIA;
        if (!BASEURL) {
            throw new Error('CORPREG_URL_PROD_INDIA is not set in the environment variables.');
        }
        if (!cin) {
            throw new Error('CIN is required.');
        }
        
        const accessToken = await authenticate();
        return fetchMasterData(accessToken, BASEURL, cin);
    }
}

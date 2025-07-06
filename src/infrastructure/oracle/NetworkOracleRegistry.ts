/**
 * Network Oracle Registry
 * Handles oracle accounts for TESTNET and MAINNET environments
 */

import { Mina, PrivateKey, PublicKey } from 'o1js';
import { OracleRegistry, OracleAccount, OracleKeyPair } from './types.js';
import { environmentManager } from '../environment/manager.js';
import { Environment } from '../environment/types.js';

export class NetworkOracleRegistry implements OracleRegistry {
  private registry: Map<string, OracleKeyPair> = new Map();
  private isInitialized = false;
  private environment: Environment;

  constructor(environment: Environment) {
    if (environment === Environment.LOCAL) {
      throw new Error('NetworkOracleRegistry cannot be used for LOCAL environment. Use LocalOracleRegistry instead.');
    }
    this.environment = environment;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log(`🔧 Initializing ${this.environment} Oracle Registry...`);

    // Load environment configuration
    const config = await environmentManager.getCurrentConfig();
    
    // Set up Mina network connection
    await this.setupMinaNetwork(config);

    // Load oracle keys
    await this.loadOracleKeys(config);

    this.isInitialized = true;
    console.log(`✅ ${this.environment} Oracle Registry initialized`);
  }

  private async setupMinaNetwork(config: any): Promise<void> {
    const networkConfig = config.network;
    
    if (!networkConfig.minaEndpoint) {
      throw new Error(`Mina endpoint not configured for ${this.environment}`);
    }

    console.log(`🌐 Connecting to ${this.environment} network: ${networkConfig.minaEndpoint}`);

    // Set up Mina network
    const network = Mina.Network({
      mina: networkConfig.minaEndpoint,
      archive: networkConfig.archiveEndpoint
    });
    
    Mina.setActiveInstance(network);

    // Set fee payer if configured
    if (networkConfig.feePayer?.privateKey) {
      const feePayerKey = PrivateKey.fromBase58(networkConfig.feePayer.privateKey);
      const feePayerAccount = feePayerKey.toPublicKey();
      
      console.log(`💰 Fee payer configured: ${feePayerAccount.toBase58()}`);
    }
  }

  private async loadOracleKeys(config: any): Promise<void> {
    const oracleConfig = config.oracles.registry;

    for (const [oracleKey, oracleData] of Object.entries(oracleConfig)) {
      if (!oracleData || typeof oracleData !== 'object') {
        console.warn(`⚠️ Invalid oracle configuration for ${oracleKey}`);
        continue;
      }

      const data = oracleData as any;

      if (!data.publicKey) {
        console.warn(`⚠️ No public key configured for oracle ${oracleKey}`);
        continue;
      }

      try {
        const publicKey = PublicKey.fromBase58(data.publicKey);
        let privateKey: PrivateKey | null = null;

        // Try to load private key (might not be available for hardware wallets)
        if (data.privateKey) {
          privateKey = PrivateKey.fromBase58(data.privateKey);
        } else {
          console.warn(`⚠️ No private key available for oracle ${oracleKey} (hardware wallet or secure storage)`);
          // For now, we'll create a placeholder - in production this would load from secure storage
          privateKey = PrivateKey.random(); // This is just a placeholder
        }

        if (privateKey) {
          this.registry.set(oracleKey, {
            publicKey,
            privateKey
          });

          console.log(`📋 Oracle ${oracleKey}: ${publicKey.toBase58()}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load oracle ${oracleKey}:`, error);
      }
    }

    if (this.registry.size === 0) {
      throw new Error(`No valid oracle keys loaded for ${this.environment}`);
    }
  }

  getPrivateKeyFor(key: string): PrivateKey {
    if (!this.isInitialized) {
      throw new Error('Oracle registry not initialized. Call initialize() first.');
    }

    const keyPair = this.registry.get(key);
    if (!keyPair) {
      throw new Error(`No private key found for oracle '${key}'. Available oracles: ${this.listOracles().join(', ')}`);
    }
    return keyPair.privateKey;
  }

  getPublicKeyFor(key: string): PublicKey {
    if (!this.isInitialized) {
      throw new Error('Oracle registry not initialized. Call initialize() first.');
    }

    const keyPair = this.registry.get(key);
    if (!keyPair) {
      throw new Error(`No public key found for oracle '${key}'. Available oracles: ${this.listOracles().join(', ')}`);
    }
    return keyPair.publicKey;
  }

  getOracleAccount(key: string): OracleAccount {
    if (!this.isInitialized) {
      throw new Error('Oracle registry not initialized. Call initialize() first.');
    }

    const keyPair = this.registry.get(key);
    if (!keyPair) {
      throw new Error(`No oracle account found for '${key}'. Available oracles: ${this.listOracles().join(', ')}`);
    }

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      role: `${key}_ORACLE`
    };
  }

  hasOracle(key: string): boolean {
    return this.registry.has(key);
  }

  listOracles(): string[] {
    return Array.from(this.registry.keys());
  }

  getDeployerAccount(oracleType: string): PublicKey {
    return this.getPublicKeyFor(oracleType);
  }

  getDeployerKey(oracleType: string): PrivateKey {
    return this.getPrivateKeyFor(oracleType);
  }

  getSenderAccount(oracleType: string): PublicKey {
    // For network environments, sender and deployer are the same for now
    // In production, you might want different accounts for different roles
    return this.getPublicKeyFor(oracleType);
  }

  getSenderKey(oracleType: string): PrivateKey {
    // For network environments, sender and deployer are the same for now
    return this.getPrivateKeyFor(oracleType);
  }

  async cleanup(): Promise<void> {
    // Clear sensitive data from memory
    this.registry.clear();
    console.log(`🧹 ${this.environment} Oracle Registry cleaned up`);
  }

  // Network-specific methods
  async validateOracleAccounts(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    for (const [oracleKey, keyPair] of this.registry.entries()) {
      try {
        // Check if the public key matches the private key
        const derivedPublicKey = keyPair.privateKey.toPublicKey();
        const isValid = derivedPublicKey.equals(keyPair.publicKey).toBoolean();
        
        results[oracleKey] = isValid;
        
        if (!isValid) {
          console.error(`❌ Oracle ${oracleKey}: Private key does not match public key`);
        } else {
          console.log(`✅ Oracle ${oracleKey}: Key pair validation passed`);
        }
      } catch (error) {
        console.error(`❌ Oracle ${oracleKey}: Validation error:`, error);
        results[oracleKey] = false;
      }
    }

    return results;
  }

  async checkAccountBalances(): Promise<{ [key: string]: string }> {
    const balances: { [key: string]: string } = {};

    for (const [oracleKey, keyPair] of this.registry.entries()) {
      try {
        // In a real implementation, you would fetch the account balance
        // For now, we'll return a placeholder
        balances[oracleKey] = 'Balance check not implemented';
        console.log(`💰 Oracle ${oracleKey}: Balance check placeholder`);
      } catch (error) {
        console.error(`❌ Oracle ${oracleKey}: Balance check error:`, error);
        balances[oracleKey] = 'Error checking balance';
      }
    }

    return balances;
  }
}

/**
 * Oracle Registry Factory
 * Creates the appropriate Oracle Registry based on the current environment
 */

import { OracleRegistry } from './types.js';
import { LocalOracleRegistry } from './LocalOracleRegistry.js';
import { NetworkOracleRegistry } from './NetworkOracleRegistry.js';
import { environmentManager } from '../environment/manager.js';
import { Environment } from '../environment/types.js';

export class OracleRegistryFactory {
  private static instance: OracleRegistry | null = null;

  /**
   * Create or get the Oracle Registry for the current environment
   */
  static async create(): Promise<OracleRegistry> {
    const currentEnv = environmentManager.getCurrentEnvironment();
    
    // If we already have an instance and it's for the same environment, return it
    if (OracleRegistryFactory.instance) {
      // Note: In a more sophisticated implementation, we'd check if the environment changed
      return OracleRegistryFactory.instance;
    }

    console.log(`🏭 Creating Oracle Registry for ${currentEnv} environment`);

    let registry: OracleRegistry;

    switch (currentEnv) {
      case Environment.LOCAL:
        registry = new LocalOracleRegistry();
        break;
      
      case Environment.TESTNET:
      case Environment.MAINNET:
        registry = new NetworkOracleRegistry(currentEnv);
        break;
      
      default:
        throw new Error(`Unsupported environment: ${currentEnv}`);
    }

    // Initialize the registry
    await registry.initialize();

    OracleRegistryFactory.instance = registry;
    return registry;
  }

  /**
   * Get the current Oracle Registry instance (must be created first)
   */
  static getInstance(): OracleRegistry {
    if (!OracleRegistryFactory.instance) {
      throw new Error('Oracle Registry not created. Call OracleRegistryFactory.create() first.');
    }
    return OracleRegistryFactory.instance;
  }

  /**
   * Reset the factory (useful for environment switching)
   */
  static async reset(): Promise<void> {
    if (OracleRegistryFactory.instance) {
      await OracleRegistryFactory.instance.cleanup();
      OracleRegistryFactory.instance = null;
    }
  }

  /**
   * Switch to a different environment
   */
  static async switchEnvironment(environment: Environment): Promise<OracleRegistry> {
    console.log(`🔄 Switching Oracle Registry to ${environment}`);
    
    // Cleanup current instance
    await OracleRegistryFactory.reset();
    
    // Switch environment in the environment manager
    await environmentManager.switchEnvironment(environment);
    
    // Create new registry for the new environment
    return await OracleRegistryFactory.create();
  }
}

// Convenience functions that mirror the old OracleRegistry.ts interface
let currentRegistry: OracleRegistry | null = null;

export async function initializeOracleRegistry(): Promise<void> {
  currentRegistry = await OracleRegistryFactory.create();
}

export function getPrivateKeyFor(key: string) {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }
  return currentRegistry.getPrivateKeyFor(key);
}

export function getPublicKeyFor(key: string) {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }
  return currentRegistry.getPublicKeyFor(key);
}

export function getDeployerAccount(oracleType: string) {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }
  return currentRegistry.getDeployerAccount(oracleType);
}

export function getDeployerKey(oracleType: string) {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }
  return currentRegistry.getDeployerKey(oracleType);
}

export function getSenderAccount(oracleType: string) {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }
  return currentRegistry.getSenderAccount(oracleType);
}

export function getSenderKey(oracleType: string) {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }
  return currentRegistry.getSenderKey(oracleType);
}

// For backward compatibility, export the specific account variables that the old system used
export async function getCompatibilityAccounts() {
  if (!currentRegistry) {
    throw new Error('Oracle Registry not initialized. Call initializeOracleRegistry() first.');
  }

  return {
    // MCA accounts
    MCAdeployerAccount: currentRegistry.getDeployerAccount('MCA'),
    MCAdeployerKey: currentRegistry.getDeployerKey('MCA'),
    MCAsenderAccount: currentRegistry.getSenderAccount('MCA'),
    MCAsenderKey: currentRegistry.getSenderKey('MCA'),

    // GLEIF accounts  
    GLEIFdeployerAccount: currentRegistry.getDeployerAccount('GLEIF'),
    GLEIFdeployerKey: currentRegistry.getDeployerKey('GLEIF'),
    GLEIFsenderAccount: currentRegistry.getSenderAccount('GLEIF'),
    GLEIFsenderKey: currentRegistry.getSenderKey('GLEIF'),

    // EXIM accounts
    EXIMdeployerAccount: currentRegistry.getDeployerAccount('EXIM'),
    EXIMdeployerKey: currentRegistry.getDeployerKey('EXIM'),
    EXIMsenderAccount: currentRegistry.getSenderAccount('EXIM'),
    EXIMsenderKey: currentRegistry.getSenderKey('EXIM'),

    // Business Process accounts
    BusinessProverdeployerAccount: currentRegistry.getDeployerAccount('BPMN'),
    BusinessProverdeployerKey: currentRegistry.getDeployerKey('BPMN'),
    BusinessProversenderAccount: currentRegistry.getSenderAccount('BPMN'),
    BusinessProversenderKey: currentRegistry.getSenderKey('BPMN'),

    // Risk accounts
    RiskProverdeployerAccount: currentRegistry.getDeployerAccount('RISK'),
    RiskProverdeployerKey: currentRegistry.getDeployerKey('RISK'),
    RiskProversenderAccount: currentRegistry.getSenderAccount('RISK'),
    RiskProversenderKey: currentRegistry.getSenderKey('RISK'),
  };
}

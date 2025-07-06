/**
 * Environment Manager
 * Centralized management of environment configurations and switching
 */

import * as dotenv from 'dotenv';
import { Environment, EnvironmentConfig, NetworkConfig, OracleConfig, DeploymentConfig } from './types.js';
import { FileBasedEnvironmentStorage } from './storage.js';

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnvironment: Environment;
  private storage: FileBasedEnvironmentStorage;
  private currentConfig: EnvironmentConfig | null = null;

  private constructor() {
    // Load from environment variable or default to LOCAL
    const envValue = process.env.BUILD_ENV || process.env.NODE_ENV || 'LOCAL';
    this.currentEnvironment = this.parseEnvironment(envValue);
    this.storage = new FileBasedEnvironmentStorage();
    
    // Load .env file
    dotenv.config();
  }

  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private parseEnvironment(value: string): Environment {
    const upperValue = value.toUpperCase();
    if (Object.values(Environment).includes(upperValue as Environment)) {
      return upperValue as Environment;
    }
    console.warn(`⚠️ Unknown environment '${value}', defaulting to LOCAL`);
    return Environment.LOCAL;
  }

  getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }

  async switchEnvironment(environment: Environment): Promise<void> {
    console.log(`🔄 Switching from ${this.currentEnvironment} to ${environment}`);
    
    // Save current config if it exists
    if (this.currentConfig) {
      await this.storage.save(this.currentEnvironment, this.currentConfig);
    }

    this.currentEnvironment = environment;
    this.currentConfig = null;

    // Load new environment config
    await this.loadCurrentConfig();
    
    console.log(`✅ Switched to ${environment} environment`);
  }

  async getCurrentConfig(): Promise<EnvironmentConfig> {
    if (!this.currentConfig) {
      await this.loadCurrentConfig();
    }
    
    if (!this.currentConfig) {
      throw new Error(`No configuration available for environment ${this.currentEnvironment}`);
    }
    
    return this.currentConfig;
  }

  private async loadCurrentConfig(): Promise<void> {
    const existingConfig = await this.storage.load(this.currentEnvironment);
    
    if (existingConfig) {
      this.currentConfig = existingConfig;
      console.log(`✅ Loaded existing config for ${this.currentEnvironment}`);
    } else {
      console.log(`ℹ️ Creating default config for ${this.currentEnvironment}`);
      this.currentConfig = this.createDefaultConfig();
      await this.storage.save(this.currentEnvironment, this.currentConfig);
    }
  }

  private createDefaultConfig(): EnvironmentConfig {
    const network = this.createDefaultNetworkConfig();
    const oracles = this.createDefaultOracleConfig();
    const deployments = this.createDefaultDeploymentConfig();

    return {
      network,
      oracles,
      deployments,
      gleifApiConfig: this.createGleifApiConfig()
    };
  }

  private createDefaultNetworkConfig(): NetworkConfig {
    switch (this.currentEnvironment) {
      case Environment.LOCAL:
        return {
          environment: Environment.LOCAL,
          proofsEnabled: false
        };
      
      case Environment.TESTNET:
        return {
          environment: Environment.TESTNET,
          minaEndpoint: process.env.MINA_TESTNET_ENDPOINT || 'https://api.minaexplorer.com/testnet/',
          minaGraphQLEndpoint: process.env.MINA_TESTNET_GRAPHQL || 'https://api.minaexplorer.com/testnet/graphql',
          archiveEndpoint: process.env.MINA_TESTNET_ARCHIVE,
          proofsEnabled: true
        };
      
      case Environment.MAINNET:
        return {
          environment: Environment.MAINNET,
          minaEndpoint: process.env.MINA_MAINNET_ENDPOINT || 'https://api.minaexplorer.com/mainnet/',
          minaGraphQLEndpoint: process.env.MINA_MAINNET_GRAPHQL || 'https://api.minaexplorer.com/mainnet/graphql',
          archiveEndpoint: process.env.MINA_MAINNET_ARCHIVE,
          proofsEnabled: true
        };
    }
  }

  private createDefaultOracleConfig(): OracleConfig {
    if (this.currentEnvironment === Environment.LOCAL) {
      // For LOCAL, we'll use test accounts (will be set up by Oracle Registry)
      return {
        registry: {
          'MCA': { publicKey: '', privateKey: '', role: 'MCA_ORACLE' },
          'GLEIF': { publicKey: '', privateKey: '', role: 'GLEIF_ORACLE' },
          'EXIM': { publicKey: '', privateKey: '', role: 'EXIM_ORACLE' },
          'BPMN': { publicKey: '', privateKey: '', role: 'BUSINESS_PROCESS_ORACLE' },
          'RISK': { publicKey: '', privateKey: '', role: 'RISK_ORACLE' },
          'BL_REGISTRY': { publicKey: '', privateKey: '', role: 'BILL_OF_LADING_ORACLE' }
        }
      };
    } else {
      // For TESTNET/MAINNET, keys will be loaded from secure storage
      return {
        registry: {
          'MCA': { publicKey: process.env.MCA_PUBLIC_KEY || '', role: 'MCA_ORACLE' },
          'GLEIF': { publicKey: process.env.GLEIF_PUBLIC_KEY || '', role: 'GLEIF_ORACLE' },
          'EXIM': { publicKey: process.env.EXIM_PUBLIC_KEY || '', role: 'EXIM_ORACLE' },
          'BPMN': { publicKey: process.env.BPMN_PUBLIC_KEY || '', role: 'BUSINESS_PROCESS_ORACLE' },
          'RISK': { publicKey: process.env.RISK_PUBLIC_KEY || '', role: 'RISK_ORACLE' },
          'BL_REGISTRY': { publicKey: process.env.BL_REGISTRY_PUBLIC_KEY || '', role: 'BILL_OF_LADING_ORACLE' }
        }
      };
    }
  }

  private createDefaultDeploymentConfig(): DeploymentConfig {
    return {
      contracts: {}
    };
  }

  private createGleifApiConfig() {
    return {
      sandboxUrl: process.env.GLEIF_URL_SANDBOX,
      prodUrl: process.env.GLEIF_URL_PROD,
      mockUrl: process.env.GLEIF_URL_MOCK
    };
  }

  async updateConfig(updates: Partial<EnvironmentConfig>): Promise<void> {
    if (!this.currentConfig) {
      await this.loadCurrentConfig();
    }

    if (this.currentConfig) {
      // Deep merge the updates
      this.currentConfig = {
        ...this.currentConfig,
        ...updates,
        network: { ...this.currentConfig.network, ...updates.network },
        oracles: { 
          ...this.currentConfig.oracles, 
          ...updates.oracles,
          registry: { ...this.currentConfig.oracles.registry, ...updates.oracles?.registry }
        },
        deployments: {
          ...this.currentConfig.deployments,
          ...updates.deployments,
          contracts: { ...this.currentConfig.deployments.contracts, ...updates.deployments?.contracts }
        }
      };

      await this.storage.save(this.currentEnvironment, this.currentConfig);
      console.log(`✅ Updated ${this.currentEnvironment} environment config`);
    }
  }

  async saveDeployment(contractName: string, address: string, verificationKey?: string, transactionHash?: string): Promise<void> {
    await this.updateConfig({
      deployments: {
        contracts: {
          [contractName]: {
            address,
            verificationKey,
            deployedAt: new Date().toISOString(),
            transactionHash
          }
        }
      }
    });
  }

  async getDeployment(contractName: string): Promise<{ address: string; verificationKey?: string } | null> {
    const config = await this.getCurrentConfig();
    const deployment = config.deployments.contracts[contractName];
    
    if (!deployment?.address) {
      return null;
    }

    return {
      address: deployment.address,
      verificationKey: deployment.verificationKey
    };
  }

  async listDeployments(): Promise<Record<string, any>> {
    const config = await this.getCurrentConfig();
    return config.deployments.contracts;
  }

  async clearDeployments(): Promise<void> {
    await this.updateConfig({
      deployments: {
        contracts: {}
      }
    });
    console.log(`✅ Cleared all deployments for ${this.currentEnvironment}`);
  }

  async backupEnvironment(): Promise<string> {
    return await this.storage.backup(this.currentEnvironment);
  }

  isLocal(): boolean {
    return this.currentEnvironment === Environment.LOCAL;
  }

  isTestnet(): boolean {
    return this.currentEnvironment === Environment.TESTNET;
  }

  isMainnet(): boolean {
    return this.currentEnvironment === Environment.MAINNET;
  }

  getEnvironmentInfo(): { environment: Environment; proofsEnabled: boolean; hasPersistedConfig: boolean } {
    return {
      environment: this.currentEnvironment,
      proofsEnabled: this.currentConfig?.network.proofsEnabled ?? false,
      hasPersistedConfig: this.currentConfig !== null
    };
  }
}

// Export singleton instance
export const environmentManager = EnvironmentManager.getInstance();

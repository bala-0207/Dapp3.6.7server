/**
 * Deployment Manager
 * Handles smart contract deployment and address persistence
 */

import { Mina, PrivateKey, PublicKey, AccountUpdate } from 'o1js';
import { environmentManager } from '../environment/manager.js';
import { OracleRegistryFactory } from '../oracle/factory.js';

export interface DeploymentResult {
  contractAddress: string;
  verificationKey: string;
  transactionHash?: string;
  deployedAt: string;
  environment: string;
}

export interface ContractDeployment {
  address: string;
  verificationKey?: string;
  deployedAt?: string;
  transactionHash?: string;
}

export class DeploymentManager {
  private static instance: DeploymentManager;

  private constructor() {}

  static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  /**
   * Deploy a smart contract and persist the address
   */
  async deployContract<T>(
    contractName: string,
    contractClass: new (address: PublicKey) => T,
    deployerType: string,
    deploymentOptions?: {
      useExisting?: boolean;
      privateKey?: PrivateKey;
      verificationKey?: any;
    }
  ): Promise<{ contract: T; deployment: DeploymentResult }> {
    const environment = environmentManager.getCurrentEnvironment();
    console.log(`🚀 Deploying ${contractName} to ${environment}...`);

    // Check if contract already exists and we should reuse it
    if (deploymentOptions?.useExisting) {
      const existing = await this.getExistingDeployment(contractName);
      if (existing) {
        console.log(`♻️ Reusing existing ${contractName}: ${existing.address}`);
        const contract = new contractClass(PublicKey.fromBase58(existing.address));
        return {
          contract,
          deployment: {
            contractAddress: existing.address,
            verificationKey: existing.verificationKey || '',
            transactionHash: existing.transactionHash,
            deployedAt: existing.deployedAt || new Date().toISOString(),
            environment
          }
        };
      }
    }

    // Get oracle registry for deployment accounts
    const oracleRegistry = await OracleRegistryFactory.create();
    const deployerAccount = oracleRegistry.getDeployerAccount(deployerType);
    const deployerKey = oracleRegistry.getDeployerKey(deployerType);

    // Generate contract key pair
    const contractPrivateKey = deploymentOptions?.privateKey || PrivateKey.random();
    const contractAddress = contractPrivateKey.toPublicKey();

    // Create contract instance
    const contract = new contractClass(contractAddress);

    console.log(`📋 Contract Address: ${contractAddress.toBase58()}`);
    console.log(`👤 Deployer: ${deployerAccount.toBase58()}`);

    try {
      // Compile contract if verification key not provided
      let verificationKey = deploymentOptions?.verificationKey;
      if (!verificationKey) {
        console.log('🔧 Compiling contract...');
        const compilation = await (contract as any).compile();
        verificationKey = compilation.verificationKey;
        console.log('✅ Contract compiled');
      }

      // Deploy the contract
      console.log('📤 Deploying contract...');
      const deployTxn = await Mina.transaction(
        deployerAccount,
        async () => {
          AccountUpdate.fundNewAccount(deployerAccount);
          await (contract as any).deploy({ verificationKey });
        }
      );

      await deployTxn.sign([deployerKey, contractPrivateKey]).send();
      console.log('✅ Contract deployed successfully');

      // Create deployment result
      const deployment: DeploymentResult = {
        contractAddress: contractAddress.toBase58(),
        verificationKey: JSON.stringify(verificationKey),
        deployedAt: new Date().toISOString(),
        environment
      };

      // Persist deployment information
      await this.saveDeployment(contractName, deployment);

      console.log(`🎉 ${contractName} deployed successfully to ${environment}`);
      console.log(`📍 Address: ${deployment.contractAddress}`);

      return { contract, deployment };

    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error);
      throw error;
    }
  }

  /**
   * Get an existing contract deployment
   */
  async getExistingDeployment(contractName: string): Promise<ContractDeployment | null> {
    try {
      const deployment = await environmentManager.getDeployment(contractName);
      return deployment;
    } catch (error) {
      console.log(`ℹ️ No existing deployment found for ${contractName}`);
      return null;
    }
  }

  /**
   * Save deployment information
   */
  private async saveDeployment(contractName: string, deployment: DeploymentResult): Promise<void> {
    await environmentManager.saveDeployment(
      contractName,
      deployment.contractAddress,
      deployment.verificationKey,
      deployment.transactionHash
    );
  }

  /**
   * Get a deployed contract instance
   */
  async getContract<T>(
    contractName: string,
    contractClass: new (address: PublicKey) => T
  ): Promise<T | null> {
    const deployment = await this.getExistingDeployment(contractName);
    
    if (!deployment) {
      return null;
    }

    try {
      const address = PublicKey.fromBase58(deployment.address);
      return new contractClass(address);
    } catch (error) {
      console.error(`❌ Failed to create contract instance for ${contractName}:`, error);
      return null;
    }
  }

  /**
   * List all deployments for current environment
   */
  async listDeployments(): Promise<Record<string, ContractDeployment>> {
    return await environmentManager.listDeployments();
  }

  /**
   * Clear all deployments for current environment
   */
  async clearDeployments(): Promise<void> {
    await environmentManager.clearDeployments();
  }

  /**
   * Check if a contract is deployed
   */
  async isDeployed(contractName: string): Promise<boolean> {
    const deployment = await this.getExistingDeployment(contractName);
    return deployment !== null;
  }

  /**
   * Deploy multiple contracts
   */
  async deployMultipleContracts(
    deployments: Array<{
      name: string;
      contractClass: new (address: PublicKey) => any;
      deployerType: string;
      options?: any;
    }>
  ): Promise<Record<string, DeploymentResult>> {
    const results: Record<string, DeploymentResult> = {};

    for (const deployment of deployments) {
      try {
        const result = await this.deployContract(
          deployment.name,
          deployment.contractClass,
          deployment.deployerType,
          deployment.options
        );
        results[deployment.name] = result.deployment;
      } catch (error) {
        console.error(`❌ Failed to deploy ${deployment.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Redeploy a contract (useful for development)
   */
  async redeployContract<T>(
    contractName: string,
    contractClass: new (address: PublicKey) => T,
    deployerType: string,
    options?: any
  ): Promise<{ contract: T; deployment: DeploymentResult }> {
    console.log(`🔄 Redeploying ${contractName}...`);
    
    // Force new deployment by not using existing
    const deploymentOptions = {
      ...options,
      useExisting: false
    };

    return await this.deployContract(contractName, contractClass, deployerType, deploymentOptions);
  }

  /**
   * Get deployment summary
   */
  async getDeploymentSummary(): Promise<{
    environment: string;
    totalDeployments: number;
    deployments: Array<{
      name: string;
      address: string;
      deployedAt?: string;
    }>;
  }> {
    const environment = environmentManager.getCurrentEnvironment();
    const deployments = await this.listDeployments();
    
    const deploymentList = Object.entries(deployments).map(([name, deployment]) => ({
      name,
      address: deployment.address,
      deployedAt: deployment.deployedAt
    }));

    return {
      environment,
      totalDeployments: deploymentList.length,
      deployments: deploymentList
    };
  }
}

// Export singleton instance
export const deploymentManager = DeploymentManager.getInstance();

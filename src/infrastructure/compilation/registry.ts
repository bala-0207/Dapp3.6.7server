/**
 * Compilation Registry
 * Central registry of all ZK programs and smart contracts for compilation
 */

import { CompilationItem, CompilationCategory } from './types.js';

export const COMPILATION_REGISTRY: CompilationItem[] = [
  // ===== BASIC ZK PROGRAMS =====
  {
    name: 'GLEIFOptim',
    category: CompilationCategory.ZK_PROGRAM,
    loader: () => import('../../zk-programs/with-sign/GLEIFOptimZKProgram.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'CorporateRegistrationOptim',
    category: CompilationCategory.ZK_PROGRAM,
    loader: () => import('../../zk-programs/with-sign/CorporateRegistrationOptimZKProgram.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'EXIMOptim',
    category: CompilationCategory.ZK_PROGRAM,
    loader: () => import('../../zk-programs/with-sign/EXIMOptimZKProgram.js'),
    compilationOrder: 1,
    enabled: true
  },

  // ===== BUSINESS PROCESS PROGRAMS =====
  {
    name: 'BusinessProcessIntegrityOptimMerkle',
    category: CompilationCategory.BUSINESS_PROCESS,
    loader: () => import('../../zk-programs/with-sign/BusinessProcessIntegrityOptimMerkleZKProgramWithSign.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'BusinessStandardDataIntegrity',
    category: CompilationCategory.BUSINESS_PROCESS,
    loader: () => import('../../zk-programs/with-sign/BusinessStandardDataIntegrityZKProgram.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'BusinessStandardOptim',
    category: CompilationCategory.BUSINESS_PROCESS,
    loader: () => import('../../zk-programs/with-sign/BusinessStandardOptimZKProgram.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'BusinessStdIntegrityOptimMerkle',
    category: CompilationCategory.BUSINESS_PROCESS,
    loader: () => import('../../zk-programs/with-sign/BusinessStdIntegrityOptimMerkleZKProgramWithSign.js'),
    compilationOrder: 1,
    enabled: true
  },

  // ===== RISK & LIQUIDITY PROGRAMS =====
  {
    name: 'RiskLiquidityAdvancedOptimMerkle',
    category: CompilationCategory.RISK_LIQUIDITY,
    loader: () => import('../../zk-programs/with-sign/RiskLiquidityAdvancedOptimMerkleZKProgramWithSign.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'RiskLiquidityBasel3OptimMerkle',
    category: CompilationCategory.RISK_LIQUIDITY,
    loader: () => import('../../zk-programs/with-sign/RiskLiquidityBasel3OptimMerkleZKProgramWithSign.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'RiskLiquidityStableCoinOptimMerkle',
    category: CompilationCategory.RISK_LIQUIDITY,
    loader: () => import('../../zk-programs/with-sign/RiskLiquidityStableCoinOptimMerkleZKProgramWithSign.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'RiskLiquidityACTUSBasel3',
    category: CompilationCategory.RISK_LIQUIDITY,
    loader: () => import('../../zk-programs/with-sign/RiskLiquidityACTUSZKProgram_basel3_Withsign.js'),
    compilationOrder: 1,
    enabled: true
  },
  {
    name: 'StablecoinProofOfReservesRisk',
    category: CompilationCategory.RISK_LIQUIDITY,
    loader: () => import('../../zk-programs/with-sign/StablecoinProofOfReservesRiskZKProgramWithSign.js'),
    compilationOrder: 1,
    enabled: true
  },

  // ===== SMART CONTRACTS =====
  {
    name: 'GLEIFOptimMultiCompanySmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/GLEIFOptimMultiCompanySmartContract.js'),
    dependencies: ['GLEIFOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'CorporateRegistrationOptimSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/CorporateRegistrationOptimSmartContract.js'),
    dependencies: ['CorporateRegistrationOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'CorporateRegistrationOptimMultiCompanySmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/CorporateRegistrationOptimMultiCompanySmartContract.js'),
    dependencies: ['CorporateRegistrationOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'CorporateRegistrationOptimSingleCompanySmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/CorporateRegistrationOptimSingleCompanySmartContract.js'),
    dependencies: ['CorporateRegistrationOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'EXIMOptimSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/EXIMOptimSmartContract.js'),
    dependencies: ['EXIMOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'EXIMOptimMultiCompanySmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/EXIMOptimMultiCompanySmartContract.js'),
    dependencies: ['EXIMOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'EXIMOptimSingleCompanySmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/EXIMOptimSingleCompanySmartContract.js'),
    dependencies: ['EXIMOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'BusinessStandardOptimVerificationSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/BusinessStandardOptimVerificationSmartContract.js'),
    dependencies: ['BusinessStandardOptim'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'BusinessStdIntegrityOptimMerkleSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/BusinessStdIntegrityOptimMerkleSmartContract.js'),
    dependencies: ['BusinessStdIntegrityOptimMerkle'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'RiskLiquidityAdvancedOptimMerkleSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/RiskLiquidityAdvancedOptimMerkleSmartContract.js'),
    dependencies: ['RiskLiquidityAdvancedOptimMerkle'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'RiskLiquidityBasel3OptimMerkleSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/RiskLiquidityBasel3OptimMerkleSmartContract.js'),
    dependencies: ['RiskLiquidityBasel3OptimMerkle'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'RiskLiquidityStableCoinOptimMerkleSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/RiskLiquidityStableCoinOptimMerkleSmartContract.js'),
    dependencies: ['RiskLiquidityStableCoinOptimMerkle'],
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'RiskLiquidityOptimMerkleSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/RiskLiquidityOptimMerkleSmartContract.js'),
    dependencies: ['RiskLiquidityAdvancedOptimMerkle'], // Assuming it uses the advanced version
    compilationOrder: 2,
    enabled: true
  },
  {
    name: 'StablecoinProofOfReservesRiskVerifierSmartContract',
    category: CompilationCategory.SMART_CONTRACT,
    loader: () => import('../../contracts/with-sign/StablecoinProofOfReservesRiskVerifierSmartContract.js'),
    dependencies: ['StablecoinProofOfReservesRisk'],
    compilationOrder: 2,
    enabled: true
  }
];

/**
 * Get compilation items by category
 */
export function getCompilationsByCategory(category: CompilationCategory): CompilationItem[] {
  return COMPILATION_REGISTRY.filter(item => item.category === category && item.enabled !== false);
}

/**
 * Get compilation item by name
 */
export function getCompilationByName(name: string): CompilationItem | undefined {
  return COMPILATION_REGISTRY.find(item => item.name === name);
}

/**
 * Get compilations in dependency order
 */
export function getCompilationsInOrder(): CompilationItem[] {
  return COMPILATION_REGISTRY
    .filter(item => item.enabled !== false)
    .sort((a, b) => a.compilationOrder - b.compilationOrder);
}

/**
 * Get dependencies for a compilation
 */
export function getDependencies(name: string): string[] {
  const item = getCompilationByName(name);
  return item?.dependencies || [];
}

/**
 * Get all compilation names
 */
export function getAllCompilationNames(): string[] {
  return COMPILATION_REGISTRY
    .filter(item => item.enabled !== false)
    .map(item => item.name);
}

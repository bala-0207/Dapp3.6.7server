/**
 * Simple Infrastructure Test
 * Verifies the new infrastructure system works correctly
 */

import * as dotenv from 'dotenv';
dotenv.config();

async function testInfrastructure() {
  try {
    console.log('🔧 Testing Infrastructure System...');

    // Test environment manager
    console.log('\n1️⃣ Testing Environment Manager...');
    const { environmentManager } = await import('./build/infrastructure/environment/manager.js');
    const currentEnv = environmentManager.getCurrentEnvironment();
    console.log(`✅ Current environment: ${currentEnv}`);

    const envInfo = environmentManager.getEnvironmentInfo();
    console.log(`✅ Environment info:`, envInfo);

    // Test oracle registry
    console.log('\n2️⃣ Testing Oracle Registry...');
    const { OracleRegistryFactory } = await import('./build/infrastructure/oracle/factory.js');
    const oracleRegistry = await OracleRegistryFactory.create();
    console.log('✅ Oracle registry created');

    const oracles = oracleRegistry.listOracles();
    console.log(`✅ Available oracles: ${oracles.join(', ')}`);

    // Test a specific oracle
    const gleifPublicKey = oracleRegistry.getPublicKeyFor('GLEIF');
    console.log(`✅ GLEIF oracle public key: ${gleifPublicKey.toBase58()}`);

    // Test compilation manager
    console.log('\n3️⃣ Testing Compilation Manager...');
    const { compilationManager } = await import('./build/infrastructure/compilation/manager.js');
    await compilationManager.initialize();
    console.log('✅ Compilation manager initialized');

    const stats = compilationManager.getStats();
    console.log(`✅ Compilation stats:`, stats);

    // Test deployment manager
    console.log('\n4️⃣ Testing Deployment Manager...');
    const { deploymentManager } = await import('./build/infrastructure/deployment/manager.js');
    const deploymentSummary = await deploymentManager.getDeploymentSummary();
    console.log(`✅ Deployment summary:`, deploymentSummary);

    console.log('\n🎉 Infrastructure test completed successfully!');
    console.log('\n📊 System Status:');
    console.log(`  • Environment: ${currentEnv}`);
    console.log(`  • Oracles Available: ${oracles.length}`);
    console.log(`  • Programs Available: ${stats.totalPrograms}`);
    console.log(`  • Deployments: ${deploymentSummary.totalDeployments}`);

  } catch (error) {
    console.error('❌ Infrastructure test failed:', error);
    throw error;
  }
}

// Run test
testInfrastructure().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});

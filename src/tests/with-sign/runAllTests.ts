import { execSync } from 'child_process';

function runAllTests() {
   try {
      // 1) Build the project (if needed)
      //execSync('npm run build', { stdio: 'inherit' });

      // 2) Run each of the generated JS files
      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------CorporateRegistrationVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/CorporateRegistrationVerificationTestWithSign.js', { stdio: 'inherit' });
      // CorporateRegistrationVerificationTestWithSign();

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------EXIMVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/EXIMVerificationTestWithSign.js', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------GLEIFVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/GLEIFVerificationTestWithSign.js', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------ComposedRecurrsiveSCF3LevelProofs.js----------------------------------------');
      execSync('node ./build/tests/with-sign/ComposedRecurrsiveSCF3LevelProofs.js', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------BusinessStandardDataIntegrityVerificationTest.js----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------BusinessProcessIntegrityVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessProcessIntegrityVerificationTestWithSign.js "a(cb|bc)d(ef|f)g" "abcdefg"', { stdio: 'inherit' });

      console.log('----------------------------------BusinessProcessIntegrityVerificationFileTest.js that generates result.txt----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessProcessIntegrityVerificationFileTest.js src/data/scf/process/bpmn-SCF-Example-Process-Expected.bpmn src/data/scf/process/bpmn-SCF-Example-Execution-Actual-Accepted-1.bpmn result.txt', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------RiskLiquidityACTUSVerifierTest_adv_zk_WithSign.js true----------------------------------------');
      execSync(' node ./build/tests/with-sign/RiskLiquidityACTUSVerifierTest_adv_zk_WithSign.js 8 ', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------RiskLiquidityACTUSVerifierTest_adv_zk_WithSign.js false----------------------------------------');
      execSync(' node ./build/tests/with-sign/RiskLiquidityACTUSVerifierTest_adv_zk_WithSign.js 9 ', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------RiskLiquidityACTUSVerifierTest_basel3_Withsign.js ""pass""----------------------------------------');
      execSync('node build/tests/with-sign/RiskLiquidityACTUSVerifierTest_basel3_Withsign.js 0.5', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------RiskLiquidityACTUSVerifierTest_basel3_Withsign.js ""pass""----------------------------------------');
      execSync('node build/tests/with-sign/RiskLiquidityACTUSVerifierTest_basel3_Withsign.js 1', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------RiskLiquidityACTUSVerifierTest_basel3_Withsign.js ""fail""----------------------------------------');
      execSync('node build/tests/with-sign/RiskLiquidityACTUSVerifierTest_basel3_Withsign.js 2', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------ComposedRecursive3LevelVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/ComposedRecursive3LevelVerificationTestWithSign.js', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------BusinessStandardDataIntegrity=> \src\data\scf\BILLOFLADING\BOL-VALID-1.json----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js .\src\data\scf\BILLOFLADING\BOL-VALID-1.json', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------BusinessStandardDataIntegrity=> \src\data\scf\BILLOFLADING\BOL-VALID-2.json----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js .\src\data\scf\BILLOFLADING\BOL-VALID-2.json', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------BusinessStandardDataIntegrity=> \src\data\scf\BILLOFLADING\BOL-INVALID-1.json----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js .\src\data\scf\BILLOFLADING\BOL-INVALID-1.json', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------BusinessStandardDataIntegrity=> \src\data\scf\BILLOFLADING\BOL-INVALID-2.json----------------------------------------');
      execSync('node ./build/tests/with-sign/BusinessStandardDataIntegrityVerificationTest.js .\src\data\scf\BILLOFLADING\BOL-INVALID-2.json', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('---------------------------------/build/tests/with-sign/RiskLiquidityBasel3OptimMerkleVerificationTestWithSign.js 100 100 http://98.84.165.146:8083/eventsBatch src/data/RISK/Basel3/CONFIG/basel3-VALID-2.json----------------------------------------');
      execSync('node ./build/tests/with-sign/RiskLiquidityBasel3OptimMerkleVerificationTestWithSign.js 100 100 http://98.84.165.146:8083/eventsBatch src/data/RISK/Basel3/CONFIG/basel3-VALID-2.json', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/CorporateRegistrationOptimSingleCompanyVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/CorporateRegistrationOptimSingleCompanyVerificationTestWithSign.js "U01112TZ2022PTC039493"', { stdio: 'inherit' });
      
      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/CorporateRegistrationOptimMultiCompanyVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/CorporateRegistrationOptimMultiCompanyVerificationTestWithSign.js "U01112TZ2022PTC039493"', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/EXIMOptimSingleCompanyVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/EXIMOptimSingleCompanyVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED"', { stdio: 'inherit' });

      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/EXIMOptimMultiCompanyVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/EXIMOptimMultiCompanyVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED"', { stdio: 'inherit' });
      
      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/GLEIFOptimSingleCompanyVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/GLEIFOptimSingleCompanyVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED"', { stdio: 'inherit' });
      
      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/GLEIFOptimMultiCompanyVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/GLEIFOptimMultiCompanyVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED"', { stdio: 'inherit' });
      
      console.log('------------------------------------------------------------------------------------------------------------------------');
      console.log('----------------------------------/build/tests/with-sign/ComposedRecursiveOptim3LevelVerificationTestWithSign.js----------------------------------------');
      execSync('node ./build/tests/with-sign/ComposedRecursiveOptim3LevelVerificationTestWithSign.js "SREE PALANI ANDAVAR AGROS PRIVATE LIMITED" "U01112TZ2022PTC039493"', { stdio: 'inherit' });
      


      console.log('All tests finished successfully.');
   } catch (error) {
      console.error('Error running one of the scripts:', error);
      process.exit(1);
   }
}

// Run when this file executes
runAllTests();

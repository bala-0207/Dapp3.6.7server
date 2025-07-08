import dotenv from 'dotenv';
dotenv.config();

import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { logger } from '../utils/logger.js';

export interface ToolExecutionResult {
  success: boolean;
  result: any;
  executionTime: string;
}

export interface ZKExecutorConfig {
  stdioPath: string;
  stdioBuildPath: string;
  timeout: number;
  executionMode: 'spawn' | 'direct';
}

/**
 * Integrated ZK Tool Executor for ZK-PRET Backend
 * This executes the actual ZK-PRET tools from the backend codebase
 */
export class ZKToolExecutor {
  private config: ZKExecutorConfig;

  constructor() {
    console.log('=== INTEGRATED ZK-TOOL EXECUTOR INITIALIZATION ===');
    console.log('DEBUG: process.env.ZK_PRET_STDIO_PATH =', process.env.ZK_PRET_STDIO_PATH);

    // Use current directory as the base path since we're integrated
    this.config = {
      stdioPath: process.env.ZK_PRET_STDIO_PATH || process.cwd(),
      stdioBuildPath: process.env.ZK_PRET_STDIO_BUILD_PATH || './build/src/tests/with-sign',
      timeout: parseInt(process.env.ZK_PRET_SERVER_TIMEOUT || '1800000'),
      executionMode: (process.env.ZK_PRET_EXECUTION_MODE as 'spawn' | 'direct') || 'direct'
    };

    console.log('DEBUG: Final stdioPath =', this.config.stdioPath);
    console.log('DEBUG: Final stdioBuildPath =', this.config.stdioBuildPath);
    console.log('DEBUG: Final timeout =', this.config.timeout);
    console.log('DEBUG: Final executionMode =', this.config.executionMode);
    console.log('=====================================');
  }

  async initialize(): Promise<void> {
    try {
      // Add timeout to health check to prevent hanging
      const healthCheckPromise = this.healthCheck();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout after 10 seconds')), 10000);
      });
      
      await Promise.race([healthCheckPromise, timeoutPromise]);
      logger.info('Integrated ZK Tool Executor initialized successfully');
    } catch (error) {
      logger.warn('Integrated ZK Tool Executor initialization failed', {
        error: error instanceof Error ? error.message : String(error),
        stdioPath: this.config.stdioPath
      });
      // Don't throw error - allow server to start even if health check fails
      console.log('⚠️  Health check failed but continuing server startup...');
    }
  }

  async healthCheck(): Promise<{ connected: boolean; status?: any }> {
    try {
      console.log('=== INTEGRATED ZK EXECUTOR HEALTH CHECK ===');
      console.log('Checking path:', this.config.stdioPath);

      // Use synchronous file access to avoid hanging
      const fs = await import('fs');
      
      // Check main path synchronously
      if (!fs.existsSync(this.config.stdioPath)) {
        console.log('❌ Main path does not exist');
        return { connected: false };
      }
      console.log('✅ Main path exists');

      const buildPath = path.join(this.config.stdioPath, this.config.stdioBuildPath);
      console.log('Checking build path:', buildPath);
      
      // Check if build directory exists synchronously
      if (!fs.existsSync(buildPath)) {
        console.log('⚠️  Build path does not exist, will try to build first');
      } else {
        console.log('✅ Build path exists');
      }

      // Check for key compiled JavaScript files instead of TypeScript sources
      const compiledFiles = [
        'GLEIFOptimMultiCompanyVerificationTestWithSign.js',
        'CorporateRegistrationOptimMultiCompanyVerificationTestWithSign.js',
        'EXIMOptimMultiCompanyVerificationTestWithSign.js'
      ];

      console.log('Checking for compiled JavaScript files:');
      let foundCompiledFiles = 0;
      for (const file of compiledFiles) {
        const filePath = path.join(this.config.stdioPath, this.config.stdioBuildPath, file);
        if (fs.existsSync(filePath)) {
          console.log(`✅ Found: ${file}`);
          foundCompiledFiles++;
        } else {
          console.log(`❌ Missing: ${file}`);
        }
      }

      console.log('=========================');

      return {
        connected: foundCompiledFiles > 0,
        status: { 
          mode: 'integrated-server', 
          path: this.config.stdioPath, 
          buildPath,
          compiledFilesFound: foundCompiledFiles,
          totalCompiledFiles: compiledFiles.length
        }
      };
    } catch (error) {
      console.log('❌ Integrated ZK Executor Health Check Failed:', error instanceof Error ? error.message : String(error));
      return { connected: false };
    }
  }

  getAvailableTools(): string[] {
    return [
      'get-GLEIF-verification-with-sign',
      'get-Corporate-Registration-verification-with-sign',
      'get-EXIM-verification-with-sign',
      'get-Composed-Compliance-verification-with-sign',
      'get-BSDI-compliance-verification',
      'get-BPI-compliance-verification',
      'get-RiskLiquidityACTUS-Verifier-Test_adv_zk',
      'get-RiskLiquidityACTUS-Verifier-Test_Basel3_Withsign',
      'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign',
      'get-RiskLiquidityAdvancedOptimMerkle-verification-with-sign',
      'get-StablecoinProofOfReservesRisk-verification-with-sign',
      'execute-composed-proof-full-kyc',
      'execute-composed-proof-financial-risk',
      'execute-composed-proof-business-integrity',
      'execute-composed-proof-comprehensive'
    ];
  }

  async executeTool(toolName: string, parameters: any = {}): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      console.log('=== INTEGRATED SERVER TOOL EXECUTION START ===');
      console.log('Tool Name:', toolName);
      console.log('Parameters:', JSON.stringify(parameters, null, 2));

      const result = await this.executeIntegratedTool(toolName, parameters);
      const executionTime = Date.now() - startTime;

      console.log('=== INTEGRATED SERVER TOOL EXECUTION SUCCESS ===');
      console.log('Execution Time:', `${executionTime}ms`);
      console.log('Result Success:', result.success);
      console.log('==============================');

      return {
        success: result.success,
        result: result.result || {
          status: result.success ? 'completed' : 'failed',
          zkProofGenerated: result.success,
          timestamp: new Date().toISOString(),
          output: result.output || '',
          executionMode: 'integrated-server'
        },
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.log('=== INTEGRATED SERVER TOOL EXECUTION FAILED ===');
      console.log('Error:', error instanceof Error ? error.message : String(error));
      console.log('Execution Time:', `${executionTime}ms`);
      console.log('=============================');

      return {
        success: false,
        result: {
          status: 'failed',
          zkProofGenerated: false,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          executionMode: 'integrated-server'
        },
        executionTime: `${executionTime}ms`
      };
    }
  }

  async executeIntegratedTool(toolName: string, parameters: any = {}): Promise<any> {
    // Map tool names to actual TypeScript files in the backend
    const toolScriptMap: Record<string, string> = {
      'get-GLEIF-verification-with-sign': 'GLEIFOptimMultiCompanyVerificationTestWithSign.js',
      'get-Corporate-Registration-verification-with-sign': 'CorporateRegistrationOptimMultiCompanyVerificationTestWithSign.js',
      'get-EXIM-verification-with-sign': 'EXIMOptimMultiCompanyVerificationTestWithSign.js',
      'get-Composed-Compliance-verification-with-sign': 'ComposedRecursiveOptim3LevelVerificationTestWithSign.js',
      'get-BSDI-compliance-verification': 'BusinessStdIntegrityOptimMerkleVerificationTestWithSign.js',
      'get-BPI-compliance-verification': 'BusinessProcessIntegrityOptimMerkleVerificationFileTestWithSign.js',
      'get-RiskLiquidityACTUS-Verifier-Test_adv_zk': 'RiskLiquidityAdvancedOptimMerkleVerificationTestWithSign.js',
      'get-RiskLiquidityACTUS-Verifier-Test_Basel3_Withsign': 'RiskLiquidityBasel3OptimMerkleVerificationTestWithSign.js',
      'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign': 'RiskLiquidityBasel3OptimMerkleVerificationTestWithSign.js',
      'get-RiskLiquidityAdvancedOptimMerkle-verification-with-sign': 'RiskLiquidityAdvancedOptimMerkleVerificationTestWithSign.js',
      'get-StablecoinProofOfReservesRisk-verification-with-sign': 'RiskLiquidityStableCoinOptimMerkleVerificationTestWithSign.js',
      'execute-composed-proof-full-kyc': 'ComposedRecursiveOptim3LevelVerificationTestWithSign.js',
      'execute-composed-proof-financial-risk': 'ComposedRecursiveOptim3LevelVerificationTestWithSign.js',
      'execute-composed-proof-business-integrity': 'ComposedRecursiveOptim3LevelVerificationTestWithSign.js',
      'execute-composed-proof-comprehensive': 'ComposedRecursiveOptim3LevelVerificationTestWithSign.js'
    };

    const scriptFile = toolScriptMap[toolName];
    if (!scriptFile) {
      throw new Error(`Unknown tool: ${toolName}. Available tools: ${Object.keys(toolScriptMap).join(', ')}`);
    }

    console.log('=== INTEGRATED SERVER TOOL EXECUTION ===');
    console.log('Tool Name:', toolName);
    console.log('Script File:', scriptFile);
    console.log('============================');

    return await this.executeCompiledScript(scriptFile, parameters, toolName);
  }

  async executeCompiledScript(scriptFile: string, parameters: any = {}, toolName?: string): Promise<any> {
    const compiledScriptPath = path.join(this.config.stdioPath, this.config.stdioBuildPath, scriptFile);

    console.log('🔍 Checking for compiled JavaScript file...');
    console.log('Expected compiled script path:', compiledScriptPath);

    if (!existsSync(compiledScriptPath)) {
      console.log('❌ Compiled JavaScript file not found');
      console.log('🔧 Attempting to build the project first...');

      const buildSuccess = await this.buildProject();
      if (!buildSuccess) {
        throw new Error(`Compiled JavaScript file not found: ${compiledScriptPath}. Please run 'npm run build' first.`);
      }

      if (!existsSync(compiledScriptPath)) {
        throw new Error(`Build completed but compiled file still not found: ${compiledScriptPath}`);
      }
    }

    console.log('✅ Compiled JavaScript file found');
    
    // Force direct execution for BPI tool to ensure it works properly
    if (toolName === 'get-BPI-compliance-verification') {
      console.log('🎯 BPI Tool detected - FORCING direct execution mode for reliability');
      return await this.executeDirectly(compiledScriptPath, parameters, toolName);
    }
    
    // Force direct execution for BSDI tool to ensure it works properly  
    if (toolName === 'get-BSDI-compliance-verification') {
      console.log('🎯 BSDI Tool detected - FORCING direct execution mode for reliability');
      return await this.executeDirectly(compiledScriptPath, parameters, toolName);
    }
    
    // Force direct execution for Basel3 tool to ensure it works properly  
    if (toolName === 'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign') {
      console.log('🎯 Basel3 Tool detected - FORCING direct execution mode for reliability');
      return await this.executeDirectly(compiledScriptPath, parameters, toolName);
    }
    
    // Force direct execution for Stablecoin tool to ensure it works properly  
    if (toolName === 'get-StablecoinProofOfReservesRisk-verification-with-sign') {
      console.log('🎯 Stablecoin Tool detected - FORCING direct execution mode for reliability');
      return await this.executeDirectly(compiledScriptPath, parameters, toolName);
    }
    
    // Force direct execution for Advanced Risk tool to ensure it works properly  
    if (toolName === 'get-RiskLiquidityAdvancedOptimMerkle-verification-with-sign') {
      console.log('🎯 Advanced Risk Tool detected - FORCING direct execution mode for reliability');
      return await this.executeDirectly(compiledScriptPath, parameters, toolName);
    }
    
    // Choose execution mode based on configuration for other tools
    if (this.config.executionMode === 'direct') {
      console.log('🚀 Executing via direct execution...');
      return await this.executeDirectly(compiledScriptPath, parameters, toolName);
    } else {
      console.log('🚀 Executing via spawned process...');
      return await this.executeJavaScriptFile(compiledScriptPath, parameters, toolName);
    }
  }

  async buildProject(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🔨 Building ZK-PRET project...');
      console.log('Working directory:', this.config.stdioPath);

      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: this.config.stdioPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      buildProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        console.log('📤 BUILD-STDOUT:', output.trim());
      });

      buildProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        console.log('📥 BUILD-STDERR:', output.trim());
      });

      buildProcess.on('close', (code: number | null) => {
        if (code === 0) {
          console.log('✅ Project build completed successfully');
          resolve(true);
        } else {
          console.log('❌ Project build failed with exit code:', code);
          console.log('Build STDERR:', stderr);
          console.log('Build STDOUT:', stdout);
          resolve(false);
        }
      });

      buildProcess.on('error', (error: Error) => {
        console.log('❌ Build process error:', error.message);
        resolve(false);
      });
    });
  }

  async executeDirectly(scriptPath: string, parameters: any = {}, toolName?: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      console.log('=== INTEGRATED SERVER DIRECT EXECUTION DEBUG ===');
      console.log('Script Path:', scriptPath);
      console.log('Working Directory:', this.config.stdioPath);
      console.log('Tool Name:', toolName);
      console.log('Parameters:', JSON.stringify(parameters, null, 2));
      console.log('================================================');

      // Capture console output
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      let stdout = '';
      let stderr = '';

      console.log = (...args) => {
        const output = args.join(' ');
        stdout += output + '\n';
        originalConsoleLog('📤 STDOUT:', output);
      };

      console.error = (...args) => {
        const output = args.join(' ');
        stderr += output + '\n';
        originalConsoleError('📥 STDERR:', output);
      };

      let result;
      const timeout = setTimeout(() => {
        throw new Error(`Direct execution timeout after ${this.config.timeout}ms`);
      }, this.config.timeout);

      try {
        // Convert Windows path to file:// URL for ES module import
        const fileUrl = pathToFileURL(scriptPath);
        console.log('File URL for import:', fileUrl.href);
        
        // Dynamic import of the compiled script
        const scriptModule = await import(fileUrl.href);
        
        // Call the appropriate direct execution function based on tool name
        switch (toolName) {
          case 'get-GLEIF-verification-with-sign':
            if (scriptModule.executeGLEIFVerificationDirect) {
              result = await scriptModule.executeGLEIFVerificationDirect(parameters);
            } else {
              throw new Error('executeGLEIFVerificationDirect function not found in module');
            }
            break;
            
          case 'get-BSDI-compliance-verification':
            console.log('🎯 Executing BSDI verification via direct function call');
            console.log('📋 Available functions in module:', Object.keys(scriptModule));
            
            if (scriptModule.executeBSDIVerificationDirect) {
              console.log('✅ executeBSDIVerificationDirect function found - calling now...');
              result = await scriptModule.executeBSDIVerificationDirect(parameters);
              console.log('✅ executeBSDIVerificationDirect completed successfully');
            } else {
              console.error('❌ executeBSDIVerificationDirect function not found in module');
              console.error('Available functions:', Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function'));
              throw new Error('executeBSDIVerificationDirect function not found in module. Available functions: ' + Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function').join(', '));
            }
            break;
            
          case 'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign':
            console.log('🎯 Executing Basel3 verification via direct function call');
            console.log('📋 Available functions in module:', Object.keys(scriptModule));
            
            if (scriptModule.executeBasel3VerificationDirect) {
              console.log('✅ executeBasel3VerificationDirect function found - calling now...');
              result = await scriptModule.executeBasel3VerificationDirect(parameters);
              console.log('✅ executeBasel3VerificationDirect completed successfully');
            } else {
              console.error('❌ executeBasel3VerificationDirect function not found in module');
              console.error('Available functions:', Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function'));
              throw new Error('executeBasel3VerificationDirect function not found in module. Available functions: ' + Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function').join(', '));
            }
            break;
            
          case 'get-EXIM-verification-with-sign':
            if (scriptModule.executeEXIMVerificationDirect) {
              result = await scriptModule.executeEXIMVerificationDirect(parameters);
            } else {
              throw new Error('executeEXIMVerificationDirect function not found in module');
            }
            break;
            
          case 'get-Corporate-Registration-verification-with-sign':
            if (scriptModule.executeCorporateRegistrationVerificationDirect) {
              result = await scriptModule.executeCorporateRegistrationVerificationDirect(parameters);
            } else {
              throw new Error('executeCorporateRegistrationVerificationDirect function not found in module');
            }
            break;
            
          case 'get-BPI-compliance-verification':
            console.log('🎯 Executing BPI verification via direct function call');
            console.log('📋 Available functions in module:', Object.keys(scriptModule));
            
            if (scriptModule.executeBPIVerificationDirect) {
              console.log('✅ executeBPIVerificationDirect function found - calling now...');
              result = await scriptModule.executeBPIVerificationDirect(parameters);
              console.log('✅ executeBPIVerificationDirect completed successfully');
            } else {
              console.error('❌ executeBPIVerificationDirect function not found in module');
              console.error('Available functions:', Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function'));
              throw new Error('executeBPIVerificationDirect function not found in module. Available functions: ' + Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function').join(', '));
            }
            break;
            
          case 'get-StablecoinProofOfReservesRisk-verification-with-sign':
            console.log('🎯 Executing Stablecoin verification via direct function call');
            console.log('📋 Available functions in module:', Object.keys(scriptModule));
            
            if (scriptModule.executeStablecoinVerificationDirect) {
              console.log('✅ executeStablecoinVerificationDirect function found - calling now...');
              result = await scriptModule.executeStablecoinVerificationDirect(parameters);
              console.log('✅ executeStablecoinVerificationDirect completed successfully');
            } else {
              console.error('❌ executeStablecoinVerificationDirect function not found in module');
              console.error('Available functions:', Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function'));
              throw new Error('executeStablecoinVerificationDirect function not found in module. Available functions: ' + Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function').join(', '));
            }
            break;
            
          case 'get-RiskLiquidityAdvancedOptimMerkle-verification-with-sign':
            console.log('🎯 Executing Advanced Risk verification via direct function call');
            console.log('📋 Available functions in module:', Object.keys(scriptModule));
            
            if (scriptModule.executeAdvancedVerificationDirect) {
              console.log('✅ executeAdvancedVerificationDirect function found - calling now...');
              result = await scriptModule.executeAdvancedVerificationDirect(parameters);
              console.log('✅ executeAdvancedVerificationDirect completed successfully');
            } else {
              console.error('❌ executeAdvancedVerificationDirect function not found in module');
              console.error('Available functions:', Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function'));
              throw new Error('executeAdvancedVerificationDirect function not found in module. Available functions: ' + Object.keys(scriptModule).filter(key => typeof scriptModule[key] === 'function').join(', '));
            }
            break;
            
          default:
            throw new Error(`Direct execution not implemented for tool: ${toolName}`);
            break;
        }
        
        clearTimeout(timeout);
        
      } finally {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
      }

      const executionTime = Date.now() - startTime;
      
      console.log('=== INTEGRATED SERVER DIRECT EXECUTION COMPLETE ===');
      console.log('Success: true');
      console.log('Execution Time:', `${executionTime}ms`);
      console.log('Result Success:', result?.success);
      console.log('==================================================');

      // Format the response similar to spawned execution
      const response = {
        // System execution always successful if we reach here
        systemExecution: {
          status: 'success',
          executionCompleted: true,
          scriptExecuted: true,
          executionTime: new Date().toISOString(),
          mode: 'direct-execution'
        },

        // Verification result from the direct function call
        verificationResult: {
          success: result?.success || false,
          zkProofGenerated: true,
          status: result?.success ? 'verification_passed' : 'verification_failed',
          reason: result?.success ? 'Verification completed successfully via direct execution' : 'Verification failed during direct execution'
        },

        // Include the actual result data
        result: result,

        // Legacy compatibility
        status: 'completed',
        zkProofGenerated: true,
        timestamp: new Date().toISOString(),
        output: stdout,
        stderr: stderr,
        executionStrategy: 'Integrated Backend - Direct function execution',
        executionMode: 'direct-execution',
        executionTime: `${executionTime}ms`
      };

      return {
        success: true,
        result: response
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.log('=== INTEGRATED SERVER DIRECT EXECUTION FAILED ===');
      console.log('Error:', error instanceof Error ? error.message : String(error));
      console.log('Execution Time:', `${executionTime}ms`);
      console.log('=================================================');
      
      throw error;
    }
  }

  async executeJavaScriptFile(scriptPath: string, parameters: any = {}, toolName?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = this.prepareScriptArgs(parameters, toolName);

      console.log('=== INTEGRATED SERVER JAVASCRIPT EXECUTION DEBUG ===');
      console.log('Script Path:', scriptPath);
      console.log('Working Directory:', this.config.stdioPath);
      console.log('Arguments:', args);
      console.log('Full Command:', `node ${scriptPath} ${args.join(' ')}`);
      console.log('===================================');

      // Get Node.js version to determine which flags to use
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''));
      
      // Prepare Node.js flags based on version compatibility
      const nodeFlags = [];
      
      // Only add experimental flags if Node.js version supports them
      if (majorVersion >= 14) {
        nodeFlags.push('--experimental-vm-modules');
      }
      
      if (majorVersion >= 16) {
        nodeFlags.push('--experimental-wasm-modules');
      }
      
      // Skip the problematic --experimental-wasm-threads flag entirely
      // This flag has compatibility issues across different Node.js versions
      // The ZK programs should work without it
      
      console.log('Node.js version:', nodeVersion);
      console.log('Using Node.js flags:', nodeFlags);

      const nodeProcess = spawn('node', [
        ...nodeFlags,
        scriptPath, 
        ...args
      ], {
        cwd: this.config.stdioPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          nodeProcess.kill('SIGTERM');
          console.log(`❌ EXECUTION TIMEOUT after ${this.config.timeout}ms`);
          reject(new Error(`Script execution timeout after ${this.config.timeout}ms`));
        }
      }, this.config.timeout);

      nodeProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        console.log('📤 STDOUT:', output.trim());
      });

      nodeProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        console.log('📥 STDERR:', output.trim());
      });

      nodeProcess.on('close', (code: number | null) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);

          console.log('=== INTEGRATED SERVER JAVASCRIPT EXECUTION COMPLETE ===');
          console.log('Exit Code:', code);
          console.log('Final STDOUT Length:', stdout.length);
          console.log('Final STDERR Length:', stderr.length);
          console.log('=====================================');

          if (code === 0) {
            console.log('✅ JAVASCRIPT EXECUTION SUCCESSFUL');

            // Analyze the output to determine verification result
            const verificationFailed = stdout.includes('Verification failed') ||
              stdout.includes('Risk threshold not met') ||
              stdout.includes('Compliance check failed') ||
              stderr.includes('verification failed');

            const verificationPassed = stdout.includes('Verification successful') ||
              stdout.includes('Proof verified') ||
              stdout.includes('Compliance check passed');

            // Parse actual proof data from stdout if available
            let proofData = null;
            let zkProof = null;
            try {
              const jsonMatches = stdout.match(/\{[^}]*"proof"[^}]*\}/g);
              if (jsonMatches && jsonMatches.length > 0) {
                proofData = JSON.parse(jsonMatches[jsonMatches.length - 1]);
                zkProof = proofData.proof;
              }
            } catch (e) {
              console.log('No parseable proof data found in output');
            }

            // Enhanced response format
            const response = {
              // System execution always successful if we reach here
              systemExecution: {
                status: 'success',
                executionCompleted: true,
                scriptExecuted: true,
                executionTime: new Date().toISOString()
              },

              // Verification result based on actual ZK proof outcome
              verificationResult: {
                success: verificationPassed && !verificationFailed,
                zkProofGenerated: true,
                status: verificationPassed ? 'verification_passed' : 'verification_failed',
                reason: verificationFailed ? 'Business logic verification failed (this is normal for strict compliance checks)' : 'Verification completed successfully'
              },

              // Legacy compatibility
              status: 'completed',
              zkProofGenerated: true,
              timestamp: new Date().toISOString(),
              output: stdout,
              stderr: stderr,
              executionStrategy: 'Integrated Backend - Direct execution of compiled ZK programs',
              executionMode: 'integrated-server',

              // Include actual proof data if found
              ...(proofData && { proofData }),
              ...(zkProof && { zkProof }),
              executionMetrics: this.extractExecutionMetrics(stdout)
            };

            resolve({
              success: true,
              result: response
            });
          } else {
            console.log(`❌ JAVASCRIPT EXECUTION FAILED with exit code ${code}`);
            reject(new Error(`Script failed with exit code ${code}: ${stderr || stdout || 'No output'}`));
          }
        }
      });

      nodeProcess.on('error', (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          console.log('❌ JAVASCRIPT PROCESS ERROR:', error.message);
          reject(error);
        }
      });

      console.log(`🚀 JavaScript process spawned with PID: ${nodeProcess.pid}`);
    });
  }

  extractExecutionMetrics(output: string): any {
    const metrics: any = {};

    try {
      // Extract timing information
      const timingMatches = output.match(/\b(\d+)\s*ms\b/g);
      if (timingMatches) {
        metrics.timings = timingMatches.map(t => t.replace(/\s*ms\b/, ''));
      }

      if (output.includes('Proof generated successfully')) {
        metrics.proofGenerated = true;
      }

      if (output.includes('Circuit compiled')) {
        metrics.circuitCompiled = true;
      }

      if (output.includes('Verification successful')) {
        metrics.verificationSuccessful = true;
      }

      if (output.includes('GLEIF data fetched')) {
        metrics.gleifDataFetched = true;
      }

      const numericMatches = output.match(/\b\d+\s*(bytes|kb|mb)\b/gi);
      if (numericMatches) {
        metrics.sizeMetrics = numericMatches;
      }

    } catch (error) {
      console.log('Error extracting metrics:', error);
    }

    return metrics;
  }

  prepareScriptArgs(parameters: any, toolName?: string): string[] {
    console.log('=== INTEGRATED SERVER PREPARING SCRIPT ARGS ===');
    console.log('Tool Name:', toolName);
    console.log('Input parameters:', parameters);

    const args: string[] = [];

    // Prepare arguments based on tool type
    switch (toolName) {
      case 'get-GLEIF-verification-with-sign':
        const companyName = parameters.companyName || parameters.legalName || parameters.entityName || 'SREE PALANI ANDAVAR AGROS PRIVATE LIMITED';
        args.push(String(companyName));
        console.log(`Added GLEIF arg 1 (company name): "${companyName}"`);
        args.push('TESTNET');
        console.log('Added GLEIF arg 2 (network type): "TESTNET"');
        break;

      case 'get-Corporate-Registration-verification-with-sign':
        const cin = parameters.cin;
        if (cin) {
          args.push(String(cin));
          console.log(`Added Corporate Registration arg 1 (CIN): "${cin}"`);
        } else {
          console.log('⚠️  No CIN found for Corporate Registration verification');
        }
        args.push('TESTNET');
        console.log('Added Corporate Registration arg 2 (network type): "TESTNET"');
        break;

      case 'get-EXIM-verification-with-sign':
        const eximCompanyName = parameters.companyName || parameters.legalName || parameters.entityName;
        if (eximCompanyName) {
          args.push(String(eximCompanyName));
          console.log(`Added EXIM arg 1 (company name): "${eximCompanyName}"`);
        } else {
          console.log('⚠️  No company name found for EXIM verification');
        }
        args.push('TESTNET');
        console.log('Added EXIM arg 2 (network type): "TESTNET"');
        break;

      case 'get-RiskLiquidityAdvancedOptimMerkle-verification-with-sign':
        const advThreshold = parameters.liquidityThreshold || 95;
        // SERVER HANDLES ACTUS URL: Use server's environment variable, not UI parameter
        const advActusUrl = process.env.ACTUS_SERVER_URL || 'http://3.88.158.37:8083/eventsBatch';
        const advConfigFilePath = parameters.configFilePath || 'Advanced-VALID-1.json';
        const advExecutionMode = parameters.executionMode || 'ultra_strict';
        
        args.push(String(advThreshold));
        args.push(String(advActusUrl));
        args.push(String(advConfigFilePath));
        args.push(String(advExecutionMode));
        
        console.log(`Added Advanced Risk arg 1 (threshold): "${advThreshold}"`);
        console.log(`Added Advanced Risk arg 2 (ACTUS URL from SERVER ENV): "${advActusUrl}"`);
        console.log(`Added Advanced Risk arg 3 (config file path): "${advConfigFilePath}"`);
        console.log(`Added Advanced Risk arg 4 (execution mode): "${advExecutionMode}"`);
        console.log('Note: ACTUS URL managed by server, Config file path auto-resolved to src/data/RISK/Advanced/CONFIG');
        break;

      case 'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign':
        const lcrThreshold = parameters.lcrThreshold || parameters.liquidityThreshold || 100;
        const nsfrThreshold = parameters.nsfrThreshold || 100;
        // Use relative paths that will be resolved by the script's path resolution logic
        const configFilePath = parameters.configFilePath || 'basel3-VALID-1.json';
        // SERVER HANDLES ACTUS URL: Use server's environment variable, not UI parameter
        const actusUrl = process.env.ACTUS_SERVER_URL || 'http://3.88.158.37:8083/eventsBatch';
        
        args.push(String(lcrThreshold));
        args.push(String(nsfrThreshold));
        args.push(String(actusUrl));
        args.push(String(configFilePath));
        
        console.log(`Added Basel3 arg 1 (lcrThreshold): "${lcrThreshold}"`);
        console.log(`Added Basel3 arg 2 (nsfrThreshold): "${nsfrThreshold}"`);
        console.log(`Added Basel3 arg 3 (actusUrl from SERVER ENV): "${actusUrl}"`);
        console.log(`Added Basel3 arg 4 (configFilePath): "${configFilePath}"`);
        console.log('Note: ACTUS URL managed by server, Config file path auto-resolved to src/data/RISK/Basel3/CONFIG');
        break;

      case 'get-StablecoinProofOfReservesRisk-verification-with-sign':
        // Stablecoin verification expects: [threshold, actusUrl, configFilePath, executionMode, jurisdiction]
        const stablecoinThreshold = parameters.liquidityThreshold || parameters.threshold || 100;
        // SERVER HANDLES ACTUS URL: Use server's environment variable, not UI parameter
        const stablecoinActusUrl = process.env.ACTUS_SERVER_URL || 'http://3.88.158.37:8083/eventsBatch';
        const stablecoinConfigFilePath = parameters.configFilePath || 'src/data/RISK/StableCoin/CONFIG/US/StableCoin-VALID-1.json';
        const stablecoinExecutionMode = parameters.executionMode || 'ultra_strict';
        const stablecoinJurisdiction = parameters.jurisdiction || 'US';
        
        args.push(String(stablecoinThreshold));
        args.push(String(stablecoinActusUrl));
        args.push(String(stablecoinConfigFilePath));
        args.push(String(stablecoinExecutionMode));
        args.push(String(stablecoinJurisdiction));
        
        console.log(`Added Stablecoin arg 1 (threshold): "${stablecoinThreshold}"`);
        console.log(`Added Stablecoin arg 2 (ACTUS URL from SERVER ENV): "${stablecoinActusUrl}"`);
        console.log(`Added Stablecoin arg 3 (config file path): "${stablecoinConfigFilePath}"`);
        console.log(`Added Stablecoin arg 4 (execution mode): "${stablecoinExecutionMode}"`);
        console.log(`Added Stablecoin arg 5 (jurisdiction): "${stablecoinJurisdiction}"`);
        console.log('Note: ACTUS URL managed by server, Config file path auto-resolved to src/data/RISK/StableCoin/CONFIG');
        break;

      case 'get-BPI-compliance-verification':
        const processType = parameters.processType || 'SCF';
        // Use relative paths that will be resolved by the script's path resolution logic
        const expectedProcessFile = parameters.expectedProcessFile || 'SCF-Expected.bpmn';
        const actualProcessFile = parameters.actualProcessFile || 'SCF-Accepted1.bpmn';
        
        args.push(String(processType));
        args.push(String(expectedProcessFile));
        args.push(String(actualProcessFile));
        
        console.log(`Added BPI arg 1 (processType): "${processType}"`);
        console.log(`Added BPI arg 2 (expectedProcessFile): "${expectedProcessFile}"`);
        console.log(`Added BPI arg 3 (actualProcessFile): "${actualProcessFile}"`);
        console.log('Note: File paths will be auto-resolved to src/data/scf/process/EXPECTED and ACTUAL directories');
        break;

      case 'get-BSDI-compliance-verification':
        // Use relative paths that will be resolved by the script's path resolution logic
        const bolFilePath = parameters.filePath || 'BOL-VALID-1.json';
        
        args.push(String(bolFilePath));
        
        console.log(`Added BSDI arg 1 (filePath): "${bolFilePath}"`);
        console.log('Note: File path will be auto-resolved to src/data/scf/BILLOFLADING directory');
        break;

      case 'get-RiskLiquidityACTUS-Verifier-Test_adv_zk':
      case 'get-RiskLiquidityACTUS-Verifier-Test_Basel3_Withsign':
        // Risk & Liquidity verification expects: [threshold, actusUrl]
        const riskThreshold = parameters.threshold || parameters.liquidityThreshold || 95;
        // SERVER HANDLES ACTUS URL: Use server's environment variable, not UI parameter
        const riskActusUrl = process.env.ACTUS_SERVER_URL || 'http://3.88.158.37:8083/eventsBatch';

        args.push(String(riskThreshold));
        args.push(String(riskActusUrl));
        
        console.log(`Added Risk arg 1 (threshold): "${riskThreshold}"`);
        console.log(`Added Risk arg 2 (ACTUS URL from SERVER ENV): "${riskActusUrl}"`);
        console.log('Note: ACTUS URL managed by server environment');
        break;

      default:
        // For other verification types, use fallback logic
        const fallbackCompanyName = parameters.legalName || parameters.entityName || parameters.companyName;
        if (fallbackCompanyName) {
          args.push(String(fallbackCompanyName));
          console.log(`Added fallback arg 1 (company name): "${fallbackCompanyName}"`);
        }
        args.push('TESTNET');
        console.log('Added fallback arg 2 (network type): "TESTNET"');
        break;
    }

    console.log('Final args array:', args);
    console.log('Command will be: node script.js', args.map(arg => `"${arg}"`).join(' '));
    console.log('=============================');

    return args;
  }
}

export const zkToolExecutor = new ZKToolExecutor();
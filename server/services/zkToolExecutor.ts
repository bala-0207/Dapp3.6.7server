import dotenv from 'dotenv';
dotenv.config();

import { spawn } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
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
      timeout: parseInt(process.env.ZK_PRET_SERVER_TIMEOUT || '1800000')
    };

    console.log('DEBUG: Final stdioPath =', this.config.stdioPath);
    console.log('DEBUG: Final stdioBuildPath =', this.config.stdioBuildPath);
    console.log('DEBUG: Final timeout =', this.config.timeout);
    console.log('=====================================');
  }

  async initialize(): Promise<void> {
    try {
      await this.healthCheck();
      logger.info('Integrated ZK Tool Executor initialized successfully');
    } catch (error) {
      logger.warn('Integrated ZK Tool Executor initialization failed', {
        error: error instanceof Error ? error.message : String(error),
        stdioPath: this.config.stdioPath
      });
    }
  }

  async healthCheck(): Promise<{ connected: boolean; status?: any }> {
    try {
      console.log('=== INTEGRATED ZK EXECUTOR HEALTH CHECK ===');
      console.log('Checking path:', this.config.stdioPath);

      const fs = await import('fs/promises');
      await fs.access(this.config.stdioPath);
      console.log('✅ Main path exists');

      const buildPath = path.join(this.config.stdioPath, this.config.stdioBuildPath);
      console.log('Checking build path:', buildPath);
      
      // Check if build directory exists, if not try to create it
      try {
        await fs.access(buildPath);
        console.log('✅ Build path exists');
      } catch {
        console.log('⚠️  Build path does not exist, will try to build first');
      }

      // Check for key source files to ensure we're in the right directory
      const sourceFiles = [
        'src/tests/with-sign/GLEIFOptimMultiCompanyVerificationTestWithSign.ts',
        'src/tests/with-sign/CorporateRegistrationOptimMultiCompanyVerificationTestWithSign.ts',
        'src/tests/with-sign/EXIMOptimMultiCompanyVerificationTestWithSign.ts'
      ];

      console.log('Checking for source TypeScript files:');
      let foundSourceFiles = 0;
      for (const file of sourceFiles) {
        const filePath = path.join(this.config.stdioPath, file);
        try {
          await fs.access(filePath);
          console.log(`✅ Found source: ${file}`);
          foundSourceFiles++;
        } catch {
          console.log(`❌ Missing source: ${file}`);
        }
      }

      console.log('=========================');

      return {
        connected: foundSourceFiles > 0,
        status: { 
          mode: 'integrated-server', 
          path: this.config.stdioPath, 
          buildPath,
          sourceFilesFound: foundSourceFiles,
          totalSourceFiles: sourceFiles.length
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
    console.log('🚀 Executing compiled JavaScript file...');

    return await this.executeJavaScriptFile(compiledScriptPath, parameters, toolName);
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

  async executeJavaScriptFile(scriptPath: string, parameters: any = {}, toolName?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = this.prepareScriptArgs(parameters, toolName);

      console.log('=== INTEGRATED SERVER JAVASCRIPT EXECUTION DEBUG ===');
      console.log('Script Path:', scriptPath);
      console.log('Working Directory:', this.config.stdioPath);
      console.log('Arguments:', args);
      console.log('Full Command:', `node ${scriptPath} ${args.join(' ')}`);
      console.log('===================================');

      const nodeProcess = spawn('node', [
        '--experimental-vm-modules',
        '--experimental-wasm-modules', 
        '--experimental-wasm-threads',
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
        args.push(String(advThreshold));
        console.log(`Added Advanced Risk arg 1 (threshold): "${advThreshold}"`);
        break;

      case 'get-RiskLiquidityBasel3Optim-Merkle-verification-with-sign':
        const lcrThreshold = parameters.lcrThreshold || parameters.liquidityThreshold || 100;
        const nsfrThreshold = parameters.nsfrThreshold || 100;
        args.push(String(lcrThreshold));
        args.push(String(nsfrThreshold));
        console.log(`Added Basel3 Risk arg 1 (lcrThreshold): "${lcrThreshold}"`);
        console.log(`Added Basel3 Risk arg 2 (nsfrThreshold): "${nsfrThreshold}"`);
        break;

      case 'get-StablecoinProofOfReservesRisk-verification-with-sign':
        const stablecoinThreshold = parameters.liquidityThreshold || 100;
        const minReserveRatio = parameters.minReserveRatio || 20;
        const maxVolatility = parameters.maxVolatility || 25;
        const minLiquidityBuffer = parameters.minLiquidityBuffer || 80;
        
        args.push(String(stablecoinThreshold));
        args.push(String(minReserveRatio));
        args.push(String(maxVolatility));
        args.push(String(minLiquidityBuffer));
        
        console.log(`Added StableCoin arg 1 (threshold): "${stablecoinThreshold}"`);
        console.log(`Added StableCoin arg 2 (minReserveRatio): "${minReserveRatio}"`);
        console.log(`Added StableCoin arg 3 (maxVolatility): "${maxVolatility}"`);
        console.log(`Added StableCoin arg 4 (minLiquidityBuffer): "${minLiquidityBuffer}"`);
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
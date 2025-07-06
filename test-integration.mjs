#!/usr/bin/env node

/**
 * ZK-PRET Integration Test
 * 
 * This script tests the integrated server to ensure everything is working correctly.
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import axios from 'axios';

const SERVER_URL = 'http://localhost:3001';
const WEBSOCKET_URL = 'ws://localhost:3001';

let serverProcess = null;

async function startServer() {
  console.log('🚀 Starting integrated server for testing...');
  
  serverProcess = spawn('npm', ['run', 'server:dev'], {
    stdio: 'pipe',
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('SERVER:', data.toString().trim());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('SERVER ERROR:', data.toString().trim());
  });

  // Wait for server to start
  await setTimeout(10000);
}

async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...');
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/v1/health`);
    console.log('✅ Health check passed:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testToolsEndpoint() {
  console.log('🔍 Testing tools endpoint...');
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/v1/tools`);
    console.log('✅ Tools endpoint passed, found', response.data.count, 'tools');
    return true;
  } catch (error) {
    console.error('❌ Tools endpoint failed:', error.message);
    return false;
  }
}

async function testSyncExecution() {
  console.log('🔍 Testing sync execution...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/v1/tools/execute`, {
      toolName: 'get-GLEIF-verification-with-sign',
      parameters: { companyName: 'APPLE INC' }
    }, {
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('✅ Sync execution passed:', response.data.success);
    return true;
  } catch (error) {
    console.error('❌ Sync execution failed:', error.message);
    return false;
  }
}

async function testAsyncExecution() {
  console.log('🔍 Testing async execution...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/v1/tools/execute-async`, {
      toolName: 'get-GLEIF-verification-with-sign',
      parameters: { companyName: 'APPLE INC' }
    });
    
    console.log('✅ Async execution started, job ID:', response.data.jobId);
    
    // Check job status
    const jobResponse = await axios.get(`${SERVER_URL}/api/v1/jobs/${response.data.jobId}`);
    console.log('✅ Job status check passed:', jobResponse.data.job.status);
    
    return true;
  } catch (error) {
    console.error('❌ Async execution failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting ZK-PRET Integration Tests...\n');
  
  try {
    // Start server
    await startServer();
    
    // Run tests
    const healthPassed = await testHealthEndpoint();
    const toolsPassed = await testToolsEndpoint();
    const syncPassed = await testSyncExecution();
    const asyncPassed = await testAsyncExecution();
    
    console.log('\n📊 Test Results:');
    console.log('Health Check:', healthPassed ? '✅ PASSED' : '❌ FAILED');
    console.log('Tools Endpoint:', toolsPassed ? '✅ PASSED' : '❌ FAILED');
    console.log('Sync Execution:', syncPassed ? '✅ PASSED' : '❌ FAILED');
    console.log('Async Execution:', asyncPassed ? '✅ PASSED' : '❌ FAILED');
    
    const allPassed = healthPassed && toolsPassed && syncPassed && asyncPassed;
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Integration is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    // Clean up
    if (serverProcess) {
      console.log('\n🛑 Stopping test server...');
      serverProcess.kill();
    }
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

runTests();
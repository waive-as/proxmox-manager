import { createProxmoxClient } from './src/services/proxmoxService.js';
import https from 'https';

// Test configuration
const config = {
  host: '10.0.1.60',
  port: 8006,
  tokenId: 'root@pam!portal-access',
  tokenSecret: '198dc962-7710-4c08-9b5c-992a2f899943'
};

// Helper function to format JSON output
const formatJSON = (data: any, title: string) => {
  console.log(`\n📋 ${title}:`);
  console.log(JSON.stringify(data, null, 2));
};

// Helper function to display section headers
const displaySection = (title: string) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔧 ${title}`);
  console.log(`${'='.repeat(50)}`);
};

// Main test function
async function testProxmoxAPI() {
  try {
    displaySection('Testing Proxmox Connection');
    
    console.log(`🌐 Connecting to: ${config.host}:${config.port}`);
    console.log(`🔑 Using token: ${config.tokenId}`);
    
    // Create Proxmox client instance
    console.log('\n⚙️  Creating ProxmoxClient instance...');
    const client = createProxmoxClient(config.host, config.port, config.tokenId, config.tokenSecret);
    console.log('✅ ProxmoxClient created successfully');
    
    // Test connection and authenticate
    displaySection('Authentication Test');
    console.log('🔐 Authenticating with Proxmox API...');
    await client.authenticateWithToken();
    console.log('✅ Authentication successful');
    
    // Get nodes
    displaySection('Nodes Information');
    console.log('📡 Fetching nodes list...');
    const nodes = await client.getNodes();
    console.log(`✅ Found ${nodes.length} node(s)`);
    formatJSON(nodes, 'Nodes List');
    
    if (nodes.length === 0) {
      console.log('⚠️  No nodes found. Cannot proceed with VM tests.');
      return;
    }
    
    // Get VMs from first node
    const firstNode = nodes[0];
    const nodeName = firstNode.node || firstNode.name || 'unknown';
    
    displaySection(`VMs on Node: ${nodeName}`);
    console.log(`🔍 Fetching VMs from node: ${nodeName}`);
    const vms = await client.getVMs(nodeName);
    console.log(`✅ Found ${vms.length} VM(s)`);
    formatJSON(vms, 'VMs List');
    
    if (vms.length === 0) {
      console.log('⚠️  No VMs found on this node.');
      return;
    }
    
    // Get detailed status of first VM
    const firstVM = vms[0];
    const vmid = firstVM.vmid;
    
    displaySection(`VM Details: ${firstVM.name || 'Unknown'} (ID: ${vmid})`);
    console.log(`🔍 Fetching detailed status for VM ${vmid}...`);
    const vmDetails = await client.getVMDetails(nodeName, vmid);
    console.log('✅ VM details retrieved successfully');
    formatJSON(vmDetails, 'VM Details');
    
    // Test VM status
    displaySection(`VM Status: ${firstVM.name || 'Unknown'}`);
    console.log(`📊 Getting current status for VM ${vmid}...`);
    const vmStatus = await client.getVMStatus(nodeName, vmid);
    console.log('✅ VM status retrieved successfully');
    formatJSON(vmStatus, 'VM Status');
    
    // Test cluster status
    displaySection('Cluster Status');
    console.log('🌐 Fetching cluster status...');
    const clusterStatus = await client.getClusterStatus();
    console.log('✅ Cluster status retrieved successfully');
    formatJSON(clusterStatus, 'Cluster Status');
    
    displaySection('Test Summary');
    console.log('🎉 All tests completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Nodes: ${nodes.length}`);
    console.log(`   • VMs on ${nodeName}: ${vms.length}`);
    console.log(`   • Tested VM: ${firstVM.name || 'Unknown'} (ID: ${vmid})`);
    console.log(`   • Authentication: ✅ Success`);
    console.log(`   • API Calls: ✅ All successful`);
    
  } catch (error) {
    displaySection('Test Failed');
    console.log('❌ Test failed with error:');
    
    if (error instanceof Error) {
      console.log(`🔴 Error Type: ${error.constructor.name}`);
      console.log(`🔴 Error Message: ${error.message}`);
      
      if (error.stack) {
        console.log(`🔴 Stack Trace:`);
        console.log(error.stack);
      }
    } else {
      console.log('🔴 Unknown error:', error);
    }
    
    // Provide helpful debugging information
    console.log('\n🔧 Debugging Tips:');
    console.log('   • Check if Proxmox server is running and accessible');
    console.log('   • Verify the host IP address and port');
    console.log('   • Confirm API token credentials are correct');
    console.log('   • Check if SSL certificate is valid (or if self-signed certs are allowed)');
    console.log('   • Ensure network connectivity to the Proxmox server');
    
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting Proxmox API Test...');
console.log(`⏰ Test started at: ${new Date().toISOString()}`);

testProxmoxAPI()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n💥 Test failed with unhandled error:');
    console.error(error);
    process.exit(1);
  });

// SynapPay Coordinator - Cross-chain event monitoring
import { EventEmitter } from 'events';
import { EthereumMonitor } from './monitors/ethereum';
import { StellarMonitor } from './monitors/stellar';
import { SwapOrchestrator } from './orchestrator';

class SynapPayCoordinator extends EventEmitter {
  private ethereumMonitor: EthereumMonitor;
  private stellarMonitor: StellarMonitor;
  private orchestrator: SwapOrchestrator;

  constructor() {
    super();
    this.ethereumMonitor = new EthereumMonitor();
    this.stellarMonitor = new StellarMonitor();
    this.orchestrator = new SwapOrchestrator();
  }

  async start() {
    console.log('🚀 SynapPay Coordinator starting...');
    
    // Start monitoring both chains
    await this.ethereumMonitor.start();
    await this.stellarMonitor.start();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    console.log('✅ Coordinator running');
  }

  private setupEventHandlers() {
    this.ethereumMonitor.on('htlc_created', (event) => {
      this.orchestrator.handleEthereumHTLC(event);
    });

    this.stellarMonitor.on('htlc_created', (event) => {
      this.orchestrator.handleStellarHTLC(event);
    });
  }
}

// Start the coordinator
const coordinator = new SynapPayCoordinator();
coordinator.start().catch(console.error);
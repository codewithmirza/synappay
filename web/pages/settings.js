import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Network, 
  Shield, 
  Bell, 
  Globe, 
  Info, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('network');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Network settings
    ethereumNetwork: 'sepolia',
    stellarNetwork: 'testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/your-project-id',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    
    // Security settings
    autoLockTimeout: 15,
    requireConfirmation: true,
    enableNotifications: true,
    
    // Display settings
    theme: 'system',
    language: 'en',
    currency: 'USD',
    
    // Advanced settings
    gasLimit: 300000,
    slippageTolerance: 0.5,
    maxRetries: 3
  });

  const [systemStatus, setSystemStatus] = useState({
    ethereum: { status: 'connected', latency: 120 },
    stellar: { status: 'connected', latency: 85 },
    fusion: { status: 'connected', latency: 200 },
    relayer: { status: 'connected', latency: 150 }
  });

  const tabs = [
    { id: 'network', label: 'Network', icon: Network },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Globe },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const getStatusIcon = (status) => {
    return status === 'connected' 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const renderNetworkTab = () => (
    <div className="space-y-6">
      {/* Network Configuration */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Network Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure your preferred networks and RPC endpoints
          </p>
        </div>
        <div className="card-content space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ethereum Network</label>
              <select
                value={settings.ethereumNetwork}
                onChange={(e) => handleSettingChange('ethereumNetwork', e.target.value)}
                className="input"
              >
                <option value="mainnet">Mainnet</option>
                <option value="sepolia">Sepolia Testnet</option>
                <option value="goerli">Goerli Testnet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Stellar Network</label>
              <select
                value={settings.stellarNetwork}
                onChange={(e) => handleSettingChange('stellarNetwork', e.target.value)}
                className="input"
              >
                <option value="public">Public Network</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Ethereum RPC URL</label>
            <input
              type="text"
              value={settings.rpcUrl}
              onChange={(e) => handleSettingChange('rpcUrl', e.target.value)}
              className="input"
              placeholder="https://mainnet.infura.io/v3/your-project-id"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Stellar Horizon URL</label>
            <input
              type="text"
              value={settings.horizonUrl}
              onChange={(e) => handleSettingChange('horizonUrl', e.target.value)}
              className="input"
              placeholder="https://horizon.stellar.org"
            />
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">System Status</h3>
          <p className="text-sm text-muted-foreground">
            Monitor the health of connected services
          </p>
        </div>
        <div className="card-content">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(systemStatus).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <div className="font-medium capitalize">{service}</div>
                    <div className="text-sm text-muted-foreground">
                      {status.latency}ms latency
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  status.status === 'connected' 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                )}>
                  {status.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Security Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure security preferences for your swaps
          </p>
        </div>
        <div className="card-content space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-lock Timeout</div>
              <div className="text-sm text-muted-foreground">
                Automatically lock the interface after inactivity
              </div>
            </div>
            <select
              value={settings.autoLockTimeout}
              onChange={(e) => handleSettingChange('autoLockTimeout', parseInt(e.target.value))}
              className="input min-w-[100px]"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Require Confirmation</div>
              <div className="text-sm text-muted-foreground">
                Always require manual confirmation for swaps
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.requireConfirmation}
              onChange={(e) => handleSettingChange('requireConfirmation', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Choose which notifications you want to receive
          </p>
        </div>
        <div className="card-content space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive browser notifications for swap updates
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Display Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of the interface
          </p>
        </div>
        <div className="card-content space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                className="input"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="input"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Advanced Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure advanced swap parameters
          </p>
        </div>
        <div className="card-content space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Gas Limit</label>
              <input
                type="number"
                value={settings.gasLimit}
                onChange={(e) => handleSettingChange('gasLimit', parseInt(e.target.value))}
                className="input"
                min="21000"
                max="1000000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Slippage Tolerance (%)</label>
              <input
                type="number"
                value={settings.slippageTolerance}
                onChange={(e) => handleSettingChange('slippageTolerance', parseFloat(e.target.value))}
                className="input"
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Max Retries</label>
              <input
                type="number"
                value={settings.maxRetries}
                onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
                className="input"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'network':
        return renderNetworkTab();
      case 'security':
        return renderSecurityTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'display':
        return renderDisplayTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return renderNetworkTab();
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Settings</h1>
              <p className="text-muted-foreground">
                Configure your SynapPay experience
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary mt-4 sm:mt-0 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-1 mb-6"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card mt-8"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>About SynapPay</span>
            </h3>
          </div>
          <div className="card-content">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Version</h4>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">License</h4>
                <p className="text-sm text-muted-foreground">MIT</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Documentation</h4>
                <a href="#" className="text-sm text-primary hover:underline flex items-center space-x-1">
                  <span>View Docs</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <h4 className="font-medium mb-2">Support</h4>
                <a href="#" className="text-sm text-primary hover:underline flex items-center space-x-1">
                  <span>Get Help</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 
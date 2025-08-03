-- SynapPay Database Schema for Cloudflare D1

-- Swap Intents Table
CREATE TABLE IF NOT EXISTS swap_intents (
    id TEXT PRIMARY KEY,
    from_chain TEXT NOT NULL CHECK (from_chain IN ('ethereum', 'stellar')),
    to_chain TEXT NOT NULL CHECK (to_chain IN ('ethereum', 'stellar')),
    from_token TEXT NOT NULL,
    to_token TEXT NOT NULL,
    from_amount TEXT NOT NULL,
    to_amount TEXT NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    hashlock TEXT NOT NULL,
    timelock INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'locked', 'completed', 'refunded', 'expired')),
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL
);

-- HTLC Contracts Table
CREATE TABLE IF NOT EXISTS htlc_contracts (
    contract_id TEXT PRIMARY KEY,
    swap_intent_id TEXT NOT NULL,
    chain TEXT NOT NULL CHECK (chain IN ('ethereum', 'stellar')),
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    amount TEXT NOT NULL,
    token TEXT NOT NULL,
    hashlock TEXT NOT NULL,
    timelock INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'withdrawn', 'refunded')),
    preimage TEXT,
    transaction_hash TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (swap_intent_id) REFERENCES swap_intents(id)
);

-- 1inch Orders Table
CREATE TABLE IF NOT EXISTS fusion_plus_orders (
    order_id TEXT PRIMARY KEY,
    swap_intent_id TEXT NOT NULL,
    from_token TEXT NOT NULL,
    to_token TEXT NOT NULL,
    from_amount TEXT NOT NULL,
    to_amount TEXT NOT NULL,
    from_chain_id INTEGER NOT NULL,
    to_chain_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'filled', 'cancelled', 'expired')),
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (swap_intent_id) REFERENCES swap_intents(id)
);

-- Partial Fills Table
CREATE TABLE IF NOT EXISTS partial_fills (
    id TEXT PRIMARY KEY,
    swap_id TEXT NOT NULL,
    original_amount TEXT NOT NULL,
    filled_amount TEXT NOT NULL,
    remaining_amount TEXT NOT NULL,
    fill_percentage REAL NOT NULL,
    tx_hash TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (swap_id) REFERENCES swap_intents(id)
);

-- Relayer Events Table
CREATE TABLE IF NOT EXISTS relayer_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    swap_id TEXT NOT NULL,
    chain TEXT NOT NULL CHECK (chain IN ('ethereum', 'stellar')),
    details TEXT, -- JSON string
    timestamp INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (swap_id) REFERENCES swap_intents(id)
);

-- Token Prices Cache Table
CREATE TABLE IF NOT EXISTS token_prices (
    token_id TEXT PRIMARY KEY,
    price_usd REAL NOT NULL,
    price_change_24h REAL,
    last_updated INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swap_intents_status ON swap_intents(status);
CREATE INDEX IF NOT EXISTS idx_swap_intents_created_at ON swap_intents(created_at);
CREATE INDEX IF NOT EXISTS idx_swap_intents_expires_at ON swap_intents(expires_at);
CREATE INDEX IF NOT EXISTS idx_htlc_contracts_swap_intent_id ON htlc_contracts(swap_intent_id);
CREATE INDEX IF NOT EXISTS idx_htlc_contracts_status ON htlc_contracts(status);
CREATE INDEX IF NOT EXISTS idx_fusion_plus_orders_swap_intent_id ON fusion_plus_orders(swap_intent_id);
CREATE INDEX IF NOT EXISTS idx_partial_fills_swap_id ON partial_fills(swap_id);
CREATE INDEX IF NOT EXISTS idx_relayer_events_swap_id ON relayer_events(swap_id);
CREATE INDEX IF NOT EXISTS idx_relayer_events_timestamp ON relayer_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_token_prices_last_updated ON token_prices(last_updated);
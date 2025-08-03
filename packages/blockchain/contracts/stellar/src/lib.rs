#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Bytes, Env, Symbol, Vec, token
};

/// HTLC Contract States
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HTLCState {
    Active,
    Withdrawn,
    Refunded,
}

/// HTLC Contract Data
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HTLCData {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub amount: i128,
    pub hashlock: Bytes,
    pub timelock: u64,
    pub state: HTLCState,
    pub preimage: Option<Bytes>,
}

/// Storage Keys
#[contracttype]
pub enum DataKey {
    HTLC(Bytes), // Contract ID as key
    Counter,
}

const HTLC: Symbol = symbol_short!("HTLC");
const WITHDRAW: Symbol = symbol_short!("WITHDRAW");
const REFUND: Symbol = symbol_short!("REFUND");
const NEW: Symbol = symbol_short!("NEW");

#[contract]
pub struct SynapPayStellarHTLC;

#[contractimpl]
impl SynapPayStellarHTLC {
    /// Create a new HTLC contract
    pub fn new_contract(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        hashlock: Bytes,
        timelock: u64,
    ) -> Bytes {
        // Authenticate sender
        sender.require_auth();
        
        // Validate inputs
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        if timelock <= env.ledger().timestamp() {
            panic!("Timelock must be in the future");
        }
        
        if hashlock.len() != 32 {
            panic!("Hashlock must be 32 bytes");
        }
        
        // Generate unique contract ID
        let mut counter: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::Counter, &counter);
        
        let contract_id = env.crypto().keccak256(&Bytes::from_array(
            &env,
            &[
                hashlock.clone().into(),
                sender.to_string().as_bytes().into(),
                receiver.to_string().as_bytes().into(),
                counter.to_be_bytes().into(),
            ].concat()
        ));
        
        // Create HTLC data
        let htlc_data = HTLCData {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token.clone(),
            amount,
            hashlock: hashlock.clone(),
            timelock,
            state: HTLCState::Active,
            preimage: None,
        };
        
        // Store HTLC data
        env.storage().persistent().set(&DataKey::HTLC(contract_id.clone()), &htlc_data);
        
        // Transfer tokens to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);
        
        // Emit event
        env.events().publish((HTLC, NEW), (contract_id.clone(), sender, receiver, amount));
        
        contract_id
    }
    
    /// Withdraw funds with correct preimage
    pub fn withdraw(env: Env, contract_id: Bytes, preimage: Bytes) -> bool {
        let key = DataKey::HTLC(contract_id.clone());
        let mut htlc_data: HTLCData = env.storage().persistent()
            .get(&key)
            .expect("HTLC not found");
        
        // Check contract state
        if htlc_data.state != HTLCState::Active {
            panic!("HTLC is not active");
        }
        
        // Verify preimage matches hashlock
        let hash = env.crypto().keccak256(&preimage);
        if hash != htlc_data.hashlock {
            panic!("Invalid preimage");
        }
        
        // Authenticate receiver
        htlc_data.receiver.require_auth();
        
        // Update state
        htlc_data.state = HTLCState::Withdrawn;
        htlc_data.preimage = Some(preimage.clone());
        env.storage().persistent().set(&key, &htlc_data);
        
        // Transfer tokens to receiver
        let token_client = token::Client::new(&env, &htlc_data.token);
        token_client.transfer(
            &env.current_contract_address(),
            &htlc_data.receiver,
            &htlc_data.amount
        );
        
        // Emit event
        env.events().publish(
            (HTLC, WITHDRAW),
            (contract_id, htlc_data.receiver.clone(), htlc_data.amount, preimage)
        );
        
        true
    }
    
    /// Refund after timelock expires
    pub fn refund(env: Env, contract_id: Bytes) -> bool {
        let key = DataKey::HTLC(contract_id.clone());
        let mut htlc_data: HTLCData = env.storage().persistent()
            .get(&key)
            .expect("HTLC not found");
        
        // Check contract state
        if htlc_data.state != HTLCState::Active {
            panic!("HTLC is not active");
        }
        
        // Check timelock
        if env.ledger().timestamp() < htlc_data.timelock {
            panic!("Timelock not yet expired");
        }
        
        // Authenticate sender
        htlc_data.sender.require_auth();
        
        // Update state
        htlc_data.state = HTLCState::Refunded;
        env.storage().persistent().set(&key, &htlc_data);
        
        // Transfer tokens back to sender
        let token_client = token::Client::new(&env, &htlc_data.token);
        token_client.transfer(
            &env.current_contract_address(),
            &htlc_data.sender,
            &htlc_data.amount
        );
        
        // Emit event
        env.events().publish(
            (HTLC, REFUND),
            (contract_id, htlc_data.sender.clone(), htlc_data.amount)
        );
        
        true
    }
    
    /// Get HTLC details
    pub fn get_contract(env: Env, contract_id: Bytes) -> HTLCData {
        let key = DataKey::HTLC(contract_id);
        env.storage().persistent().get(&key).expect("HTLC not found")
    }
    
    /// Check if HTLC exists
    pub fn has_contract(env: Env, contract_id: Bytes) -> bool {
        let key = DataKey::HTLC(contract_id);
        env.storage().persistent().has(&key)
    }
    
    /// Get contract state
    pub fn get_state(env: Env, contract_id: Bytes) -> HTLCState {
        let htlc_data = Self::get_contract(env, contract_id);
        htlc_data.state
    }
    
    /// Get preimage if revealed
    pub fn get_preimage(env: Env, contract_id: Bytes) -> Option<Bytes> {
        let htlc_data = Self::get_contract(env, contract_id);
        htlc_data.preimage
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env};
    
    #[test]
    fn test_htlc_flow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, SynapPayStellarHTLC);
        let client = SynapPayStellarHTLCClient::new(&env, &contract_id);
        
        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let token = Address::generate(&env);
        let amount = 1000i128;
        let preimage = Bytes::from_array(&env, &[1; 32]);
        let hashlock = env.crypto().keccak256(&preimage);
        let timelock = env.ledger().timestamp() + 3600;
        
        // Create HTLC
        let htlc_id = client.new_contract(&sender, &receiver, &token, &amount, &hashlock, &timelock);
        
        // Verify HTLC exists
        assert!(client.has_contract(&htlc_id));
        
        // Get HTLC data
        let htlc_data = client.get_contract(&htlc_id);
        assert_eq!(htlc_data.sender, sender);
        assert_eq!(htlc_data.receiver, receiver);
        assert_eq!(htlc_data.amount, amount);
        assert_eq!(htlc_data.state, HTLCState::Active);
        
        // Withdraw with correct preimage
        client.withdraw(&htlc_id, &preimage);
        
        // Verify withdrawal
        let updated_data = client.get_contract(&htlc_id);
        assert_eq!(updated_data.state, HTLCState::Withdrawn);
        assert_eq!(updated_data.preimage, Some(preimage));
    }
}
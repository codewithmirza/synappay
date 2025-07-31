#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Bytes, BytesN, Env, Symbol};

#[contract]
pub struct StellarHTLC;

#[derive(Clone)]
pub struct HTLCData {
    pub sender: Address,
    pub receiver: Address,
    pub amount: i128,
    pub hashlock: BytesN<32>,
    pub timelock: u64,
    pub withdrawn: bool,
    pub refunded: bool,
    pub preimage: BytesN<32>,
}

#[contractimpl]
impl StellarHTLC {
    pub fn new_contract(
        env: &Env,
        receiver: Address,
        hashlock: BytesN<32>,
        timelock: u64,
    ) -> Result<BytesN<32>, Error> {
        let sender = env.current_contract_address();
        let amount = env.contract().balance();
        
        // Validate timelock is in the future
        if timelock <= env.ledger().timestamp() {
            return Err(Error::InvalidTimelock);
        }
        
        // Generate contract ID
        let contract_id = env.crypto().sha256(&Bytes::from_slice(env, &[
            sender.as_ref(),
            receiver.as_ref(),
            &amount.to_be_bytes(),
            hashlock.as_ref(),
            &timelock.to_be_bytes(),
        ]));
        
        // Store HTLC data
        let htlc_data = HTLCData {
            sender,
            receiver,
            amount,
            hashlock,
            timelock,
            withdrawn: false,
            refunded: false,
            preimage: BytesN::new(env, &[0u8; 32]),
        };
        
        env.storage().instance().set(&contract_id, &htlc_data);
        
        // Emit event
        env.events().publish((Symbol::new(env, "HTLCNew"), contract_id, sender, receiver, amount, hashlock, timelock));
        
        Ok(contract_id)
    }
    
    pub fn withdraw(env: &Env, contract_id: BytesN<32>, preimage: BytesN<32>) -> Result<bool, Error> {
        let mut htlc_data: HTLCData = env.storage().instance().get(&contract_id)
            .ok_or(Error::ContractNotFound)?;
        
        // Validate receiver
        if htlc_data.receiver != env.current_contract_address() {
            return Err(Error::NotReceiver);
        }
        
        // Validate not already withdrawn
        if htlc_data.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }
        
        // Validate hashlock matches
        let computed_hashlock = env.crypto().sha256(&preimage);
        if computed_hashlock != htlc_data.hashlock {
            return Err(Error::HashlockMismatch);
        }
        
        // Validate timelock not expired
        if env.ledger().timestamp() >= htlc_data.timelock {
            return Err(Error::TimelockExpired);
        }
        
        // Update state
        htlc_data.withdrawn = true;
        htlc_data.preimage = preimage;
        env.storage().instance().set(&contract_id, &htlc_data);
        
        // Transfer funds to receiver
        env.incoming().with_asset(&env.current_contract_address(), &htlc_data.amount)
            .transfer(&htlc_data.receiver, &htlc_data.amount);
        
        // Emit event
        env.events().publish((Symbol::new(env, "HTLCWithdraw"), contract_id));
        
        Ok(true)
    }
    
    pub fn refund(env: &Env, contract_id: BytesN<32>) -> Result<bool, Error> {
        let mut htlc_data: HTLCData = env.storage().instance().get(&contract_id)
            .ok_or(Error::ContractNotFound)?;
        
        // Validate sender
        if htlc_data.sender != env.current_contract_address() {
            return Err(Error::NotSender);
        }
        
        // Validate not already refunded
        if htlc_data.refunded {
            return Err(Error::AlreadyRefunded);
        }
        
        // Validate not withdrawn
        if htlc_data.withdrawn {
            return Err(Error::AlreadyWithdrawn);
        }
        
        // Validate timelock expired
        if env.ledger().timestamp() < htlc_data.timelock {
            return Err(Error::TimelockNotExpired);
        }
        
        // Update state
        htlc_data.refunded = true;
        env.storage().instance().set(&contract_id, &htlc_data);
        
        // Transfer funds back to sender
        env.incoming().with_asset(&env.current_contract_address(), &htlc_data.amount)
            .transfer(&htlc_data.sender, &htlc_data.amount);
        
        // Emit event
        env.events().publish((Symbol::new(env, "HTLCRefund"), contract_id));
        
        Ok(true)
    }
    
    pub fn get_contract(env: &Env, contract_id: BytesN<32>) -> Result<HTLCData, Error> {
        env.storage().instance().get(&contract_id)
            .ok_or(Error::ContractNotFound)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    InvalidTimelock,
    ContractNotFound,
    NotReceiver,
    NotSender,
    AlreadyWithdrawn,
    AlreadyRefunded,
    HashlockMismatch,
    TimelockExpired,
    TimelockNotExpired,
}

impl From<Error> for soroban_sdk::Error {
    fn from(err: Error) -> Self {
        soroban_sdk::Error::from_type_and_code(1, err as u32)
    }
}

#[test]
fn test_new_contract() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarHTLC);
    let client = StellarHTLCClient::new(&env, &contract_id);
    
    let receiver = Address::random(&env);
    let hashlock = BytesN::from_array(&env, &[1u8; 32]);
    let timelock = env.ledger().timestamp() + 3600;
    
    let result = client.new_contract(&receiver, &hashlock, &timelock);
    assert!(result.is_ok());
}

#[test]
fn test_withdraw() {
    let env = Env::default();
    let contract_id = env.register_contract(None, StellarHTLC);
    let client = StellarHTLCClient::new(&env, &contract_id);
    
    let receiver = Address::random(&env);
    let preimage = BytesN::from_array(&env, &[1u8; 32]);
    let hashlock = env.crypto().sha256(&preimage);
    let timelock = env.ledger().timestamp() + 3600;
    
    // Create contract
    client.new_contract(&receiver, &hashlock, &timelock);
    
    // Withdraw
    let result = client.withdraw(&preimage);
    assert!(result.is_ok());
} 
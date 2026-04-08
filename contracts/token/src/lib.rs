#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// AgentBazaar $BAZAAR Token Contract
/// Issues and manages the $BAZAAR ESDT utility token.
/// Features:
///   - Initial issuance by owner
///   - Mint by owner (ecosystem rewards)
///   - Burn by any holder
///   - Staking: lock BAZAAR for reputation boost + fee discounts
///   - Fee discount tiers: 100 BAZAAR = 10%, 1000 = 25%, 10000 = 50%
#[multiversx_sc::contract]
pub trait AgentBazaarToken {
    #[init]
    fn init(&self) {}

    // ------------------------------------------------------------ Issue
    /// Issue $BAZAAR ESDT. Call with EGLD (0.05 EGLD issuance fee).
    #[payable("EGLD")]
    #[endpoint(issueToken)]
    fn issue_token(
        &self,
        token_display_name: ManagedBuffer,
        token_ticker: ManagedBuffer,
        initial_supply: BigUint,
    ) {
        self.require_owner();
        let payment = self.call_value().egld_value();
        self.send()
            .esdt_system_sc_proxy()
            .issue_fungible(
                payment.clone_value(),
                &token_display_name,
                &token_ticker,
                &initial_supply,
                FungibleTokenProperties {
                    num_decimals: 18,
                    can_freeze: false,
                    can_wipe: false,
                    can_pause: false,
                    can_mint: true,
                    can_burn: true,
                    can_change_owner: true,
                    can_upgrade: true,
                    can_add_special_roles: true,
                },
            )
            .with_callback(self.callbacks().issue_callback())
            .async_call_and_exit();
    }

    #[callback]
    fn issue_callback(&self, #[call_result] result: ManagedAsyncCallResult<TokenIdentifier>) {
        match result {
            ManagedAsyncCallResult::Ok(token_id) => {
                self.bazaar_token_id().set(&token_id);
            }
            ManagedAsyncCallResult::Err(_) => {}
        }
    }

    // ------------------------------------------------------------- Mint
    #[endpoint(mintTokens)]
    fn mint_tokens(&self, amount: BigUint) {
        self.require_owner();
        let token_id = self.bazaar_token_id().get();
        self.send().esdt_local_mint(&token_id, 0, &amount);
        self.send().direct_esdt(
            &self.blockchain().get_owner_address(),
            &token_id,
            0,
            &amount,
        );
    }

    // ------------------------------------------------------------- Burn
    #[payable("*")]
    #[endpoint(burnTokens)]
    fn burn_tokens(&self) {
        let (token_id, _, amount) = self.call_value().single_esdt().into_tuple();
        require!(token_id == self.bazaar_token_id().get(), "Wrong token");
        self.send().esdt_local_burn(&token_id, 0, &amount);
    }

    // ------------------------------------------------------------ Stake
    /// Stake BAZAAR tokens for fee discount + reputation boost.
    #[payable("*")]
    #[endpoint(stakeForDiscount)]
    fn stake_for_discount(&self) {
        let (token_id, _, amount) = self.call_value().single_esdt().into_tuple();
        require!(token_id == self.bazaar_token_id().get(), "Wrong token");
        let caller = self.blockchain().get_caller();
        let current = self.staked_balance(&caller).get();
        self.staked_balance(&caller).set(current + amount.clone());
        self.stake_event(&caller, &amount);
    }

    /// Unstake BAZAAR tokens.
    #[endpoint(unstake)]
    fn unstake(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let current = self.staked_balance(&caller).get();
        require!(current >= amount, "Insufficient stake");
        self.staked_balance(&caller).set(current - amount.clone());
        let token_id = self.bazaar_token_id().get();
        self.send().direct_esdt(&caller, &token_id, 0, &amount);
        self.unstake_event(&caller, &amount);
    }

    /// Get fee discount tier for address (bps): 0 / 1000 / 2500 / 5000
    #[view(getFeeDiscount)]
    fn get_fee_discount(&self, address: ManagedAddress) -> u64 {
        let staked = self.staked_balance(&address).get();
        let one = BigUint::from(1_000_000_000_000_000_000u64); // 1 BAZAAR
        if staked >= one.clone() * 10_000u32 { return 5000; }
        if staked >= one.clone() * 1_000u32  { return 2500; }
        if staked >= one.clone() * 100u32    { return 1000; }
        0
    }

    // ---------------------------------------------------------------- Views
    #[view(getBazaarTokenId)]
    fn get_bazaar_token_id(&self) -> TokenIdentifier {
        self.bazaar_token_id().get()
    }

    #[view(getStakedBalance)]
    fn get_staked_balance_view(&self, address: ManagedAddress) -> BigUint {
        self.staked_balance(&address).get()
    }

    // -------------------------------------------------------------- Storage
    #[storage_mapper("bazaarTokenId")]
    fn bazaar_token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("stakedBalance")]
    fn staked_balance(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    // --------------------------------------------------------------- Events
    #[event("stake")]
    fn stake_event(&self, #[indexed] address: &ManagedAddress, amount: &BigUint);

    #[event("unstake")]
    fn unstake_event(&self, #[indexed] address: &ManagedAddress, amount: &BigUint);

    // ------------------------------------------------------------ Internal
    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.blockchain().get_owner_address(),
            "Owner only"
        );
    }
}

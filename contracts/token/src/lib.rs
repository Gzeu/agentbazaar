#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait AgentBazaarToken {
    #[init]
    fn init(&self) {}

    #[payable("EGLD")]
    #[endpoint(issueToken)]
    fn issue_token(
        &self,
        token_display_name: ManagedBuffer,
        token_ticker: ManagedBuffer,
        initial_supply: BigUint,
    ) {
        self.require_owner();
        let payment = self.call_value().egld().clone_value();
        self.send()
            .esdt_system_sc_proxy()
            .issue_fungible(
                payment,
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
            ManagedAsyncCallResult::Ok(token_id) => { self.bazaar_token_id().set(&token_id); }
            ManagedAsyncCallResult::Err(_) => {}
        }
    }

    #[endpoint(mintTokens)]
    fn mint_tokens(&self, amount: BigUint) {
        self.require_owner();
        let token_id = self.bazaar_token_id().get();
        self.send().esdt_local_mint(&token_id, 0, &amount);
        self.send().direct_esdt(&self.blockchain().get_owner_address(), &token_id, 0, &amount);
    }

    #[payable("*")]
    #[endpoint(burnTokens)]
    fn burn_tokens(&self) {
        let payment = self.call_value().single_esdt();
        let token_id = payment.token_identifier.clone();
        let amount = payment.amount.clone();
        require!(token_id == self.bazaar_token_id().get(), "Wrong token");
        self.send().esdt_local_burn(&token_id, 0, &amount);
    }

    #[payable("*")]
    #[endpoint(stakeForDiscount)]
    fn stake_for_discount(&self) {
        let payment = self.call_value().single_esdt();
        let token_id = payment.token_identifier.clone();
        let amount = payment.amount.clone();
        require!(token_id == self.bazaar_token_id().get(), "Wrong token");
        let caller = self.blockchain().get_caller();
        let current = self.staked_balance(&caller).get();
        self.staked_balance(&caller).set(current + &amount);
        self.stake_event(&caller, &amount);
    }

    #[endpoint(unstake)]
    fn unstake(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let current = self.staked_balance(&caller).get();
        require!(current >= amount, "Insufficient stake");
        self.staked_balance(&caller).set(&current - &amount);
        let token_id = self.bazaar_token_id().get();
        self.send().direct_esdt(&caller, &token_id, 0, &amount);
        self.unstake_event(&caller, &amount);
    }

    #[view(getFeeDiscount)]
    fn get_fee_discount(&self, address: ManagedAddress) -> u64 {
        let staked = self.staked_balance(&address).get();
        let one = BigUint::from(1_000_000_000_000_000_000u64);
        if staked >= one.clone() * 10_000u32 { return 5000; }
        if staked >= one.clone() * 1_000u32  { return 2500; }
        if staked >= one.clone() * 100u32    { return 1000; }
        0
    }

    #[view(getBazaarTokenId)]
    fn get_bazaar_token_id(&self) -> TokenIdentifier { self.bazaar_token_id().get() }

    #[view(getStakedBalance)]
    fn get_staked_balance_view(&self, address: ManagedAddress) -> BigUint {
        self.staked_balance(&address).get()
    }

    #[storage_mapper("bazaarTokenId")]
    fn bazaar_token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("stakedBalance")]
    fn staked_balance(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[event("stake")]
    fn stake_event(&self, #[indexed] address: &ManagedAddress, amount: &BigUint);

    #[event("unstake")]
    fn unstake_event(&self, #[indexed] address: &ManagedAddress, amount: &BigUint);

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.blockchain().get_owner_address(),
            "Owner only"
        );
    }
}

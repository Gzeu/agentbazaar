#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc::imports!();

#[multiversx_sc::contract]
pub trait AgentBazaarToken {
    #[init]
    fn init(&self, initial_supply: BigUint) {
        self.total_supply().set(&initial_supply);
        let caller = self.blockchain().get_caller();
        self.balance_of(&caller).set(&initial_supply);
    }

    #[upgrade]
    fn upgrade(&self) {}

    #[payable("EGLD")]
    #[endpoint(mint)]
    fn mint(&self, to: ManagedAddress, amount: BigUint) {
        self.require_owner();
        let current = self.balance_of(&to).get();
        self.balance_of(&to).set(current + amount.clone());
        let supply = self.total_supply().get();
        self.total_supply().set(supply + amount);
    }

    #[endpoint(transfer)]
    fn transfer(&self, to: ManagedAddress, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let from_balance = self.balance_of(&caller).get();
        require!(from_balance >= amount, "Insufficient balance");
        self.balance_of(&caller).set(from_balance - amount.clone());
        let to_balance = self.balance_of(&to).get();
        self.balance_of(&to).set(to_balance + amount);
    }

    #[endpoint(burn)]
    fn burn(&self, amount: BigUint) {
        let caller = self.blockchain().get_caller();
        let balance = self.balance_of(&caller).get();
        require!(balance >= amount, "Insufficient balance");
        self.balance_of(&caller).set(balance - amount.clone());
        let supply = self.total_supply().get();
        self.total_supply().set(supply - amount);
    }

    #[view(balanceOf)]
    fn balance_of_view(&self, address: ManagedAddress) -> BigUint {
        self.balance_of(&address).get()
    }

    #[view(totalSupply)]
    fn total_supply_view(&self) -> BigUint { self.total_supply().get() }

    #[storage_mapper("balance")]
    fn balance_of(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("totalSupply")]
    fn total_supply(&self) -> SingleValueMapper<BigUint>;

    fn require_owner(&self) {
        require!(self.blockchain().get_caller() == self.blockchain().get_owner_address(), "Owner only");
    }
}

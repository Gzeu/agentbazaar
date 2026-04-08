#!/usr/bin/env python3
"""
AgentBazaar Verify Script (Windows)
Verifica contractele deployate pe devnet
Foloseste: python devnet/verify_windows.py
"""
import json, urllib.request, sys
from pathlib import Path

DEVNET_DIR = Path(__file__).parent
ADDRESSES_FILE = DEVNET_DIR / "deployed-addresses.json"
API = "https://devnet-api.multiversx.com"

def check_contract(name, address):
    if not address:
        print(f"  [{name}] SKIP - adresa lipsa")
        return False
    try:
        url = f"{API}/accounts/{address}"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
            has_code = bool(data.get("code") or data.get("codeHash"))
            if has_code:
                print(f"  [{name}] OK - {address[:20]}...{address[-6:]}")
                return True
            else:
                print(f"  [{name}] NO CODE la {address}")
                return False
    except Exception as e:
        print(f"  [{name}] EROARE: {e}")
        return False

def main():
    print("=" * 60)
    print("  AgentBazaar Verify (devnet)")
    print("=" * 60)

    if not ADDRESSES_FILE.exists():
        print(f"\n[ERROR] {ADDRESSES_FILE} nu exista!")
        print("Ruleaza mai intai: python devnet/deploy_windows.py")
        sys.exit(1)

    addresses = json.loads(ADDRESSES_FILE.read_text())
    print(f"\nAdrese gasite: {list(addresses.keys())}")
    print()

    ok = 0
    for name, addr in addresses.items():
        if check_contract(name, addr):
            ok += 1

    print()
    print(f"Rezultat: {ok}/{len(addresses)} contracte LIVE")
    if ok == len(addresses):
        print("\nToate contractele sunt live pe devnet!")
        print(f"Explorer: https://devnet-explorer.multiversx.com")
    else:
        print("\nUnele contracte lipsesc. Re-ruleaza deploy_windows.py")

if __name__ == "__main__":
    main()

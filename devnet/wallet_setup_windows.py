#!/usr/bin/env python3
"""
AgentBazaar Wallet Setup (Windows)
Inlocuieste wallet-setup.sh pentru Windows
Foloseste: python devnet/wallet_setup_windows.py
"""
import subprocess, sys, re, urllib.request, json
from pathlib import Path

DEVNET_DIR = Path(__file__).parent
PEM_FILE = DEVNET_DIR / "deployer.pem"

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def get_address_from_pem(pem_path):
    content = Path(pem_path).read_text()
    match = re.search(r"erd1[a-z0-9]{58}", content)
    return match.group(0) if match else None

def check_balance(address):
    try:
        url = f"https://devnet-api.multiversx.com/accounts/{address}"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
            return int(data.get("balance", 0)) / 10**18
    except:
        return 0

def main():
    print("=" * 60)
    print("  AgentBazaar Wallet Setup (Windows)")
    print("=" * 60)

    r = run(["mxpy", "--version"])
    if r.returncode != 0:
        print("\n[ERROR] mxpy nu e instalat!")
        print("Instaleaza cu: pip install multiversx-sdk-cli")
        sys.exit(1)
    print(f"\n[OK] mxpy: {r.stdout.strip()}")

    if PEM_FILE.exists():
        print(f"\n[OK] {PEM_FILE} exista deja")
        address = get_address_from_pem(PEM_FILE)
    else:
        print(f"\n[CREATE] Generez wallet nou...")
        result = run(["mxpy", "wallet", "new", "--format=pem", f"--outfile={PEM_FILE}"])
        if not PEM_FILE.exists():
            print("[ERROR] Nu am putut crea PEM-ul!")
            print(f"Stderr: {result.stderr}")
            sys.exit(1)
        print(f"[OK] Wallet creat: {PEM_FILE}")
        address = get_address_from_pem(PEM_FILE)

    if address:
        print(f"\n{'='*60}")
        print(f"  ADRESA TA DEVNET:")
        print(f"  {address}")
        print(f"{'='*60}")

        balance = check_balance(address)
        print(f"\nBalanta curenta: {balance:.4f} xEGLD")

        if balance < 0.1:
            print("\nBalanta insuficienta pentru deploy!")
            print("\nFondeaza walletul:")
            print(f"  1. Deschide: https://devnet-wallet.multiversx.com/faucet")
            print(f"  2. Paste adresa: {address}")
            print(f"  3. Click Request Tokens (primesti 30 xEGLD)")
            print(f"  4. Asteapta 15-30 secunde")
            print(f"\nVerifica balanta dupa:")
            print(f"  python devnet/wallet_setup_windows.py")
        else:
            print(f"\nGata pentru deploy! Ruleaza:")
            print(f"   python devnet/deploy_windows.py")
    else:
        print("[WARN] Nu am putut citi adresa din PEM")

if __name__ == "__main__":
    main()

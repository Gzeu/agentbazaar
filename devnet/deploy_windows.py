#!/usr/bin/env python3
"""
AgentBazaar Windows Deploy Script
Inlocuieste deploy.sh pentru Windows (fara WSL/bash)
Foloseste: python devnet/deploy_windows.py
"""
import subprocess, json, sys, os, time, re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEVNET_DIR = Path(__file__).parent
CONFIG_FILE = DEVNET_DIR / "devnet-config.json"
ADDRESSES_FILE = DEVNET_DIR / "deployed-addresses.json"
PEM_FILE = DEVNET_DIR / "deployer.pem"

PROXY = "https://devnet-gateway.multiversx.com"
CHAIN = "D"

def log(msg, color=""):
    colors = {"green": "\033[92m", "red": "\033[91m", "yellow": "\033[93m", "blue": "\033[94m", "": ""}
    reset = "\033[0m" if color else ""
    print(f"{colors[color]}{msg}{reset}")

def run(cmd, check=True, cwd=None):
    log(f"  > {' '.join(str(c) for c in cmd)}", "blue")
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    if check and result.returncode != 0:
        log(f"EROARE: {result.stderr}", "red")
        log(f"STDOUT: {result.stdout}", "red")
        sys.exit(1)
    return result

def build_contract(name):
    contract_dir = ROOT / "contracts" / name
    if not (contract_dir / "src").exists():
        log(f"  [SKIP] {name} - director src lipsa", "yellow")
        return False

    log(f"\n[BUILD] {name}...", "blue")

    # Incearca mai intai sc-meta
    result = run(["sc-meta", "all", "build", "--path", str(contract_dir)], check=False)
    if result.returncode == 0:
        wasm_files = list((contract_dir / "output").glob("*.wasm"))
        if wasm_files:
            log(f"  [OK] sc-meta build reusit: {wasm_files[0].name}", "green")
            return True

    # Fallback: cargo build direct -> wasm in target/
    log(f"  [INFO] sc-meta nu a mers, folosesc cargo build direct...", "yellow")
    result = run(
        ["cargo", "build", "--target", "wasm32-unknown-unknown", "--release",
         "--manifest-path", str(contract_dir / "Cargo.toml")],
        check=False
    )
    if result.returncode == 0:
        wasm = find_wasm(name)
        if wasm:
            log(f"  [OK] cargo build reusit: {wasm}", "green")
            return True
    log(f"  [WARN] Build esuat pentru {name}: {result.stderr[:300]}", "yellow")
    return False

def find_wasm(name):
    # 1. sc-meta output dir
    sc_meta_paths = [
        ROOT / "contracts" / name / "output" / f"{name}.wasm",
        ROOT / "contracts" / name / "output" / f"agentbazaar-{name}.wasm",
    ]
    for p in sc_meta_paths:
        if p.exists():
            return str(p)
    output_dir = ROOT / "contracts" / name / "output"
    if output_dir.exists():
        wasm_list = list(output_dir.glob("*.wasm"))
        if wasm_list:
            return str(wasm_list[0])

    # 2. cargo build target dir
    cargo_paths = [
        ROOT / "target" / "wasm32-unknown-unknown" / "release" / f"{name}.wasm",
        ROOT / "contracts" / name / "target" / "wasm32-unknown-unknown" / "release" / f"{name}.wasm",
    ]
    for p in cargo_paths:
        if p.exists():
            return str(p)

    # 3. Cauta recursiv in target/
    target_dir = ROOT / "target" / "wasm32-unknown-unknown" / "release"
    if target_dir.exists():
        matches = list(target_dir.glob(f"{name}*.wasm"))
        if matches:
            return str(matches[0])

    return None

def deploy_contract(name, args=None):
    wasm = find_wasm(name)
    if not wasm:
        log(f"  [SKIP] {name}.wasm nu exista - skip deploy", "yellow")
        return None

    log(f"\n[DEPLOY] {name}... wasm={wasm}", "blue")
    cmd = [
        "mxpy", "contract", "deploy",
        f"--bytecode={wasm}",
        f"--pem={PEM_FILE}",
        f"--proxy={PROXY}",
        f"--chain={CHAIN}",
        "--gas-limit=80000000",
        "--outfile=deploy-out.json",
        "--send",
        "--wait-result",
    ]
    if args:
        cmd.append(f"--arguments={' '.join(args)}")

    result = run(cmd, check=False)

    out_file = Path("deploy-out.json")
    if out_file.exists():
        try:
            data = json.loads(out_file.read_text())
            addr = (data.get("contractAddress") or
                    data.get("data", {}).get("transaction", {}).get("contractAddress", "") or "")
            if addr:
                log(f"  [OK] {name} deployed: {addr}", "green")
                out_file.unlink()
                return addr
        except:
            pass

    stdout = result.stdout + result.stderr
    match = re.search(r"erd1[a-z0-9]{58}", stdout)
    if match:
        addr = match.group(0)
        log(f"  [OK] {name} deployed: {addr}", "green")
        return addr

    log(f"  [WARN] {name} - adresa nu a putut fi determinata", "yellow")
    log(f"  Stdout: {result.stdout[:500]}", "yellow")
    log(f"  Stderr: {result.stderr[:500]}", "yellow")
    return None

def patch_env(addresses):
    env_files = [
        ROOT / "apps" / "frontend" / "temp-frontend" / ".env.local",
        ROOT / "apps" / "backend" / ".env",
    ]
    mappings = {
        "NEXT_PUBLIC_REGISTRY_ADDRESS": addresses.get("registry", ""),
        "NEXT_PUBLIC_ESCROW_ADDRESS": addresses.get("escrow", ""),
        "NEXT_PUBLIC_REPUTATION_ADDRESS": addresses.get("reputation", ""),
        "REGISTRY_ADDRESS": addresses.get("registry", ""),
        "ESCROW_ADDRESS": addresses.get("escrow", ""),
        "REPUTATION_ADDRESS": addresses.get("reputation", ""),
    }
    for env_file in env_files:
        if env_file.exists():
            content = env_file.read_text()
            for key, val in mappings.items():
                if val:
                    if re.search(f"^{key}=", content, re.MULTILINE):
                        content = re.sub(f"^{key}=.*$", f"{key}={val}", content, flags=re.MULTILINE)
                    else:
                        content += f"\n{key}={val}\n"
            env_file.write_text(content)
            log(f"  [OK] Patched {env_file.name}", "green")

def check_balance():
    import urllib.request
    if not PEM_FILE.exists():
        log("[WARN] deployer.pem nu exista!", "yellow")
        return
    pem_content = PEM_FILE.read_text()
    match = re.search(r"erd1[a-z0-9]{58}", pem_content)
    if not match:
        log("[WARN] Nu pot citi adresa din PEM", "yellow")
        return
    address = match.group(0)
    log(f"\n[CHECK] Verificare balanta pentru {address}...", "blue")
    try:
        url = f"https://devnet-api.multiversx.com/accounts/{address}"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
            balance_egld = int(data.get("balance", 0)) / 10**18
            log(f"  Balanta: {balance_egld:.4f} xEGLD", "green" if balance_egld > 0.1 else "red")
            if balance_egld < 0.1:
                log(f"  [WARN] Balanta prea mica! Fondeaza la: https://devnet-wallet.multiversx.com/faucet", "yellow")
                return False
            return True
    except Exception as e:
        log(f"  [WARN] Nu pot verifica balanta: {e}", "yellow")
        return None

def main():
    log("=" * 60, "green")
    log("  AgentBazaar Deploy Script (Windows/Python)", "green")
    log("=" * 60, "green")

    if not PEM_FILE.exists():
        log(f"\n[ERROR] {PEM_FILE} nu exista!", "red")
        log("Ruleaza mai intai: python devnet/wallet_setup_windows.py", "yellow")
        sys.exit(1)

    ok = check_balance()
    if ok is False:
        sys.exit(1)

    addresses = {}

    for name in ["registry", "reputation", "escrow", "token", "dao"]:
        build_contract(name)
        addr = deploy_contract(name)
        if addr:
            addresses[name] = addr
        time.sleep(2)  # evita nonce issues

    if addresses:
        ADDRESSES_FILE.write_text(json.dumps(addresses, indent=2))
        log(f"\n[SAVED] Adrese salvate in {ADDRESSES_FILE}", "green")
        log(json.dumps(addresses, indent=2), "green")
        log("\n[PATCH] Actualizez .env files...", "blue")
        patch_env(addresses)
    else:
        log("\n[WARN] Nicio adresa deployata - verifica ca mxpy e instalat", "yellow")
        log("  pip install mxpy", "yellow")

    log("\n" + "=" * 60, "green")
    log("  Deploy complet!", "green")
    log("  Explorer: https://devnet-explorer.multiversx.com", "green")
    log("=" * 60, "green")

if __name__ == "__main__":
    main()

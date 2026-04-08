#!/usr/bin/env python3
"""
AgentBazaar Windows Deploy Script
Foloseste: python devnet/deploy_windows.py
"""
import subprocess, json, sys, time, re
from pathlib import Path

ROOT = Path(__file__).parent.parent
DEVNET_DIR = Path(__file__).parent
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
        log(f"EROARE: {result.stderr[-800:]}", "red")
        sys.exit(1)
    return result

def find_wasm(name):
    """Cauta WASM in toate locatiile posibile."""
    candidates = [
        # sc-meta output
        ROOT / "contracts" / name / "output" / f"{name}.wasm",
        ROOT / "contracts" / name / "output" / f"agentbazaar-{name}.wasm",
        # cargo workspace target (agentbazaar-2/target/)
        ROOT / "target" / "wasm32-unknown-unknown" / "release" / f"{name}.wasm",
        # cargo local target
        ROOT / "contracts" / name / "target" / "wasm32-unknown-unknown" / "release" / f"{name}.wasm",
    ]
    for p in candidates:
        if p.exists():
            return p

    # sc-meta output glob
    output_dir = ROOT / "contracts" / name / "output"
    if output_dir.exists():
        found = list(output_dir.glob("*.wasm"))
        if found:
            return found[0]

    # workspace target glob - cauta orice .wasm care contine numele
    target_release = ROOT / "target" / "wasm32-unknown-unknown" / "release"
    if target_release.exists():
        # exact match
        exact = list(target_release.glob(f"{name}.wasm"))
        if exact:
            return exact[0]
        # partial match (ex: agentbazaar_registry.wasm)
        partial = [f for f in target_release.glob("*.wasm") if name in f.stem]
        if partial:
            return partial[0]

    return None

def build_contract(name):
    contract_dir = ROOT / "contracts" / name
    if not (contract_dir / "src").exists():
        log(f"  [SKIP] {name} - director src lipsa", "yellow")
        return False

    log(f"\n[BUILD] {name}...", "blue")

    # Daca WASM exista deja, skip build
    existing = find_wasm(name)
    if existing:
        log(f"  [OK] WASM existent: {existing}", "green")
        return True

    # Incearca sc-meta
    result = run(["sc-meta", "all", "build", "--path", str(contract_dir)], check=False)
    if result.returncode == 0:
        wasm = find_wasm(name)
        if wasm:
            log(f"  [OK] sc-meta build: {wasm}", "green")
            return True

    # Fallback: cargo build direct
    log(f"  [INFO] Folosesc cargo build...", "yellow")
    result = run(
        ["cargo", "build", "--target", "wasm32-unknown-unknown", "--release",
         "--manifest-path", str(contract_dir / "Cargo.toml")],
        check=False
    )
    if result.returncode == 0:  # 0 = succes, warnings in stderr sunt normale
        wasm = find_wasm(name)
        if wasm:
            log(f"  [OK] cargo build: {wasm}", "green")
            return True
        # WASM inca nu e gasit - listeaza target/ pentru debug
        target_release = ROOT / "target" / "wasm32-unknown-unknown" / "release"
        if target_release.exists():
            all_wasm = list(target_release.glob("*.wasm"))
            log(f"  [DEBUG] WASM in target/release: {[f.name for f in all_wasm]}", "yellow")
        else:
            log(f"  [DEBUG] target/wasm32-unknown-unknown/release/ nu exista", "yellow")
            log(f"  [DEBUG] ROOT={ROOT}", "yellow")
    else:
        log(f"  [ERROR] Build esuat (returncode={result.returncode})", "red")
        log(f"  {result.stderr[-600:]}", "red")

    return False

def deploy_contract(name, args=None):
    wasm = find_wasm(name)
    if not wasm:
        log(f"  [SKIP] {name}.wasm nu exista - skip deploy", "yellow")
        return None

    log(f"\n[DEPLOY] {name} <- {wasm}", "blue")

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
                log(f"  [OK] {name} -> {addr}", "green")
                out_file.unlink()
                return addr
        except:
            pass

    stdout = result.stdout + result.stderr
    match = re.search(r"erd1[a-z0-9]{58}", stdout)
    if match:
        addr = match.group(0)
        log(f"  [OK] {name} -> {addr}", "green")
        return addr

    log(f"  [WARN] {name} - adresa nedeterminata", "yellow")
    log(f"  Stdout: {result.stdout[:400]}", "yellow")
    log(f"  Stderr: {result.stderr[:400]}", "yellow")
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
    pem_content = PEM_FILE.read_text()
    match = re.search(r"erd1[a-z0-9]{58}", pem_content)
    if not match:
        log("[WARN] Nu pot citi adresa din PEM", "yellow")
        return None
    address = match.group(0)
    log(f"\n[CHECK] Balanta pentru {address}...", "blue")
    try:
        url = f"https://devnet-api.multiversx.com/accounts/{address}"
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read())
            balance_egld = int(data.get("balance", 0)) / 10**18
            log(f"  Balanta: {balance_egld:.4f} xEGLD", "green" if balance_egld > 0.1 else "red")
            if balance_egld < 0.1:
                log(f"  [WARN] Fondeaza la: https://devnet-wallet.multiversx.com/faucet", "yellow")
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
        log(f"[ERROR] {PEM_FILE} nu exista!", "red")
        log("Ruleaza: python devnet/wallet_setup_windows.py", "yellow")
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
        time.sleep(2)

    if addresses:
        ADDRESSES_FILE.write_text(json.dumps(addresses, indent=2))
        log(f"\n[SAVED] {ADDRESSES_FILE}", "green")
        log(json.dumps(addresses, indent=2), "green")
        patch_env(addresses)
    else:
        log("\n[WARN] Nicio adresa deployata", "yellow")
        log("  Verifica: mxpy --version", "yellow")
        log("  Instalare: pip install mxpy", "yellow")

    log("\n" + "=" * 60, "green")
    log("  Deploy complet! Explorer: https://devnet-explorer.multiversx.com", "green")
    log("=" * 60, "green")

if __name__ == "__main__":
    main()

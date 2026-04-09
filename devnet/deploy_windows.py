import subprocess
import sys
import os
import json
import re
import shutil
from pathlib import Path

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PEM_FILE = os.path.join(SCRIPT_DIR, "deployer.pem")
CONFIG_FILE = os.path.join(SCRIPT_DIR, "network-config.json")
ADDRESSES_FILE = os.path.join(SCRIPT_DIR, "deployed-addresses.json")

CONTRACTS = ["registry", "escrow", "reputation", "token", "dao"]

GAS_LIMITS = {
    "registry": 80000000,
    "escrow": 100000000,
    "reputation": 80000000,
    "token": 60000000,
    "dao": 80000000,
}

INIT_ARGS = {
    "registry": ["100"],
    "reputation": ["50000000000000000"],
    "token": ["1000000000000000000000000"],
    "dao": ["BAZAAR-000000", "1000", "86400", "3600"],
}

PROXY = "https://devnet-gateway.multiversx.com"
CHAIN = "D"


def header(msg):
    print("=" * 60)
    print(f"  {msg}")
    print("=" * 60)

def info(msg): print(f"  {msg}")
def ok(msg): print(f"  [OK] {msg}")
def err(msg): print(f"  [ERROR] {msg}")
def warn(msg): print(f"  [WARN] {msg}")


def find_mxpy():
    """Find mxpy.exe searching common Windows locations."""
    # 1. Already in PATH
    found = shutil.which("mxpy")
    if found:
        return found

    # 2. AppData\Roaming\Python\PythonXXX\Scripts (user install location for Python 3.x)
    appdata = os.environ.get("APPDATA", "")
    if appdata:
        python_base = Path(appdata) / "Python"
        if python_base.exists():
            for pyver in sorted(python_base.iterdir(), reverse=True):
                candidate = pyver / "Scripts" / "mxpy.exe"
                if candidate.exists():
                    return str(candidate)

    # 3. Next to current python.exe Scripts folder
    scripts_next_to_python = Path(sys.executable).parent / "Scripts" / "mxpy.exe"
    if scripts_next_to_python.exists():
        return str(scripts_next_to_python)

    # 4. python -m site --user-base / Scripts
    try:
        result = subprocess.run(
            [sys.executable, "-m", "site", "--user-base"],
            capture_output=True, text=True
        )
        user_base = result.stdout.strip()
        candidate = Path(user_base) / "Scripts" / "mxpy.exe"
        if candidate.exists():
            return str(candidate)
    except Exception:
        pass

    return None


def ensure_mxpy():
    mxpy = find_mxpy()
    if mxpy:
        ok(f"mxpy gasit: {mxpy}")
        return mxpy
    warn("mxpy nu este in PATH. Se instaleaza...")
    subprocess.run([sys.executable, "-m", "pip", "install", "mxpy"], check=True)
    mxpy = find_mxpy()
    if mxpy:
        ok(f"mxpy instalat: {mxpy}")
        return mxpy
    err("mxpy nu a putut fi gasit dupa instalare.")
    err("Adauga manual in PATH: %APPDATA%\\Python\\Python312\\Scripts")
    sys.exit(1)


def run(cmd, check=True, cwd=None):
    cmd_str = " ".join(cmd) if isinstance(cmd, list) else cmd
    info(f"> {cmd_str}")
    result = subprocess.run(
        cmd, capture_output=True, text=True, cwd=cwd
    )
    if result.stdout.strip():
        for line in result.stdout.strip().splitlines()[-10:]:
            print(f"    {line}")
    if result.stderr.strip():
        for line in result.stderr.strip().splitlines()[-20:]:
            print(f"    {line}")
    if check and result.returncode != 0:
        err(f"Comanda a esuat (returncode={result.returncode})")
        sys.exit(1)
    return result


def check_balance():
    if not os.path.exists(PEM_FILE):
        err(f"PEM file nu exista: {PEM_FILE}")
        err("Copiaza deployer.pem in folderul devnet/")
        sys.exit(1)
    with open(PEM_FILE, "r") as f:
        content = f.read()
    match = re.search(r"for (erd1[a-z0-9]+)", content)
    if not match:
        err("Nu s-a putut extrage adresa din PEM")
        sys.exit(1)
    address = match.group(1)
    print(f"\n[CHECK] Balanta pentru {address}...")
    try:
        import urllib.request
        url = f"{PROXY}/address/{address}/balance"
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
        balance_raw = int(data.get("data", {}).get("balance", "0"))
        balance_egld = balance_raw / 1e18
        info(f"Balanta: {balance_egld:.4f} xEGLD")
        if balance_egld < 0.1:
            warn("Balanta prea mica! Mergi la https://devnet-wallet.multiversx.com/faucet")
            sys.exit(1)
    except Exception as e:
        warn(f"Nu s-a putut verifica balanta: {e}")


def build_contract(name):
    print(f"\n[BUILD] {name}...")
    contract_path = os.path.join(PROJECT_ROOT, "contracts", name)
    wasm_path = os.path.join(PROJECT_ROOT, "target", "wasm32-unknown-unknown", "release", f"{name}.wasm")

    if shutil.which("sc-meta"):
        cmd = ["sc-meta", "all", "build", "--path", contract_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0 and os.path.exists(wasm_path):
            ok(f"sc-meta build: {wasm_path}")
            return wasm_path

    info("Folosesc cargo build...")
    manifest = os.path.join(contract_path, "Cargo.toml")
    cmd = [
        "cargo", "build",
        "--target", "wasm32-unknown-unknown",
        "--release",
        "--manifest-path", manifest
    ]
    result = run(cmd, check=False)
    if result.returncode != 0:
        err(f"Build esuat (returncode={result.returncode})")
        return None
    if os.path.exists(wasm_path):
        ok(f"cargo build: {wasm_path}")
        return wasm_path
    err(f"{name}.wasm nu exista - skip deploy")
    return None


def deploy_contract(name, wasm_path, addresses, mxpy_exe):
    print(f"\n[DEPLOY] {name} <- {wasm_path}")
    gas = GAS_LIMITS.get(name, 80000000)

    cmd = [
        mxpy_exe, "contract", "deploy",
        f"--bytecode={wasm_path}",
        f"--pem={PEM_FILE}",
        f"--proxy={PROXY}",
        f"--chain={CHAIN}",
        f"--gas-limit={gas}",
        "--outfile=deploy-out.json",
        "--send",
        "--wait-result"
    ]

    args = INIT_ARGS.get(name)
    if name == "escrow" and addresses.get("registry") and addresses.get("reputation"):
        args = [addresses["registry"], addresses["reputation"]]
    if args:
        cmd += ["--arguments"] + args

    result = run(cmd, check=False)
    if result.returncode != 0:
        err(f"Deploy esuat pentru {name}")
        return None

    output_text = result.stdout + result.stderr
    for pattern in [
        r'"address"\s*:\s*"(erd1[a-z0-9]+)"',
        r'contract address:\s*(erd1[a-z0-9]+)',
        r'(erd1[a-z0-9]{58,62})'
    ]:
        m = re.search(pattern, output_text)
        if m:
            addr = m.group(1)
            ok(f"{name} deployed la: {addr}")
            return addr

    if os.path.exists("deploy-out.json"):
        try:
            with open("deploy-out.json") as f:
                data = json.load(f)
            addr = (data.get("emitted_tx", {}).get("receiver") or
                    data.get("contractAddress") or
                    data.get("address"))
            if addr:
                ok(f"{name} deployed la: {addr}")
                return addr
        except Exception:
            pass

    warn(f"Nu s-a putut extrage adresa pentru {name}")
    return None


def update_env(addresses):
    for env_file in [".env", ".env.local"]:
        path = os.path.join(PROJECT_ROOT, env_file)
        if not os.path.exists(path):
            continue
        with open(path, "r") as f:
            content = f.read()
        for name, addr in addresses.items():
            if addr:
                key = f"NEXT_PUBLIC_{name.upper()}_CONTRACT"
                new_content = re.sub(
                    rf"^({key}=).*$", rf"\g<1>{addr}", content, flags=re.MULTILINE
                )
                if new_content == content:
                    new_content += f"\n{key}={addr}"
                content = new_content
        with open(path, "w") as f:
            f.write(content)
        ok(f"Actualizat {env_file}")


def main():
    header("AgentBazaar Deploy Script (Windows/Python)")
    mxpy_exe = ensure_mxpy()
    check_balance()

    wasm_paths = {}
    for name in CONTRACTS:
        wasm = build_contract(name)
        if wasm:
            wasm_paths[name] = wasm

    if not wasm_paths:
        warn("Niciun contract nu s-a compilat.")
        sys.exit(1)

    addresses = {}
    for name in CONTRACTS:
        if name not in wasm_paths:
            warn(f"Sar {name} (build esuat)")
            continue
        addr = deploy_contract(name, wasm_paths[name], addresses, mxpy_exe)
        if addr:
            addresses[name] = addr

    if not addresses:
        warn("Nicio adresa deployata")
        sys.exit(1)

    with open(ADDRESSES_FILE, "w") as f:
        json.dump(addresses, f, indent=2)
    ok(f"Adrese salvate in {ADDRESSES_FILE}")
    update_env(addresses)

    print()
    header("Deploy complet!")
    for name, addr in addresses.items():
        info(f"{name:12} -> {addr}")
    info("Explorer: https://devnet-explorer.multiversx.com")
    print()


if __name__ == "__main__":
    main()

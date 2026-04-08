"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { ConnectModal } from "@/components/ConnectModal";

const NAV_LINKS = [
  { href: "/marketplace",  label: "Browse"      },
  { href: "/provider",     label: "Provider"     },
  { href: "/consumer",     label: "Consumer"     },
  { href: "/events",       label: "Live Feed"    },
  { href: "/leaderboard",  label: "Leaderboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    connected,
    connecting,
    openModal,
    closeModal,
    disconnect,
    shortAddress,
    balance,
    network,
    showModal,
  } = useWallet();

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-sm"
        style={{
          background: "rgba(14,15,15,0.88)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#00c2a8" fillOpacity="0.15" />
              <path d="M12 28L20 12L28 28" stroke="#00c2a8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 23H25" stroke="#00c2a8" strokeWidth="2" strokeLinecap="round" />
              <circle cx="20" cy="12" r="2" fill="#00c2a8" />
            </svg>
            <span className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
              AgentBazaar
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  color:
                    pathname === link.href
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
                  background:
                    pathname === link.href
                      ? "var(--color-surface-2)"
                      : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Network badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              style={{
                background: "var(--color-surface-2)",
                color: "var(--color-text-muted)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot"
              />
              {network}
            </div>

            {connected ? (
              <div className="flex items-center gap-2">
                {/* Balance */}
                <span
                  className="hidden sm:block text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {balance} EGLD
                </span>
                {/* Address chip */}
                <span
                  className="text-xs font-mono px-2.5 py-1 rounded-lg"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-primary)",
                  }}
                >
                  {shortAddress}
                </span>
                <button
                  onClick={disconnect}
                  className="btn-ghost"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={openModal}
                disabled={connecting}
                className="btn-primary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
              >
                {connecting ? "Connecting…" : "Connect xPortal"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Connect modal — rendered outside header to avoid z-index issues */}
      {showModal && <ConnectModal onClose={closeModal} />}
    </>
  );
}

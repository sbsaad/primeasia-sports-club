// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10, 22, 40, 0.85)",
        borderBottom: "1px solid var(--glass-border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div style={{
        maxWidth: "1200px", margin: "0 auto",
        padding: "0 24px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 38, height: 38, borderRadius: "10px",
            background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "17px", fontWeight: "800", color: "var(--navy)", flexShrink: 0
          }}>P</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Primeasia University
            </div>
            <div style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 600 }}>
              Sports Club
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/dashboard"
            className="btn-ghost"
            style={{ color: pathname === "/dashboard" ? "var(--gold)" : undefined }}
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="btn-ghost"
            style={{ color: pathname === "/upload" ? "var(--gold)" : undefined }}
          >
            {pathname === "/upload" ? "My Application" : "Apply"}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="btn-ghost"
              style={{ color: pathname === "/admin" ? "var(--gold)" : undefined }}
            >
              Admin
            </Link>
          )}
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={34}
              height={34}
              style={{ borderRadius: "50%", border: "2px solid var(--glass-border)" }}
            />
          )}
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "140px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sparkles, Shield, User, LogOut } from "lucide-react";

export default function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10, 22, 40, 0.88)",
        borderBottom: "1px solid var(--glass-border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo & Club Branding */}
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: "900",
              color: "var(--navy)",
              boxShadow: "0 0 16px rgba(201,162,39,0.45)",
              flexShrink: 0,
            }}
          >
            ⚽
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.2 }}>
              Primeasia University
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--gold)", fontWeight: 700, letterSpacing: "0.05em" }}>
              GAMES & SPORTS CLUB (PaUGSC)
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/dashboard"
            className="btn-ghost"
            style={{
              color: pathname === "/dashboard" ? "var(--gold)" : "var(--text-primary)",
              fontWeight: pathname === "/dashboard" ? 700 : 500,
              padding: "7px 14px",
              fontSize: "13px",
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/register"
            className="btn-ghost"
            style={{
              color: pathname === "/register" || pathname === "/upload" ? "var(--gold)" : "var(--text-primary)",
              fontWeight: pathname === "/register" || pathname === "/upload" ? 700 : 500,
              padding: "7px 14px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} /> Member Pass / Form
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="btn-ghost"
              style={{
                color: pathname === "/admin" ? "var(--gold)" : "#f472b6",
                fontWeight: pathname === "/admin" ? 700 : 600,
                padding: "7px 14px",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Shield size={14} /> Admin Panel
            </Link>
          )}
        </div>

        {/* User Profile Pill & Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={34}
              height={34}
              style={{ borderRadius: "50%", border: "2px solid var(--gold)", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--navy-mid)",
                border: "1px solid var(--gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                color: "var(--gold)",
              }}
            >
              <User size={16} />
            </div>
          )}
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {session?.user?.name?.split(" ")[0] || "Member"}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn-ghost"
            style={{ padding: "6px 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
            title="Sign Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </nav>
  );
}

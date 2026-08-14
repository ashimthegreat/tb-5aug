"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Logo({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  function handleClick() {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Image
        src="/images/logo.png"
        alt="TechBucket"
        width={480}
        height={158}
        priority
        sizes="120px"
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  );
}
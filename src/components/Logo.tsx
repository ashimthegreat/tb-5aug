import Image from "next/image";
import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/images/logo.png"
        alt="TechBucket"
        width={120}
        height={40}
        priority
        className="h-9 w-auto sm:h-10"
      />
    </Link>
  );
}

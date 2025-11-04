import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 32, showText = true, className = "" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="kindred"
        width={size}
        height={size}
        priority
      />
      {showText && (
        <span className="text-2xl font-bold">kindred</span>
      )}
    </Link>
  );
}


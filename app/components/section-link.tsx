"use client";

import Link from "next/link";

export function SectionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("/#")) {
      return;
    }

    const target = document.getElementById(href.slice(2));
    if (!target) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", href);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}

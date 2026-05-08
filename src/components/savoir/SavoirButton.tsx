import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = CommonProps & {
  href: string;
};

function classes(variant: CommonProps["variant"] = "primary", className = "") {
  const base =
    "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#00E5D1]/50";
  const styles = {
    primary: "bg-[#00E5D1] text-[#05091A] hover:bg-[#7C5CFF] hover:text-white",
    secondary: "border border-white/15 bg-white/10 text-white hover:border-[#00E5D1]/60",
    quiet: "text-white/75 hover:text-white",
  };
  return `${base} ${styles[variant]} ${className}`;
}

export function SavoirButton(props: ButtonProps | LinkProps) {
  if ("href" in props && props.href) {
    const { href, children, variant, className } = props;
    return (
      <Link href={href} className={classes(variant, className)}>
        {children}
      </Link>
    );
  }

  const { children, variant, className, ...buttonProps } = props;
  return (
    <button className={classes(variant, className)} {...buttonProps}>
      {children}
    </button>
  );
}

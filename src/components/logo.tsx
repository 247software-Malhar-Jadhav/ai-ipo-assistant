import { cn } from "@/lib/utils";

/**
 * App brand mark — an upward trend line over bars in a gradient rounded square.
 * Matches the favicon (src/app/icon.svg). `id` keeps the gradient unique when
 * the logo is rendered more than once on a page.
 */
export default function Logo({
  className,
  id = "logo",
}: {
  className?: string;
  id?: string;
}) {
  const gradId = `${id}-grad`;
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
      <g fill="#ffffff" opacity="0.32">
        <rect x="15" y="34" width="6" height="14" rx="2" />
        <rect x="29" y="28" width="6" height="20" rx="2" />
        <rect x="43" y="22" width="6" height="26" rx="2" />
      </g>
      <path
        d="M15 39 L26 30 L34 35 L48 19"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 18 H49 V27"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

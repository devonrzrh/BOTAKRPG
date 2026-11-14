import type { ReactNode } from "react";

// Filled, beveled inventory art. Each silhouette reads at 24 pixels.
const art = {
  "patch-kit": (
    <>
      <path fill="#652b32" d="m3 9 6-4h17l3 5v14l-5 4H7l-4-4Z" />
      <path fill="#d46b5b" d="m3 9 6-4h17l3 5-5 4H7Z" />
      <path fill="#aa4646" d="M7 13h19v13H7Z" />
      <path fill="#f7d9b3" d="M13 14h6v3h4v5h-4v4h-6v-4H9v-5h4Z" />
      <path fill="#ffab80" d="M9 7h13l-2 2H7Z" />
    </>
  ),
  "focus-cell": (
    <>
      <path fill="#233e4b" d="m4 24 1-6L19 4l6 1 4 4-1 6-14 14-6-1Z" />
      <path fill="#a4c4c6" d="m19 4 4 1 5 5-1 4-8-8ZM5 21l8 7-3 1-6-5Z" />
      <path fill="#26849a" d="m7 19 12-12 7 7-12 12Z" />
      <path fill="#6de2d7" d="m9 19 10-10 3 3-10 10Z" />
      <path fill="#d6fff0" d="m12 17 7-7 1 1-7 7Z" />
    </>
  ),
  "pulse-baton": (
    <>
      <path fill="#323e48" d="m3 25 2-4 5-3L22 4l5-1 3 3-1 5-14 12-4 6-5 1Z" />
      <path fill="#6f929a" d="M10 18 22 4l5-1 2 3-15 15Z" />
      <path fill="#edb866" d="M13 17 23 6l3-1 1 2-11 12Z" />
      <path fill="#fff0a5" d="m14 17 9-10 2-1-9 11Z" />
      <path fill="#60737c" d="m5 23 2-2 5 5-2 2Zm3-3 2-2 5 5-2 2Z" />
    </>
  ),
  "arc-projector": (
    <>
      <path fill="#273843" d="m2 17 5-7h8l5-4 9 2 2 5-6 5-7 1-4 10-7-2 4-9Z" />
      <path fill="#85a3ae" d="m4 15 5-4 6 1 6-5 8 2-5 5-13 2Z" />
      <path fill="#4e7690" d="m10 18 5-1-4 10-3-1Z" />
      <path fill="#5db9e1" d="m16 14 7-4 5 1-5 4-7 2Z" />
      <path fill="#d0faff" d="m22 3 4 3-2 2 5-1-2 6 5-7-5 1 1-3Z" />
    </>
  ),
  "phase-driver": (
    <>
      <path fill="#33294d" d="m3 25 3-6 9-6L21 3l8 1 1 7-8 7-6 2-6 10Z" />
      <path fill="#8876b5" d="m6 20 10-7 6-9 6 1-6 9-10 9Z" />
      <path fill="#d795eb" d="m15 14 8-9 3 2-7 10-8 4Z" />
      <path fill="#ffe5fb" d="m18 14 5-7 2 1-6 8-4 2Z" />
      <path fill="#a6accb" d="m5 23 2-2 5 3-2 3Z" />
    </>
  ),
  "insulated-coat": (
    <>
      <path fill="#362c28" d="m10 4 5-2 7 2 5 4 4 14-6 3-3-7 1 11H8l1-11-3 7-5-3L5 8Z" />
      <path fill="#987553" d="m6 9 5-4 4 6-2 16H9l1-15-5 11-3-2Z" />
      <path fill="#c09c6c" d="m26 9-6-4-4 7 1 15h5l-1-15 5 11 3-2Z" />
      <path fill="#e3bd84" d="m10 4 5-2 1 9Zm10 0-4-2v9Z" />
      <path fill="#5e4438" d="M10 20h4v2h-4Zm8 0h4v2h-4Z" />
    </>
  ),
  "mesh-vest": (
    <>
      <path fill="#253438" d="m7 4 5-2 2 5h4l2-5 5 2v10l3 9-3 6H7l-3-6 3-9Z" />
      <path fill="#82a89d" d="m8 5 3-1 3 6h4l3-6 3 1-1 13H9Z" />
      <path fill="#4c796f" d="M8 18h16l2 5-2 5H8l-2-5Z" />
      <path fill="#acd0bb" d="M10 12h12v4H10Zm-2 7h16v2H8Zm1 5h14v2H9Z" />
      <path fill="#263f3e" d="M14 11h4v17h-4Z" />
    </>
  ),
  "faraday-rig": (
    <>
      <path fill="#302c43" d="m2 10 6-6 5 1 3 4 3-4 5-1 6 6-5 10-1 9H8l-1-9Z" />
      <path fill="#ae9ac8" d="m3 10 5-5 5 1 3 5 3-5 5-1 5 5-5 3-4-3-4 3-4-3-4 3Z" />
      <path fill="#635882" d="m8 14 8 1 8-1-2 13H10Z" />
      <path fill="#d6a670" d="m8 11 2 1 2 13h8l2-13 2-1-2 16H10Z" />
      <path fill="#ffe4a1" d="m16 13-4 7h4l-1 4 5-7h-4Z" />
    </>
  ),
  skills: (
    <>
      <path fill="#453344" d="m3 26 6-6 3 1 2-4L4 8 3 3l6 1 10 10 8-10 4-1-1 6-10 12 2 2 3-1 5 6-3 3-6-5 1-2-5-2-5 2v2l-6 5Z" />
      <path fill="#e3c087" d="m5 5 4 1 9 10 9-10 2-1v3L18 21 6 8Z" />
      <path fill="#fff1cf" d="m5 5 12 13 1-2L9 6Zm24 0L18 18v3L29 8Z" />
      <path fill="#c9885d" d="m5 26 6-4 2 2-7 5Zm16-3 2-2 6 6-2 2Z" />
    </>
  ),
  brace: (
    <>
      <path fill="#26353e" d="m16 2 12 5v10l-3 7-9 7-9-7-3-7V7Z" />
      <path fill="#c6ad73" d="m16 4 10 4v8l-3 7-7 6-7-6-3-7V8Z" />
      <path fill="#497885" d="m16 7 7 3v6l-2 5-5 5-5-5-2-5v-6Z" />
      <path fill="#a9d9d6" d="m16 8 1 7 5 1-5 1-1 7-1-7-5-1 5-1Z" />
    </>
  ),
  items: (
    <>
      <path fill="#3b2924" d="m2 11 6-5h16l6 5v14l-5 4H7l-5-4Z" />
      <path fill="#bd8a54" d="M2 11 8 6h16l6 5-5 6H7Z" />
      <path fill="#8f5f40" d="M7 16h18v11H7Z" />
      <path fill="#e8c986" d="m8 8 4-2-1 10v11H8Zm13-2 3 1 1 9v11h-3V16Z" />
      <path fill="#eed8a0" d="M13 15h6v7h-6Z" />
      <path fill="#684536" d="M15 17h2v3h-2Z" />
    </>
  ),
  inspect: (
    <>
      <path fill="#4c3932" d="m18 18 4-2 9 10-5 5-10-9Z" />
      <path fill="#ca9662" d="m20 19 2-1 7 8-2 3Z" />
      <circle cx="12" cy="12" r="10" fill="#e2bd7b" />
      <circle cx="12" cy="12" r="7" fill="#426c75" />
      <path fill="#b9e7dc" d="M6 12a6 6 0 0 1 6-6l-2 3-4 4Z" />
    </>
  ),
  retreat: (
    <>
      <path fill="#433139" d="M16 3h13v25H16l-4-5V8Z" />
      <path fill="#93a6af" d="M18 5h9v21h-9Z" />
      <path fill="#3d5566" d="M19 7h6v17h-6Z" />
      <path fill="#de8d65" d="m1 17 10-8v5h11v6H11v5Z" />
      <path fill="#ffd4a5" d="m1 17 10-8v3l-6 5h17v-3H11l-4 3Z" />
    </>
  ),
  dodge: (
    <>
      <path fill="#74494e" d="m11 5 10-2-1 11 8 7-1 6H8l-3-4 7-4Z" />
      <path fill="#dd986a" d="m12 6 7-2-1 12 9 5-1 3H8l-1-2 8-3Z" />
      <path fill="#ffe0a2" d="m12 6 7-2v3l-6 3ZM2 12h8l-2 2H1Zm2 4h6l-2 2H2Z" />
      <path fill="#ad624e" d="M8 24h18v3H8Z" />
    </>
  ),
  probe: (
    <>
      <path fill="#30546a" d="M16 2 28 9v14l-12 7-12-7V9Z" />
      <path fill="#5795ad" d="m16 4 10 6v12l-10 6-10-6V10Z" />
      <path fill="#183844" d="m16 7 7 4v10l-7 4-7-4V11Z" />
      <path fill="#a9f4e7" d="m16 9 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
      <path fill="#e5fff2" d="m16 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" />
    </>
  ),
  firewall: (
    <>
      <path fill="#773c37" d="m2 8 14-5 14 5v13l-14 9L2 21Z" />
      <path fill="#e5915d" d="m4 9 12-4 12 4v11l-12 8-12-8Z" />
      <path fill="#a74c3f" d="M6 11h20v8l-10 7-10-7Z" />
      <path fill="#ffca87" d="M6 11h20v2H6Zm0 6h20v2H6Zm5-4h2v4h-2Zm9 0h2v4h-2Zm-5 6h2v7h-2Z" />
    </>
  ),
  trace: (
    <>
      <path fill="#374054" d="m3 28 4-8 10-10V7l4-4 8 8-4 4h-3L12 25Z" />
      <path fill="#b7a4db" d="m9 20 11-11 4 4-11 11-5 1Z" />
      <path fill="#8555ac" d="m12 17 6-6 4 4-6 6Z" />
      <path fill="#f5c5ff" d="m15 17 4-4 1 1-4 4Z" />
      <path fill="#e4c9ef" d="m18 6 2-2 8 8-2 2Zm5-3 2-2 6 6-2 2Z" />
    </>
  ),
  hint: (
    <>
      <path fill="#754d38" d="M10 21 6 14V7l5-5h10l5 5v7l-4 7v4l-4 5h-4l-4-5Z" />
      <path fill="#efb660" d="M11 19 8 13V8l4-4h8l4 4v5l-3 6Z" />
      <path fill="#fff1b2" d="m10 9 3-3h6l2 2-7 1-3 6Z" />
      <path fill="#a98d74" d="M11 21h10v4l-3 3h-4l-3-3Z" />
    </>
  ),
  advance: (
    <>
      <path fill="#294a49" d="M3 10h12V4l15 12-15 12v-6H3Z" />
      <path fill="#6eb59d" d="M5 12h12V8l10 8-10 8v-4H5Z" />
      <path fill="#c1e5bc" d="M5 12h12V8l10 8-10-5v3H5Z" />
    </>
  ),
  bookmark: (
    <>
      <path fill="#412e36" d="M4 5h20l4 5v18H8l-4-4Z" />
      <path fill="#bb9070" d="M7 7h17l2 4v14H8Z" />
      <path fill="#e5cf9e" d="M9 11h15v12H9Z" />
      <path fill="#a14f55" d="M14 7h6v14l-3-2-3 2Z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type RpgIconName = keyof typeof art;

export function RpgIcon({ name, size = 24 }: { name: RpgIconName; size?: number }) {
  return (
    <svg
      className="rpg-icon"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      {art[name]}
    </svg>
  );
}

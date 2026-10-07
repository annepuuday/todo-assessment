const paths = {
  check: <path d="M5 12.5 9.5 17 19 7" />,
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.4 2.4 4.6-4.8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r=".6" fill="currentColor" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7" />
      <path d="M6.5 7l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6M14 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10" />
      <path d="m15 8 4 4-4 4M9.5 12H19" />
    </>
  ),
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13.5 6.3 5.8A2 2 0 0 1 8.2 4.5h7.6a2 2 0 0 1 1.9 1.3L20 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.5Z" />
      <path d="M4 13.5h4.5l1 2h5l1-2H20" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3v4M15.5 3v4" />
    </>
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.57.1.78-.25.78-.55v-2.12c-3.17.69-3.84-1.34-3.84-1.34-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.53-.29-5.2-1.27-5.2-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.7 10.7 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.22 5.63.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55A11.3 11.3 0 0 0 12 .7Z"
    />
  ),
};

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

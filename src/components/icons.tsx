import type { SVGProps } from 'react';

export function LinguaCraftLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      width="32"
      height="32"
      {...props}
    >
      <path d="M50 10C27.9 10 10 27.9 10 50s17.9 40 40 40 40-17.9 40-40S72.1 10 50 10zm0 75c-19.3 0-35-15.7-35-35s15.7-35 35-35 35 15.7 35 35-15.7 35-35 35z" />
      <path d="M60.5 35h-21c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h6.5v20h-6.5c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h21c1.1 0 2-.9 2-2v-5c0 1.1-.9-2-2-2h-6.5V44h6.5c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

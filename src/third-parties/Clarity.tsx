'use client';

import Script from 'next/script';

export const CLARITY_PROJECT_ID = 'summarize';

export default function Clarity() {
  return (
    <Script
      id="clarity-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "summarize");
        `,
      }}
    />
  );
}

// Microsoft Clarity 초기화 함수
export const initClarity = () => {
  if (typeof window !== 'undefined' && typeof window.clarity === 'undefined') {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments) };
  }
};


import Script from 'next/script';

const Adsense: React.FC = () => {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4853497722580911"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
};

export default Adsense;

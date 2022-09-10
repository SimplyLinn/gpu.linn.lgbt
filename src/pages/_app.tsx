import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from 'src/contexts/auth';
import Layout from 'src/components/Layout';
import React from 'react';
import { WorkerInfoProvider } from 'src/contexts/workerInfo';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function MyApp({ Component, pageProps }: AppProps) {
  const requiresLogin =
    (Component as { requiresLogin?: unknown }).requiresLogin === true;
  const skipLayout =
    (Component as { skipLayout?: unknown }).skipLayout === true;
  const LayoutComp = skipLayout ? React.Fragment : Layout;
  return (
    <SkeletonTheme baseColor="#aaa" highlightColor="#fff">
      <AuthProvider requiresLogin={requiresLogin}>
        <WorkerInfoProvider updateInterval={20000}>
          {(isLoggedIn: boolean) => {
            return (
              <LayoutComp>
                {!requiresLogin || isLoggedIn ? (
                  <Component {...pageProps} />
                ) : null}
              </LayoutComp>
            );
          }}
        </WorkerInfoProvider>
      </AuthProvider>
    </SkeletonTheme>
  );
}

export default MyApp;

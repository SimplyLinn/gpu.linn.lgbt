import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from 'src/contexts/auth';
import Layout from 'src/components/Layout';
import React from 'react';
import { WorkerInfoProvider } from 'src/contexts/workerInfo';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SocketProvider } from 'src/contexts/socketContext';

function MyApp({ Component, pageProps }: AppProps) {
  const requiresLogin =
    (Component as { requiresLogin?: unknown }).requiresLogin === true;
  const skipLayout =
    (Component as { skipLayout?: unknown }).skipLayout === true;

  return (
    <SkeletonTheme baseColor="#aaa" highlightColor="#fff">
      <AuthProvider requiresLogin={requiresLogin}>
        <SocketProvider>
          <WorkerInfoProvider updateInterval={20000}>
            <Layout requiresLogin={requiresLogin} skipLayout={skipLayout}>
              <Component {...pageProps} />
            </Layout>
          </WorkerInfoProvider>
        </SocketProvider>
      </AuthProvider>
    </SkeletonTheme>
  );
}

export default MyApp;

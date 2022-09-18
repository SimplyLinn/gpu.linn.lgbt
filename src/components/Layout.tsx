import Head from 'next/head';
import React, { ReactNode } from 'react';
import WorkerInfo from './WorkerInfo';
import { signOut } from 'firebase/auth';
import { auth } from 'src/firebase';
import { useAuth } from 'src/contexts/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

function UserButton() {
  const { user } = useAuth();
  const router = useRouter();
  if (router.pathname === '/') return null;
  if (!user) {
    return (
      <Link href="/">
        <a>Sign in</a>
      </Link>
    );
  }
  return (
    <button
      onClick={() => {
        signOut(auth).then().catch(console.error);
      }}
    >
      Sign out
    </button>
  );
}

export default function Layout({
  children,
  requiresLogin,
  skipLayout,
}: {
  children?: ReactNode;
  requiresLogin: boolean;
  skipLayout: boolean;
}) {
  const { user } = useAuth();
  const path = user == null ? '/' : '/main';
  if (skipLayout) {
    return (
      <>
        <Head>
          <title>Linn&apos;s GPU Toybox</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {children}
      </>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Linn&apos;s GPU Toybox</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="flex-shrink-0 flex-grow-0 bg-gray-700 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <Link href={path}>
            <a>
              <h1 className="text-3xl font-bold">Linn&apos;s GPU Toybox</h1>
            </a>
          </Link>
          <UserButton />
        </div>
        <nav className="flex divide-x-2">
          <Link href={path}>
            <a className="pr-2">Home</a>
          </Link>
          <Link href="/txt2img">
            <a className="px-2">Text 2 Image</a>
          </Link>
          <Link href="/inpainting">
            <a className="px-2">Inpainting</a>
          </Link>
          <Link href="/img2img">
            <a className="px-2">Image modification</a>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        {!requiresLogin || user != null ? children : null}
      </main>
      <footer className="w-full flex-shrink-0 flex-grow-0 p-4 bg-gray-800">
        <WorkerInfo />
      </footer>
    </div>
  );
}

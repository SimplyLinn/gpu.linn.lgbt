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

export default function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Linn&apos;s GPU Toybox</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="flex-shrink-0 flex-grow-0 bg-gray-700 p-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Linn&apos;s GPU Toybox</h1>
        <UserButton />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="w-full flex-shrink-0 flex-grow-0 p-4 bg-gray-800">
        <WorkerInfo />
      </footer>
    </div>
  );
}

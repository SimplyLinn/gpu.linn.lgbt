import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from 'src/firebase';

const Context = React.createContext<{
  user: User | null;
}>({
  user: null,
});

export function AuthProvider({
  children,
  requiresLogin,
}: {
  children: React.ReactNode;
  requiresLogin: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let hasSetLoading = false;
    const unsubStateChange = auth.onAuthStateChanged(() => {
      setUser(auth.currentUser);
      if (!hasSetLoading) {
        setLoading(false);
        hasSetLoading = true;
      }
    });
    return () => {
      unsubStateChange();
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (requiresLogin && !user) {
      void router.replace({
        pathname: '/',
        query: {
          redirect: router.asPath,
        },
      });
    }
    if (user && router.pathname === '/') {
      const redirect =
        typeof router.query.redirect === 'string'
          ? router.query.redirect
          : undefined;
      if (!redirect?.startsWith('/') || redirect === '/') {
        void router.replace('/app');
      } else {
        void router.replace(redirect);
      }
    }
  }, [user, requiresLogin, loading, router]);

  const value = useMemo(() => ({ user }), [user]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth() {
  return React.useContext(Context);
}

export function useAssertedAuth() {
  const authCtx = useAuth();

  if (!authCtx.user) throw new Error('No auth context');
  return authCtx.user;
}

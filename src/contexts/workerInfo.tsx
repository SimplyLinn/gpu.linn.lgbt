import React, { useEffect, createContext, useContext, ReactNode } from 'react';
import { Data as WorkerData } from 'src/pages/api/workerStatus';
import { httpsCallable } from 'firebase/functions';
import { functions } from 'src/firebase';
import { useAuth } from './auth';

const workerStatus = httpsCallable<never, WorkerData>(
  functions,
  'api/workerStatus',
);

const defaultValue: {
  worker: WorkerData | null;
  lastFetched: Date | null;
  isError: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  isRefreshing: boolean;
} = {
  worker: null,
  error: null,
  isError: false,
  isRefreshing: false,
  lastFetched: null,
};

const Context = createContext(defaultValue);

export function WorkerInfoProvider({
  children,
  updateInterval = 5000,
}: {
  children: ReactNode;
  updateInterval?: number;
}) {
  const { user } = useAuth();
  const [value, setValue] = React.useState(defaultValue);
  const isLoggedIn = user != null;
  useEffect(() => {
    if (!isLoggedIn) {
      setValue(defaultValue);
      return;
    }
    let isMounted = true;
    let timeout: NodeJS.Timeout | null = null;
    const update = () => {
      setValue((prev) => ({ ...prev, isRefreshing: true }));
      workerStatus()
        .then(({ data }) => {
          if (isMounted) {
            setValue({
              worker: data,
              lastFetched: new Date(),
              isError: false,
              error: null,
              isRefreshing: false,
            });
          }
        })
        .catch((error) => {
          if (isMounted) {
            setValue((prev) => ({
              ...prev,
              isError: true,
              error,
              isRefreshing: false,
            }));
          }
        })
        .finally(() => {
          if (isMounted) {
            timeout = setTimeout(update, updateInterval);
          }
        });
    };
    update();
    return () => {
      isMounted = false;
      if (timeout != null) clearTimeout(timeout);
    };
  }, [updateInterval, isLoggedIn]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export default function useWorkerInfo() {
  return useContext(Context);
}

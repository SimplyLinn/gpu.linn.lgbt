import React, { useEffect, useRef, useState } from 'react';
import SocketIO, { Socket } from 'socket.io-client';
import { auth } from 'src/firebase';
import { onIdTokenChanged } from 'firebase/auth';

const Context = React.createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [idToken, setIdToken] = useState<string>();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsub = onIdTokenChanged(auth, (newUser) => {
      newUser
        ?.getIdToken()
        .then((token) => {
          if (!mounted) return;
          console.log(token);
          setIdToken(token);
        })
        .catch(console.error);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    console.log({ idToken });
    if (idToken != null) {
      if (!socketRef.current) {
        console.log('connecting');
        socketRef.current = SocketIO('http://localhost:5000/', {
          auth: { jwtToken: idToken },
        });
        socketRef.current.connect();
      }
      setSocket(socketRef.current);
    } else {
      if (socketRef.current) {
        console.log('disconnecting');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(socketRef.current);
    }
    if (socketRef.current) {
      const sock = socketRef.current;
      const onConnect = () => {
        console.log('connected');
      };
      const onDisconnect = () => {
        console.log('disconnected');
      };
      const onError = (err: any) => {
        console.log('connect_error', err, err.data);
      };
      sock.on('connect', onConnect);
      sock.on('disconnect', onDisconnect);
      sock.on('connect_error', onError);
      return () => {
        sock.off('connect', onConnect);
        sock.off('disconnect', onDisconnect);
        sock.off('connect_error', onError);
      };
    }
  }, [idToken]);

  return <Context.Provider value={socket}>{children}</Context.Provider>;
}

export function useSocket() {
  return React.useContext(Context);
}

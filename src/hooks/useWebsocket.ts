import {
  EffectCallback,
  DependencyList,
  useRef,
  useState,
  useEffect,
} from 'react';

type EffectReturn = ReturnType<EffectCallback>;

export type WsEffectCallback = (webSocket: WebSocket) => EffectReturn;

type WebSocketState = {
  webSocket: WebSocket | null;
  current: {
    url: string;
    onOpen: (ws: WebSocket) => void;
    onClose: (ws: WebSocket) => void;
  } | null;
  next: {
    url: string;
    onOpen: (ws: WebSocket) => void;
    onClose: (ws: WebSocket) => void;
  }[];
};

function websocketRunner(
  ref: React.MutableRefObject<WebSocketState | null>,
  runner: {
    url: string;
    onOpen: (ws: WebSocket) => void;
    onClose: (ws: WebSocket) => void;
  },
): () => void {
  const cleanup = () => {
    if (ref.current == null) return;
    const index = ref.current?.next.indexOf(runner);
    if (index > -1) {
      ref.current.next.splice(index, 1);
      return;
    }
    if (ref.current.current !== runner || ref.current.webSocket == null) return;
    const ws = ref.current.webSocket;
    let closeAttempts = 0;
    const close = () => {
      console.log('attempting close...');
      const isOpen = ws.readyState === WebSocket.OPEN;
      if (ws.bufferedAmount === 0 && isOpen) {
        ws.close(1000);
        return;
      }
      const isClosed = ws.readyState === WebSocket.CLOSED;
      if (isClosed) {
        console.log('Closed, no need to close again');
        return;
      }
      closeAttempts += 1;
      if (isOpen && closeAttempts < 10) {
        console.log('Awaiting buffer to drain');
        setTimeout(close, 100);
        return;
      }
      const isClosing = ws.readyState === WebSocket.CLOSING;
      if (isClosing && closeAttempts < 10) {
        console.log('Currently closing, awaiting closed state');
        setTimeout(close, 100);
        return;
      }
      const isConnecting = ws.readyState === WebSocket.CONNECTING;
      if (isConnecting && closeAttempts < 10) {
        console.log('Currently connecting, awaiting open state');
        setTimeout(close, 100);
        return;
      }
      console.log('Forcing close');
      ws.close(1000, 'Forced close');
    };
    if (ws.readyState !== WebSocket.CLOSED) {
      close();
    }
  };
  if (ref.current && ref.current.webSocket) {
    ref.current.next.push(runner);
    return cleanup;
  }
  if (ref.current == null) {
    ref.current = {
      webSocket: null,
      current: null,
      next: [],
    };
  }
  const webSocket = new WebSocket(runner.url);
  ref.current.current = runner;
  ref.current.webSocket = webSocket;
  webSocket.addEventListener('open', () => {
    runner.onOpen(webSocket);
  });
  webSocket.addEventListener('close', () => {
    runner.onClose(webSocket);
    if (ref.current?.current !== runner) return;
    ref.current.webSocket = null;
    ref.current.current = null;
    if (ref.current.next.length) {
      const nextRunner =
        ref.current.next.shift() as typeof ref.current.next[number];
      websocketRunner(ref, nextRunner);
    } else {
      ref.current = null;
    }
  });
  return cleanup;
}

export default function useWebsocket(
  effect: WsEffectCallback,
  deps: DependencyList,
  url: string,
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;
  const websocketRef = useRef<WebSocketState | null>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    let isMounted = true;
    const cleanup = websocketRunner(websocketRef, {
      url,
      onOpen(ws) {
        if (!isMounted) return;
        setWebSocket(ws);
      },
      onClose() {
        if (!isMounted) return;
        setWebSocket(null);
      },
    });
    return () => {
      isMounted = false;
      setWebSocket(null);
      cleanup();
    };
  }, [url]);

  useEffect(
    () => {
      if (webSocket == null) return;
      return effectRef.current(webSocket);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [webSocket, ...deps],
  );
}

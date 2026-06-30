import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const StreamContext = createContext();

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1/ws/signals';

export const StreamProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const currentPatientId = useRef(null);

  const streamEvents = useRef(new EventTarget());

  const sendSubscribe = (patientId) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && patientId) {
      socketRef.current.send(JSON.stringify({ type: 'subscribe', patient_id: patientId }));
    }
  };

  const subscribe = (patientId) => {
    currentPatientId.current = patientId;
    sendSubscribe(patientId);
  };

  useEffect(() => {
    let isMounted = true;
    let reconnectDelay = 1000;
    const MAX_RECONNECT_DELAY = 30000;
    let reconnectTimeoutId = null;

    const connect = () => {
      if (!isMounted) return;

      console.log(`WS Connecting to ${WS_URL}...`);
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isMounted) {
          setIsConnected(true);
          console.log('Global Stream Connected successfully');
          reconnectDelay = 1000; // Reset delay on successful connection
          // Re-subscribe after reconnect
          if (currentPatientId.current) {
            sendSubscribe(currentPatientId.current);
          }
        }
      };

      let lastUpdateTime = 0;
      const UPDATE_THROTTLE_MS = 100;

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          
          streamEvents.current.dispatchEvent(new CustomEvent('data', { detail: payload }));
          socketRef.current.latestData = payload;

          const now = Date.now();
          if (now - lastUpdateTime > UPDATE_THROTTLE_MS) {
            setData(payload);
            lastUpdateTime = now;
          }
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };

      socket.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
          const jitter = Math.floor(Math.random() * 400) + 100;
          const nextDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
          const finalDelay = nextDelay + jitter;
          
          console.warn(`WS Connection closed. Reconnecting in ${finalDelay}ms (backoff: ${reconnectDelay}ms)...`);
          reconnectDelay = nextDelay;

          reconnectTimeoutId = setTimeout(connect, finalDelay);
        }
      };

      socket.onerror = (err) => {
        console.error('WS Connection error:', err);
        socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, []);

  const sendUpdate = (payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return (
    <StreamContext.Provider value={{
      data,
      isConnected,
      sendUpdate,
      subscribe,
      events: streamEvents.current
    }}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => useContext(StreamContext);

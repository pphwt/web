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

    const connect = () => {
      if (!isMounted) return;

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isMounted) {
          setIsConnected(true);
          console.log('Global Stream Connected');
          // Re-subscribe after reconnect
          if (currentPatientId.current) {
            sendSubscribe(currentPatientId.current);
          }
        }
      };

      let lastUpdateTime = 0;
      const UPDATE_THROTTLE_MS = 100; // 10Hz update for UI stats

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          
          // Emit raw event for high-frequency consumers (ECG, 3D)
          streamEvents.current.dispatchEvent(new CustomEvent('data', { detail: payload }));

          // Always update ref for real-time access (low overhead)
          socketRef.current.latestData = payload;

          // Throttle React state update for stats/params
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
          setTimeout(connect, 3000);
        }
      };

      socket.onerror = (err) => {
        socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect on cleanup
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

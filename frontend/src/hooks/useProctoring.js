import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../lib/axios';

const LOCAL_PROCTOR_URL = 'http://localhost:8765';

export const useProctoring = (attemptId, stage, onWarning) => {
  const [status, setStatus] = useState('idle'); // 'idle', 'active', 'issue'
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const pollingRef = useRef(null);
  const attemptIdRef = useRef(attemptId);
  const stageRef = useRef(stage);
  const sessionIdRef = useRef(null);
  
  // Throttle warnings for the same event type to prevent popup spam (5s cooldown)
  const lastWarningTimesRef = useRef({});

  useEffect(() => {
    attemptIdRef.current = attemptId;
    stageRef.current = stage;
  }, [attemptId, stage]);

  const startProctoring = async () => {
    if (!attemptIdRef.current) return;
    setStatus('idle');
    setErrorMsg('');

    let sId = null;

    // 1. Start proctoring session on Node.js Backend
    try {
      const backendRes = await api.post('/student/proctoring/session/start', {
        attemptId: attemptIdRef.current,
        stage: stageRef.current
      });
      sId = backendRes.data?.session?.id;
    } catch (backendErr) {
      console.warn('Backend proctoring session creation warning; using fallback session id:', backendErr?.response?.data || backendErr?.message);
      sId = `proc-${stageRef.current.toLowerCase()}-${attemptIdRef.current}`;
    }

    setSessionId(sId);
    sessionIdRef.current = sId;

    // 2. Start local Python proctoring service
    try {
      await axios.post(`${LOCAL_PROCTOR_URL}/start`, {
        attemptId: attemptIdRef.current,
        stage: stageRef.current
      });
      
      setStatus('active');
      // 3. Start polling events
      startPolling();
    } catch (localErr) {
      console.warn('Local Python proctoring server not available', localErr);
      setStatus('issue');
      setErrorMsg('Python proctoring companion is not running. Please start it on port 8765.');
      
      // Log the failure event to backend if session exists
      if (sId && !sId.startsWith('proc-')) {
        await api.post(`/student/proctoring/session/${sId}/event`, {
          eventType: 'PYTHON_SERVICE_UNAVAILABLE',
          severity: 'WARNING',
          metadata: 'Candidate started assessment without local python proctor service running.'
        }).catch(() => {});
      }
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const response = await axios.get(`${LOCAL_PROCTOR_URL}/events`);
        const { events } = response.data;

        // If we were previously disconnected, restore status
        setStatus('active');
        setErrorMsg('');

        if (events && events.length > 0) {
          for (const evt of events) {
            // Forward event to backend database
            if (sessionIdRef.current) {
              await api.post(`/student/proctoring/session/${sessionIdRef.current}/event`, {
                eventType: evt.type,
                severity: evt.severity,
                duration: evt.duration,
                metadata: evt.metadata
              }).catch(err => console.error('Failed to persist proctoring event', err));
            }

            // Debounce/Throttle visual warning popups to avoid spamming the user
            const now = Date.now();
            const lastWarnTime = lastWarningTimesRef.current[evt.type] || 0;
            if (now - lastWarnTime > 5000) {
              lastWarningTimesRef.current[evt.type] = now;
              
              // Trigger visual warning in UI
              let friendlyMessage = 'Please remain focused on the assessment.';
              if (evt.type === 'LOOKING_AWAY') {
                friendlyMessage = 'Unusual gaze activity detected. Please look directly at the screen.';
              } else if (evt.type === 'PUPIL_GAZE_AWAY') {
                friendlyMessage = 'You are looking away from the screen.';
              } else if (evt.type === 'NO_FACE') {
                friendlyMessage = 'No face detected. Please ensure you stay in front of the camera.';
              } else if (evt.type === 'MULTIPLE_FACES') {
                friendlyMessage = 'Multiple faces detected. Ensure you are taking the assessment alone.';
              } else if (evt.type === 'OBJECT') {
                friendlyMessage = 'Prohibited object detected. Please keep mobile devices away.';
              } else if (evt.type === 'CAMERA_DISCONNECTED') {
                friendlyMessage = 'Camera is unavailable. Please check your connection.';
              } else if (evt.type === 'CAMERA_RECONNECTED') {
                friendlyMessage = 'Camera reconnected successfully.';
              }
              
              if (onWarning) onWarning(friendlyMessage, evt.type);
            }
          }
        }
      } catch (err) {
        console.warn('Lost connection to local proctoring server', err);
        setStatus('issue');
        setErrorMsg('Proctoring companion disconnected. Please keep it running.');
        
        // Notify user about local service loss
        const now = Date.now();
        const lastWarnTime = lastWarningTimesRef.current['LOCAL_SERVICE_DISCONNECTED'] || 0;
        if (now - lastWarnTime > 10000) {
          lastWarningTimesRef.current['LOCAL_SERVICE_DISCONNECTED'] = now;
          if (onWarning) {
            onWarning('Proctoring companion connection lost. Please ensure session_monitor_pro.py is running.', 'SERVICE_DISCONNECTED');
          }
          
          if (sessionIdRef.current) {
            api.post(`/student/proctoring/session/${sessionIdRef.current}/event`, {
              eventType: 'PYTHON_SERVICE_DISCONNECTED',
              severity: 'WARNING',
              metadata: 'Lost connection to localhost proctor server.'
            }).catch(() => {});
          }
        }
      }
    }, 1500);
  };

  const stopProctoring = async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    let summary = null;
    try {
      const response = await axios.post(`${LOCAL_PROCTOR_URL}/stop`);
      summary = response.data?.summary;
    } catch (err) {
      console.warn('Failed to stop local proctor server cleanly', err);
    }

    if (sessionIdRef.current) {
      try {
        await api.post(`/student/proctoring/session/${sessionIdRef.current}/complete`, {
          riskScore: summary?.riskScore || 0,
          riskLevel: summary?.riskLevel || 'LOW'
        });
      } catch (err) {
        console.error('Failed to complete proctoring session on backend', err);
      }
    }

    setStatus('idle');
    setSessionId(null);
    sessionIdRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    status,
    errorMsg,
    sessionId,
    startProctoring,
    stopProctoring
  };
};

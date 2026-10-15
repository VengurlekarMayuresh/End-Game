import { useState, useEffect, useRef, useCallback } from 'react';

export const useHardwareMonitor = (isActive = false, options = {}) => {
  const { holdVideo = false } = options;
  const [hasPermissions, setHasPermissions] = useState(false);
  const [hardwareError, setHardwareError] = useState('');
  const [isHardwareLost, setIsHardwareLost] = useState(false);
  const streamRef = useRef(null);

  const requestPermissions = useCallback(async () => {
    try {
      setHardwareError('');

      // 1. Check physical hardware presence via enumerateDevices
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCam = devices.some(d => d.kind === 'videoinput');
          const hasMic = devices.some(d => d.kind === 'audioinput');

          if (!hasCam) {
            setHardwareError('No camera found. Please connect your webcam.');
            setHasPermissions(false);
            setIsHardwareLost(true);
            return false;
          }
          if (!hasMic) {
            setHardwareError('No microphone found. Please connect your microphone.');
            setHasPermissions(false);
            setIsHardwareLost(true);
            return false;
          }
        } catch (enumErr) {
          console.warn('Hardware enumeration error', enumErr);
        }
      }

      // 2. Request user media stream
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        // If Python proctoring companion or another process has camera exclusively locked on Windows,
        // test audio only to verify mic access, since video is being processed by the local Python proctor.
        if (err.name === 'NotReadableError' || err.name === 'AbortError' || err.name === 'TrackStartError') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            setHasPermissions(true);
            setIsHardwareLost(false);
            setHardwareError('');
            return true;
          } catch (micErr) {
            setHardwareError('Camera is busy and microphone access was denied.');
            setHasPermissions(false);
            setIsHardwareLost(true);
            return false;
          }
        }
        throw err;
      }

      // Clean up previous stream tracks
      if (streamRef.current && streamRef.current !== stream) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      if (!isActive) {
        // Just pre-checking permissions in instructions phase: release all tracks immediately
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      } else {
        if (!holdVideo) {
          // Release video track immediately so local Python proctoring engine can access webcam index 0 exclusively
          stream.getVideoTracks().forEach(track => track.stop());

          // Create an audio-only stream for hardware continuity monitoring
          const audioTracks = stream.getAudioTracks();
          const audioStream = new MediaStream(audioTracks);
          streamRef.current = audioStream;

          audioTracks.forEach(track => {
            track.onended = () => {
              setIsHardwareLost(true);
              setHasPermissions(false);
            };
          });
        } else {
          streamRef.current = stream;
          stream.getTracks().forEach(track => {
            track.onended = () => {
              setIsHardwareLost(true);
              setHasPermissions(false);
            };
          });
        }
      }

      setHasPermissions(true);
      setIsHardwareLost(false);
      setHardwareError('');
      return true;
    } catch (err) {
      setHasPermissions(false);
      setIsHardwareLost(true);
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        setHardwareError('Permission denied. Please allow camera and microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setHardwareError('No camera or microphone found. Please connect your devices.');
      } else {
        setHardwareError('Could not access camera or microphone. Please check your devices.');
      }
      return false;
    }
  }, [isActive, holdVideo]);

  // Auto-check permissions and device connection on mount or when isActive turns true
  useEffect(() => {
    let isMounted = true;

    const probe = async () => {
      // First check if permissions already granted or devices connected
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCam = devices.some(d => d.kind === 'videoinput');
          const hasMic = devices.some(d => d.kind === 'audioinput');

          if (!hasCam || !hasMic) {
            if (isMounted) {
              setHardwareError(!hasCam ? 'No camera connected.' : 'No microphone connected.');
              setHasPermissions(false);
            }
            return;
          }

          // If browser has permissions query API
          if (navigator.permissions?.query) {
            try {
              const camStatus = await navigator.permissions.query({ name: 'camera' });
              const micStatus = await navigator.permissions.query({ name: 'microphone' });
              if (camStatus.state === 'granted' && micStatus.state === 'granted' && isMounted) {
                setHasPermissions(true);
                setHardwareError('');
                setIsHardwareLost(false);
                if (isActive && !streamRef.current) {
                  requestPermissions();
                }
                return;
              }
            } catch (_) {}
          }
        } catch (e) {
          console.warn('Initial device check error', e);
        }
      }

      if (isActive && !streamRef.current) {
        requestPermissions();
      }
    };

    probe();

    return () => {
      isMounted = false;
    };
  }, [isActive, requestPermissions]);

  // Periodic health check for active stream tracks
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        if (tracks.length > 0) {
          const allActive = tracks.every(track => track.readyState === 'live');
          if (!allActive && !isHardwareLost) {
            setIsHardwareLost(true);
            setHasPermissions(false);
          }
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isActive, isHardwareLost]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    hasPermissions,
    hardwareError,
    isHardwareLost,
    requestPermissions,
    stream: streamRef.current
  };
};

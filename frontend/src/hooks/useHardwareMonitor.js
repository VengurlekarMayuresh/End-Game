import { useState, useEffect, useRef, useCallback } from 'react';

export const useHardwareMonitor = (isActive = false) => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [hardwareError, setHardwareError] = useState('');
  const [isHardwareLost, setIsHardwareLost] = useState(false);
  const streamRef = useRef(null);

  const requestPermissions = useCallback(async () => {
    try {
      setHardwareError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Stop tracks immediately if not actually active, this is just a pre-check
      if (!isActive) {
        stream.getTracks().forEach(track => track.stop());
      } else {
        streamRef.current = stream;
        
        // Listen for stream end (e.g. user revoked permissions or unplugged device)
        stream.getTracks().forEach(track => {
          track.onended = () => {
            setIsHardwareLost(true);
            setHasPermissions(false);
          };
        });
      }
      
      setHasPermissions(true);
      setIsHardwareLost(false);
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
  }, [isActive]);

  // If isActive becomes true, make sure we have a stream. 
  // If it becomes false, clean up.
  useEffect(() => {
    if (isActive) {
      if (!streamRef.current) {
        requestPermissions();
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isActive, requestPermissions]);

  // Periodic health check just in case the onended event doesn't fire for some hardware disconnects
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        const allActive = tracks.every(track => track.readyState === 'live');
        if (!allActive && !isHardwareLost) {
          setIsHardwareLost(true);
          setHasPermissions(false);
        }
      }
    }, 2000);
    
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

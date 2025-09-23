import { useRef, useCallback } from 'react';

export const useAudioAlert = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency: number = 800, duration: number = 200, volume: number = 0.3) => {
    try {
      const audioContext = initAudioContext();
      
      // Створюємо осцилятор для звуку
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Налаштовуємо звук
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Налаштовуємо гучність з плавним затуханням
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      // Відтворюємо звук
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
    } catch (error) {
      console.warn('Не вдалося відтворити звуковий сигнал:', error);
    }
  }, [initAudioContext]);

  const playAlertBeep = useCallback(() => {
    // Серія коротких сигналів для алерту
    playBeep(1000, 150, 0.4); // Високий тон
    setTimeout(() => playBeep(800, 150, 0.4), 200); // Середній тон
    setTimeout(() => playBeep(600, 200, 0.4), 400); // Низький тон
  }, [playBeep]);

  const playDisconnectBeep = useCallback(() => {
    // Довгий низький сигнал для відключення
    playBeep(400, 500, 0.5);
  }, [playBeep]);

  const playConnectBeep = useCallback(() => {
    // Короткий високий сигнал для підключення
    playBeep(1200, 100, 0.3);
  }, [playBeep]);

  return {
    playBeep,
    playAlertBeep,
    playDisconnectBeep,
    playConnectBeep
  };
};

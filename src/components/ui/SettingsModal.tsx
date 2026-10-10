import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../../store/useAudioStore';

export function SettingsModal() {
  const isSettingsOpen = useAudioStore((state) => state.isSettingsOpen);
  const setSettingsOpen = useAudioStore((state) => state.setSettingsOpen);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSettingsOpen) {
      setSettingsOpen(false);
      navigate('/settings');
    }
  }, [isSettingsOpen, navigate, setSettingsOpen]);

  return null;
}
export default SettingsModal;

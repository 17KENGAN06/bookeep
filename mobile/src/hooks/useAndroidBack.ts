import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from './useNavigation';

export function useAndroidBack() {
  const { authOpen, closeAuth, detailBook, closeBook, infoPage, closeInfo, readerBook, closeReader, tab, setTab } =
    useNavigation();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (readerBook) {
        closeReader();
        return true;
      }
      if (authOpen) {
        closeAuth();
        return true;
      }
      if (detailBook) {
        closeBook();
        return true;
      }
      if (infoPage) {
        closeInfo();
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [authOpen, closeAuth, closeBook, closeInfo, closeReader, detailBook, infoPage, readerBook, setTab, tab]);
}

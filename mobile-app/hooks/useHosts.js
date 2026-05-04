import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

export const useHosts = () => {
  const [recentHosts, setRecentHosts] = useState([]);

  const loadHosts = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_HOSTS);
      if (data) {
        const hosts = JSON.parse(data);
        setRecentHosts(hosts.sort((a, b) => b.lastUsed - a.lastUsed));
      }
    } catch (e) {
      console.error('Error loading hosts:', e);
    }
  };

  const persist = async (hosts) => {
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_HOSTS, JSON.stringify(hosts));
  };

  const addHost = async ({ name, ip, token = '' }) => {
    const existing = recentHosts.find(h => h.ip === ip);
    let updated;
    if (existing) {
      updated = recentHosts.map(h => h.ip === ip ? { ...h, name, token, lastUsed: Date.now() } : h);
    } else {
      updated = [{ name, ip, token, lastUsed: Date.now() }, ...recentHosts];
    }
    const final = updated.slice(0, 10);
    setRecentHosts(final);
    await persist(final);
  };

  const deleteHost = async (ip) => {
    const updated = recentHosts.filter(h => h.ip !== ip);
    setRecentHosts(updated);
    await persist(updated);
  };

  const editHost = async (oldIp, newData) => {
    const filtered = recentHosts.filter(h => h.ip !== oldIp);
    const final = [{ ...newData, lastUsed: Date.now() }, ...filtered].slice(0, 10);
    setRecentHosts(final);
    await persist(final);
  };

  useEffect(() => {
    loadHosts();
  }, []);

  return { recentHosts, addHost, deleteHost, editHost, loadHosts };
};

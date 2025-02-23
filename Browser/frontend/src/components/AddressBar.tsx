import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/components/AddressBar.module.scss';

interface AddressBarProps {
  initialUrl?: string;
  onNavigate: (url: string) => void;
}

export const AddressBar: React.FC<AddressBarProps> = ({ initialUrl = '', onNavigate }) => {
  const [url, setUrl] = useState(initialUrl);
  const navigate = useNavigate();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.')) {
        processedUrl = `https://${url}`;
      } else {
        processedUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }
    
    onNavigate(processedUrl);
  }, [url, onNavigate]);

  const handleRefresh = useCallback(() => {
    onNavigate(url);
  }, [url, onNavigate]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  return (
    <div className={styles.addressBar}>
      <div className={styles.navigationButtons}>
        <button onClick={handleBack} className={styles.navButton}>
          ←
        </button>
        <button onClick={handleForward} className={styles.navButton}>
          →
        </button>
        <button onClick={handleRefresh} className={styles.navButton}>
          ↻
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URLを入力するか検索"
          className={styles.input}
        />
        <button type="submit" className={styles.submitButton}>
          移動
        </button>
      </form>
    </div>
  );
}; 
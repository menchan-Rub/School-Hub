import React from 'react';
import styles from '../styles/components/Tab.module.scss';

interface TabProps {
  title: string;
  isActive: boolean;
  onClose: () => void;
  onClick: () => void;
}

export const Tab: React.FC<TabProps> = ({ title, isActive, onClose, onClick }) => {
  return (
    <div
      className={`${styles.tab} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className={styles.title}>{title}</span>
      <button className={styles.closeButton} onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Tab; 
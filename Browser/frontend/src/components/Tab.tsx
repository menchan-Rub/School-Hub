import React from 'react';
import styles from '../styles/components/Tab.module.scss';

interface TabProps {
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
  onClose: () => void;
  onClick: () => void;
}

export const Tab: React.FC<TabProps> = ({
  title,
  url,
  isActive,
  favicon,
  onClose,
  onClick,
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={`${styles.tab} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      title={url}
    >
      {favicon && (
        <img src={favicon} alt="" className={styles.favicon} />
      )}
      <span className={styles.title}>{title}</span>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        title="タブを閉じる"
      >
        ×
      </button>
    </div>
  );
};

export default Tab; 
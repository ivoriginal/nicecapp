import React, { createContext, useContext, useState, useCallback } from 'react';

const InAppNotificationContext = createContext();

export const useInAppNotification = () => {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error('useInAppNotification must be used within an InAppNotificationProvider');
  }
  return context;
};

export const InAppNotificationProvider = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = useCallback((notification) => {
    // If there's already a notification showing, dismiss it first
    if (isVisible) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentNotification(notification);
        setIsVisible(true);
      }, 300);
    } else {
      setCurrentNotification(notification);
      setIsVisible(true);
    }
  }, [isVisible]);

  const hideNotification = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentNotification(null);
    }, 300);
  }, []);

  const value = {
    currentNotification,
    isVisible,
    showNotification,
    hideNotification,
  };

  return (
    <InAppNotificationContext.Provider value={value}>
      {children}
    </InAppNotificationContext.Provider>
  );
}; 
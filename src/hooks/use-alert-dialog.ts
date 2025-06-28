import { useState, useCallback } from 'react';

interface AlertOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive";
}

interface SimpleAlertOptions {
  title: string;
  description?: string;
  confirmText?: string;
}

export function useAlertDialog() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    description: '',
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  const [simpleAlertOpen, setSimpleAlertOpen] = useState(false);
  const [simpleAlertConfig, setSimpleAlertConfig] = useState<SimpleAlertOptions>({
    title: '',
    description: '',
    confirmText: 'OK'
  });

  // For confirm dialogs (with cancel option)
  const showConfirm = useCallback((options: AlertOptions) => {
    setAlertConfig(options);
    setAlertOpen(true);
  }, []);

  // For simple alerts (no cancel option)
  const showAlert = useCallback((options: SimpleAlertOptions) => {
    setSimpleAlertConfig(options);
    setSimpleAlertOpen(true);
  }, []);

  // Quick alert for simple messages
  const alert = useCallback((message: string, title = 'Alert') => {
    showAlert({ title, description: message });
  }, [showAlert]);

  // Quick confirm for yes/no questions
  const confirm = useCallback((message: string, title = 'Confirm', onConfirm?: () => void) => {
    showConfirm({
      title,
      description: message,
      onConfirm,
      confirmText: 'Yes',
      cancelText: 'No'
    });
  }, [showConfirm]);

  return {
    // State
    alertOpen,
    setAlertOpen,
    alertConfig,
    simpleAlertOpen,
    setSimpleAlertOpen,
    simpleAlertConfig,
    
    // Methods
    showConfirm,
    showAlert,
    alert,
    confirm
  };
} 
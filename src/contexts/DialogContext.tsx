import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from './LanguageContext';

type DialogType = 'alert' | 'confirm';

interface DialogContextType {
    showDialog: (type: DialogType, message: string, onConfirm?: () => void) => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error("useDialog must be used within DialogProvider");
    return ctx;
};

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<DialogType>('alert');
    const [message, setMessage] = useState("");
    const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

    const showDialog = useCallback((type: DialogType, message: string, onConfirm?: () => void) => {
        setType(type);
        setMessage(message);
        setOnConfirm(() => onConfirm || null);
        setIsOpen(true);
    }, []);

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        setIsOpen(false);
    };

    return (
        <DialogContext.Provider value={{ showDialog }}>
            {children}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[100] p-4" style={{ animation: 'dialogFadeIn 0.18s ease-out forwards' }}>
                    <style>{`
                        @keyframes dialogFadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes dialogSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                    `}</style>
                    <div className="w-full max-w-lg">
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform transition-all" style={{ animation: 'dialogSlideUp 0.22s ease-out forwards' }}>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {type === 'confirm' ? t('dialog.confirm_title') : t('dialog.alert_title')}
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed text-sm">{message}</p>
                            <div className="flex gap-3">
                                {type === 'confirm' && (
                                    <button 
                                        onClick={() => setIsOpen(false)} 
                                        className="flex-1 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                                    >
                                        {t('btn.cancel')}
                                    </button>
                                )}
                                <button 
                                    onClick={handleConfirm} 
                                    className="flex-1 py-3 bg-[#f6c4d7] text-white font-bold rounded-xl hover:bg-[#f3b4cb] transition"
                                >
                                    {t('btn.ok')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DialogContext.Provider>
    );
};

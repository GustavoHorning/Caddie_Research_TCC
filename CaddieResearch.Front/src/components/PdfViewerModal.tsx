import React, { useEffect } from 'react';
import './PdfViewerModal.css';

interface PdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    titulo: string;
}

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, titulo }: PdfViewerModalProps) {

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="pdf-overlay" onClick={onClose}>
            <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>

                <div className="pdf-header">
                    <div className="pdf-title-container">
                        <span className="pdf-icon">📄</span>
                        <h3 className="pdf-title">{titulo}</h3>
                    </div>

                    <div className="pdf-actions">
                        <a
                            href={pdfUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="btn-download"
                            title="Baixar Arquivo PDF"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Baixar PDF</span>
                        </a>

                        <button className="btn-close-pdf" onClick={onClose} title="Fechar Sala de Leitura (ESC)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="pdf-body">
                    <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0`}
                        title={titulo}
                        className="pdf-iframe"
                    />
                </div>

            </div>
        </div>
    );
}
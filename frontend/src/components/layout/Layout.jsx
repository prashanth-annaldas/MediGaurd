import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Toast from '../ui/Toast'
import useStore from '../../store/useStore'

export default function Layout({ children, title }) {
    const toasts = useStore(s => s.toasts)
    const dismissToast = useStore(s => s.dismissToast)

    return (
        <div className="flex h-full animated-bg bg-grid">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Topbar title={title} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
                    <div className="animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
            {/* Toast portal */}
            <div
                className="fixed bottom-6 right-6 flex flex-col gap-3 z-50"
                style={{ maxWidth: 380 }}
            >
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
                ))}
            </div>
        </div>
    )
}

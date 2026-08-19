import { useState, useEffect } from 'react'

/**
 * PWA install prompt banner — appears 3 seconds after load on Android Chrome.
 * iPhone users: Safari → Share → Add to Home Screen.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt]         = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('install_prompt_dismissed')
    if (dismissed) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('install_prompt_dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="Install Pasal Khata app"
      style={{
        position:     'fixed',
        bottom:       '90px',
        left:         '16px',
        right:        '16px',
        background:   '#1d4ed8',
        borderRadius: '14px',
        padding:      '14px 16px',
        display:      'flex',
        alignItems:   'center',
        gap:          '12px',
        zIndex:       1000,
        boxShadow:    '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ fontSize: '28px' }}>📱</div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>
          Install Pasal Khata
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          Add to home screen for quick access
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          style={{
            background:   'rgba(255,255,255,0.2)',
            border:       'none',
            borderRadius: '8px',
            color:        '#fff',
            fontSize:     '12px',
            padding:      '6px 10px',
            cursor:       'pointer',
          }}
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          aria-label="Install app"
          style={{
            background:   '#fff',
            border:       'none',
            borderRadius: '8px',
            color:        '#1d4ed8',
            fontSize:     '12px',
            fontWeight:   '600',
            padding:      '6px 12px',
            cursor:       'pointer',
          }}
        >
          Install
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt

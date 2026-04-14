'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import {
  portalLogin, getPortalSubscriptions,
  uploadPortalPhoto, getPortalPhotoUrl,
  PortalClient, PortalAbonnement
} from '@/services/portal.service'
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase'
import { registerFcmToken } from '@/services/portal.service'
import {
  saveCredentials, loadCredentials, clearCredentials,
  saveClientData, loadClientData, clearClientData,
  saveGymConfig, loadGymConfig
} from '@/lib/idb'
import { getConfigSalle, getLogoUrl, ConfigSalle } from '@/services/configSalle.service'
import { Home, QrCode as QrCodeIcon, Bell, X, AlertTriangle } from 'lucide-react'

// --- Lib / Utils ---

function joursRestants(dateFin: string | undefined): number {
  if (!dateFin) return 0
  const fin = new Date(dateFin)
  const now = new Date()
  return Math.max(0, Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

function progressPct(debut: string | undefined, fin: string | undefined): number {
  if (!debut || !fin) return 0
  const d = new Date(debut).getTime()
  const f = new Date(fin).getTime()
  const n = Date.now()
  if (f <= d) return 100
  return Math.min(100, Math.max(0, Math.round(((n - d) / (f - d)) * 100)))
}

function formatDate(s?: string) {
  if (!s) return '——/——/————'
  try { return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) } catch { return s }
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

// ============================================================================
// LOGIN SCREEN
// ============================================================================
function LoginScreen({ onLogin, prefillId, prefillCard, salle }: {
  onLogin: (c: PortalClient, card: string) => void
  prefillId?: string
  prefillCard?: string
  salle: ConfigSalle | null
}) {
  const [id, setId] = useState(prefillId ?? '')
  const [card, setCard] = useState(prefillCard ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (prefillId && prefillCard) {
      handleLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin() {
    if (!id || !card) { setError('Remplissez tous les champs'); return }
    setLoading(true); setError('')
    try {
      const client = await portalLogin(Number(id), card)
      onLogin(client, card)
    } catch (e: any) {
      setError(e.message ?? 'Identifiants incorrects')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-[#FF6B35] px-5 pt-12 pb-8 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {salle?.hasLogo ? (
              <img src={getLogoUrl()} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-white">💪</span>
            )}
          </div>
          <div>
            <p className="font-bold text-base leading-tight text-white mb-0.5">
              {salle?.nom ?? 'TerangaGym'}
            </p>
            <p className="text-[10px] text-orange-100 uppercase tracking-wider">Espace Membre</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pt-10">
        {loading && prefillId ? (
          <div className="flex flex-col items-center gap-4 mt-20">
            <div className="h-10 w-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin shadow-md" />
            <p className="text-sm text-slate-400 font-bold tracking-wide">Connexion automatique…</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-[26px] font-black text-slate-900 mb-1 leading-tight">Connexion</h1>
            <p className="text-[13px] text-slate-400 mb-8 font-semibold">Entrez votre numéro de membre et numéro de carte</p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-[6px] block">Numéro de membre (ID)</label>
                <input
                  type="number"
                  value={id}
                  onChange={e => setId(e.target.value)}
                  placeholder="ex: 42"
                  className="w-full h-[52px] rounded-2xl border-[1.5px] border-slate-200 px-4 text-[15px] font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10 bg-white shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-[6px] block">Numéro de carte</label>
                <input
                  type="text"
                  value={card}
                  onChange={e => setCard(e.target.value)}
                  placeholder="ex: TG-1-2026"
                  className="w-full h-[52px] rounded-2xl border-[1.5px] border-slate-200 px-4 text-[15px] font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10 bg-white shadow-sm transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-[12px] font-bold bg-[#FEF2F2] rounded-[14px] px-4 py-3 border border-red-100 animate-in fade-in">
                  <AlertTriangle className="h-[18px] w-[18px] shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-[54px] rounded-2xl bg-[#FF6B35] tracking-[0.02em] text-white font-black text-[15px] active:bg-[#D4521D] disabled:opacity-60 mt-4 shadow-[0_8px_24px_rgba(255,107,53,0.3)] transition-all active:scale-[0.98]"
              >
                {loading ? 'Connexion…' : 'Accéder à mon espace'}
              </button>
            </div>

            <p className="text-center text-[11.5px] text-slate-400 mt-10 font-semibold leading-relaxed">
              Votre numéro de carte vous a été remis à l'inscription.<br />
              Contactez la salle si vous l'avez perdu.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD
// ============================================================================
function Dashboard({ client, subscriptions, onLogout, photoUrl, onPhotoUpload, isUploading, salle }: any) {
  const [showQrModal, setShowQrModal] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'qr' | 'alert'>('home')

  const deferredPrompt = useRef<any>(null)
  const router = useRouter()

  const [fcmEnabled, setFcmEnabled] = useState(false)
  const [fcmLoading, setFcmLoading] = useState(false)

  const activeSub = client?.responseDto || subscriptions?.find((s: any) => s.isActif) || subscriptions?.[0] || null
  const daysRem = joursRestants(activeSub?.dateFin)
  const prog = progressPct(activeSub?.dateDebut, activeSub?.dateFin)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const handleInstallPrompt = (e: any) => {
      e.preventDefault()
      deferredPrompt.current = e
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setFcmEnabled(Notification.permission === 'granted')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  const installApp = () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt()
      deferredPrompt.current.userChoice.then(() => {
        deferredPrompt.current = null
        setShowInstallBanner(false)
      })
    }
  }

  async function handleEnablePush() {
    if (!('Notification' in window)) {
      alert("Votre navigateur ne supporte pas les notifications push.")
      return
    }
    setFcmLoading(true)
    try {
      const token = await requestFcmToken()
      if (token && client?.id) {
         await registerFcmToken(client.id, token)
         setFcmEnabled(true)
         alert("Notifications activées avec succès ! 🎉")
      } else {
         alert("La permission a été refusée ou bloquée.")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'activation des notifications.")
    } finally {
      setFcmLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] relative overflow-x-hidden font-sans pb-[80px] selection:bg-orange-100">

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[#F1F5F9] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[36px] h-[36px] bg-[#FF6B35] rounded-[10px] flex items-center justify-center text-[18px] shadow-sm">

          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-[#0F172A] tracking-tight leading-tight">{salle?.nom || 'TerangaGym'}</span>
            <span className="text-[9px] font-bold text-[#FF6B35] uppercase tracking-[0.08em] leading-tight">Espace Membre</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <label htmlFor="photoFileInput" className="w-[34px] h-[34px] rounded-full border-2 border-[#FF6B35] overflow-hidden cursor-pointer bg-[#F1F5F9] flex items-center justify-center text-[11px] font-bold text-[#64748B] shrink-0 z-10 transition-transform active:scale-95" title="Changer la photo">
            {photoUrl ? (
              <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(client?.nom)}</span>
            )}
          </label>
          <button onClick={onLogout} className="w-[34px] h-[34px] border-none bg-[#F8FAFC] rounded-full cursor-pointer flex items-center justify-center text-[16px] transition-colors shrink-0 active:bg-[#FEE2E2] z-10" title="Déconnexion">
            🚪
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[430px] mx-auto px-4 py-5 flex flex-col gap-4">

        {activeTab === 'home' && (
          <>
            {/* WELCOME */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-[22px] font-black text-[#0F172A] m-0 leading-tight">Salut, {client?.nom} 👋</h2>
              <p className="text-[13px] text-[#94A3B8] mt-1 font-semibold">Bon entraînement aujourd'hui !</p>
            </div>

        {/* OFFLINE */}
        {isOffline && (
          <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-[12px] px-4 py-2.5 flex items-center gap-2 text-[12px] font-bold text-[#C2410C] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[16px]">📡</span>
            <span>Mode hors ligne — données en cache</span>
          </div>
        )}

        {/* MEMBERSHIP CARD */}
        <div
          onClick={() => setShowQrModal(true)}
          className="bg-gradient-to-br from-[#FF6B35] to-[#D4521D] rounded-[24px] p-[22px] pb-[14px] cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4 shadow-[0_12px_32px_rgba(255,107,53,0.28)] transition-transform active:scale-[0.97] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75"
        >
          <div className="absolute -top-[50px] -right-[50px] w-[160px] h-[160px] bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-[40px] -left-[30px] w-[130px] h-[130px] bg-black/10 rounded-full pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.1em] mb-1">Membre Officiel</p>
              <p className="text-[18px] font-black text-white capitalize m-0">{client?.nom}</p>
            </div>
            <div className="w-[52px] h-[52px] bg-white/20 backdrop-blur-md rounded-[14px] border border-white/25 overflow-hidden flex items-center justify-center shrink-0">
              {client?.cardNumber ? (
                <div className="w-full h-full bg-white flex items-center justify-center p-1.5 opacity-90">
                  <QRCode value={client.cardNumber} size={40} style={{ width: "100%", height: "100%" }} />
                </div>
              ) : (
                <span className="text-[10px] font-bold text-white/70">QR</span>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-1">
            <div className="flex justify-between gap-3 items-end">
              <div>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.1em] mb-1">Téléphone</p>
                <p className="text-[13px] font-bold text-white m-0 tracking-[0.02em]">{client?.telephone || '——'}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.1em] mb-1">Adresse</p>
                <p className="text-[11px] font-semibold text-white/85 m-0 max-w-[140px] truncate">{client?.adresse || client?.address || '——'}</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[9px] font-bold text-white/50 uppercase tracking-[0.08em] mt-1 animate-pulse">Toucher pour afficher le QR</p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 relative z-10">
          <div className="bg-white rounded-[16px] p-[14px_8px] flex flex-col items-center gap-1 shadow-sm border border-[#F1F5F9]">
            <span className="text-[20px] font-black text-[#FF6B35] leading-none">{daysRem}</span>
            <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-[0.06em] text-center mt-[2px]">Jours Restants</span>
          </div>
          <div className="bg-white rounded-[16px] p-[14px_8px] flex flex-col items-center gap-1 shadow-sm border border-[#F1F5F9]">
            <span className="text-[20px] font-black text-[#3B82F6] leading-none">{client?.creditSeance ?? '--'}</span>
            <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-[0.06em] text-center mt-[2px]">Séances</span>
          </div>
          <div className="bg-white rounded-[16px] p-[14px_8px] flex flex-col items-center gap-1 shadow-sm border border-[#F1F5F9]">
            <span className="text-[12px] font-black text-[#22C55E] mt-[4px] mb-[4px] leading-none">{client?.statut || 'Actif'}</span>
            <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-[0.06em] text-center mt-[2px]">Statut</span>
          </div>
        </div>

        {/* SUB CARD */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-[#F1F5F9] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <div className="flex justify-between items-center mb-[14px]">
            <div className="flex items-center gap-2">
              <div className="w-[30px] h-[30px] bg-[#EFF6FF] rounded-[10px] flex items-center justify-center text-[14px]">
                🔋
              </div>
              <h3 className="text-[13px] font-black text-[#0F172A] m-0">Abonnement Actuel</h3>
            </div>
            <span className="text-[12px] font-bold text-[#94A3B8]">{prog}%</span>
          </div>

          <div className="h-[10px] bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF9B6A] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,107,53,0.25)]"
              style={{ width: `${prog}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.05em] mb-[14px]">
            <span>{formatDate(activeSub?.dateDebut)}</span>
            <span className="text-[#FF6B35]">{formatDate(activeSub?.dateFin)}</span>
          </div>

          <div className="bg-[#F8FAFC] rounded-[14px] p-[14px] flex justify-between items-center border border-[#F1F5F9]">
            <div>
              <p className="text-[8.5px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] m-0 mb-[3px]">Pack</p>
              <p className="text-[13px] font-black text-[#0F172A] m-0">{activeSub?.produit?.libelle || 'Aucun'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8.5px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] m-0 mb-[3px]">Tarif</p>
              <p className="text-[13px] font-black text-[#0F172A] m-0">{(activeSub?.produit?.prix ?? activeSub?.produit?.prixUnitaire)?.toLocaleString('fr-FR') || '0'} CFA</p>
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 mb-6">
          <h3 className="text-[13px] font-black text-[#0F172A] m-0 mb-3 ml-1 flex items-center gap-1.5">
            <span className="text-base">🏁</span> Historique
          </h3>
          <div className="flex flex-col gap-2">
            {subscriptions?.map((abo: any, i: number) => (
              <div
                key={abo.id || i}
                className="bg-white rounded-[16px] p-[14px_16px] flex items-center justify-between shadow-sm border border-[#F1F5F9] animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${400 + i * 70}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[#0F172A] m-0 mb-[3px] truncate">{abo.produit?.libelle || 'Abonnement'}</p>
                  <p className="text-[10px] text-[#94A3B8] font-medium m-0">{formatDate(abo.dateDebut)} — {formatDate(abo.dateFin)}</p>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.08em] px-[10px] py-[4px] rounded-full ml-[10px] shrink-0 ${abo.isActif ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                  {abo.isActif ? 'Actif' : 'Terminé'}
                </span>
              </div>
            ))}
            {(!subscriptions || subscriptions.length === 0) && (
              <div className="text-center p-8 bg-white rounded-[16px] border-2 border-dashed border-[#F1F5F9] text-[#94A3B8] text-[12px] font-bold">
                Aucun historique disponible
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {activeTab === 'alert' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white rounded-[24px] p-6 shadow-sm border border-[#F1F5F9] flex flex-col items-center gap-4 text-center mt-4">
            <div className="w-[64px] h-[64px] bg-[#EFF6FF] rounded-full flex items-center justify-center text-[28px] mb-2">
               🔔
            </div>
            <h3 className="text-[18px] font-black text-[#0F172A] m-0">Alertes & Rappels</h3>
            <p className="text-[13px] text-[#94A3B8] font-medium leading-relaxed m-0">
               Activez les notifications pour recevoir des rappels avant vos séances et être informé des nouvelles de la salle.
            </p>
            {fcmEnabled ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                <span className="text-[#16A34A] text-[13px] font-black uppercase tracking-[0.1em] bg-[#F0FDF4] px-4 py-2 rounded-full border border-[#bbf7d0]">Activé</span>
                <p className="text-[11px] text-[#94A3B8] font-semibold mt-1">Vous recevez déjà nos alertes.</p>
              </div>
            ) : (
              <button 
                onClick={handleEnablePush}
                disabled={fcmLoading}
                className="mt-4 w-full h-[52px] rounded-[16px] bg-[#FF6B35] tracking-[0.02em] text-white font-black text-[14px] active:bg-[#D4521D] disabled:opacity-60 shadow-[0_8px_24px_rgba(255,107,53,0.3)] transition-all active:scale-[0.98] flex items-center justify-center"
              >
                {fcmLoading ? 'Activation...' : 'Activer les notifications'}
              </button>
            )}
            <p className="text-[10px] text-[#CBD5E1] mt-6">
              Vous pouvez révoquer cet accès depuis les paramètres de votre appareil ou navigateur.
            </p>
          </div>
        )}

      </main>

      {/* INSTALL BANNER */}
      {showInstallBanner && (
        <div className="fixed bottom-[72px] left-3 right-3 bg-white rounded-[18px] p-[14px_16px] flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-[#F1F5F9] z-[55] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="text-[26px] shrink-0 leading-none">📲</div>
          <div className="flex-1 flex flex-col gap-px">
            <strong className="text-[13px] font-black text-[#0F172A] leading-tight">Installer l'application</strong>
            <span className="text-[10.5px] text-[#94A3B8] font-semibold leading-tight mt-0.5">Accès rapide depuis votre écran d'accueil</span>
          </div>
          <button onClick={installApp} className="bg-[#FF6B35] text-white border-none rounded-[10px] px-[14px] py-[8px] text-[12px] font-black cursor-pointer shrink-0 active:bg-[#D4521D] transition-colors">
            Installer
          </button>
          <button onClick={() => setShowInstallBanner(false)} className="bg-transparent border-none text-[16px] text-[#94A3B8] cursor-pointer p-1 shrink-0 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#F1F5F9] pt-[10px] pb-[calc(10px+env(safe-area-inset-bottom))] flex justify-around items-center z-50">
        <div onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-[3px] cursor-pointer px-5 py-1.5 rounded-[14px] transition-transform active:scale-90 relative ${activeTab === 'home' ? '' : 'filter-none opacity-100'}`}>
          <Home size={22} className={activeTab === 'home' ? 'text-[#FF6B35]' : 'text-[#94A3B8] opacity-50 grayscale'} />
          <span className={`text-[8.5px] font-black uppercase tracking-[0.07em] ${activeTab === 'home' ? 'text-[#FF6B35]' : 'text-[#CBD5E1]'}`}>Accueil</span>
        </div>
        <div onClick={() => setShowQrModal(true)} className="flex flex-col items-center gap-[3px] cursor-pointer px-5 py-1.5 rounded-[14px] transition-transform active:scale-90 relative">
          <QrCodeIcon size={22} className="text-[#94A3B8] opacity-50 grayscale" />
          <span className="text-[8.5px] font-black uppercase tracking-[0.07em] text-[#CBD5E1]">QR Code</span>
        </div>
        <div onClick={() => setActiveTab('alert')} className={`flex flex-col items-center gap-[3px] cursor-pointer px-5 py-1.5 rounded-[14px] transition-transform active:scale-90 relative ${activeTab === 'alert' ? '' : 'filter-none opacity-100'}`}>
          <Bell size={22} className={activeTab === 'alert' ? 'text-[#FF6B35]' : 'text-[#94A3B8] opacity-50 grayscale'} />
          <span className={`text-[8.5px] font-black uppercase tracking-[0.07em] ${activeTab === 'alert' ? 'text-[#FF6B35]' : 'text-[#CBD5E1]'}`}>Alerte</span>
          {/* Notification dot (if enabled) */}
          <div className="absolute top-[4px] right-[14px] w-[7px] h-[7px] bg-[#FF6B35] rounded-full border-2 border-white"></div>
        </div>
      </nav>

      {/* QR MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowQrModal(false)}>
          <div className="w-full max-w-[320px] flex flex-col items-center gap-[12px] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowQrModal(false)} className="absolute -top-[20px] right-[0px] md:-right-[20px] w-[44px] h-[44px] bg-[#F1F5F9] rounded-full flex items-center justify-center text-slate-500 active:bg-[#FCE7F3] transition-colors shadow-none border-none cursor-pointer">
              <X size={18} className="font-bold" />
            </button>
            <p className="text-[10px] font-black text-[#FF6B35] uppercase tracking-[0.15em] m-0">Accès TerangaGym</p>
            <h3 className="text-[24px] font-black text-[#0F172A] m-0 text-center capitalize">{client?.nom}</h3>
            <p className="font-mono text-[13px] text-[#94A3B8] tracking-[0.15em] m-0">{client?.cardNumber}</p>

            <div className="bg-white p-[16px] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] border-[6px] border-[#F8FAFC] mt-1 w-[220px] h-[220px] flex items-center justify-center box-content">
              {client?.cardNumber && (
                <QRCode value={client.cardNumber} size={220} style={{ width: "100%", height: "100%" }} />
              )}
            </div>

            <p className="text-[11px] text-[#94A3B8] text-center m-0 max-w-[240px] leading-[1.5] font-semibold mt-1">Présentez ce code devant le scanner de la borne d'accueil pour entrer.</p>

            <div className="flex items-center gap-[8px] bg-[#FFF7F5] px-[20px] py-[10px] rounded-full border border-[#FFE0D4] mt-3">
              <span className="w-[7px] h-[7px] bg-[#FF6B35] rounded-full animate-pulse"></span>
              <span className="text-[9.5px] font-black uppercase tracking-[0.1em] text-[#C2410C]">Lien Personnel Sécurisé</span>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD OVERLAY */}
      {isUploading && (
        <div className="fixed inset-0 z-[110] bg-white/92 backdrop-blur-[8px] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
          <div className="w-[52px] h-[52px] border-[3px] border-[#FFE0D4] border-t-[#FF6B35] rounded-full animate-spin"></div>
          <p className="text-[12px] font-black text-[#0F172A] uppercase tracking-[0.1em] m-0">Synchronisation...</p>
        </div>
      )}

      {/* HIDDEN INPUT */}
      <input
        type="file"
        id="photoFileInput"
        onChange={onPhotoUpload}
        accept="image/*"
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', zIndex: -1 }}
      />
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
function PortalPageContent() {
  const searchParams = useSearchParams()
  const pId = searchParams.get('id') ?? undefined
  const pCard = searchParams.get('cardNumber') || searchParams.get('card') ?? undefined

  const [client, setClient] = useState<PortalClient | null>(null)
  const [abonnements, setAbonnements] = useState<PortalAbonnement[]>([])
  const [loading, setLoading] = useState(true)
  const [salle, setSalle] = useState<ConfigSalle | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | ''>('')

  useEffect(() => {
    loadGymConfig().then(c => {
      if (c) setSalle(c)
      else getConfigSalle().then(remote => { setSalle(remote); saveGymConfig({ id: 'gym', nom: remote.nom, hasLogo: remote.hasLogo }) })
    })

    async function initUser() {
      const urlId = pId ? parseInt(pId, 10) : null
      
      if (urlId && !isNaN(urlId) && pCard) {
        saveCredentials({ clientId: urlId, cardNumber: pCard })
        await loadOfflineThenFetch(urlId, pCard)
        // Clean URL
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.delete('id')
        currentUrl.searchParams.delete('card')
        currentUrl.searchParams.delete('cardNumber')
        window.history.replaceState({}, '', currentUrl.toString())
      } else {
        const creds = await loadCredentials()
        if (creds?.clientId && creds?.cardNumber) {
          await loadOfflineThenFetch(creds.clientId, creds.cardNumber)
        } else {
          setLoading(false)
        }
      }
    }
    
    initUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadOfflineThenFetch(id: number, card: string) {
    try {
      const cachedAll: any = await loadClientData(id)
      if (cachedAll) {
        setClient(cachedAll.client)
        setAbonnements(cachedAll.abonnements)
        if (cachedAll.client?.photo) {
          setPhotoUrl(getPortalPhotoUrl(id) + "?t=" + Date.now())
        }
      }
      await loadData(id, card)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  async function loadData(id: number, card: string) {
    try {
      const c = await portalLogin(id, card)
      setClient(c)

      const subs = await getPortalSubscriptions(id)
      setAbonnements(subs)

      await saveClientData({
        id: id,
        client: c,
        abonnements: subs,
        cachedAt: Date.now()
      })

      if (c.photo) {
        setPhotoUrl(getPortalPhotoUrl(c.id) + "?t=" + Date.now())
      }
      setLoading(false)
    } catch (e) {
      console.warn("Mode hors ligne. Utilisation du cache.", e)
      setLoading(false)
    }
  }

  function handleLoginSuccess(c: PortalClient, card: string) {
    saveCredentials({ clientId: c.id, cardNumber: card })
    loadData(c.id, card)
  }

  function handleLogout() {
    if (client?.id) { clearClientData(client.id) }
    clearCredentials()
    setClient(null)
    setAbonnements([])
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !client?.id) return
    if (file.size > 10 * 1024 * 1024) {
      alert('La photo est trop volumineuse (max 10 MB).')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.')
      return
    }

    setIsUploading(true)
    try {
      await uploadPortalPhoto(client.id, file)
      setPhotoUrl(getPortalPhotoUrl(client.id) + '?t=' + Date.now())
      await loadData(client.id, client.cardNumber)
    } catch (err: any) {
      console.error(err)
      if (!navigator.onLine) {
        alert('Vous êtes hors ligne. Action impossible.')
      } else {
        alert("Erreur lors de l'envoi de la photo.")
      }
    } finally { setIsUploading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-[4px] border-[#FFE0D4] border-t-[#FF6B35] rounded-full animate-spin shadow-sm"></div>
        <p className="mt-[16px] text-[#94A3B8] font-bold text-[13px] tracking-wide">Chargement de votre espace...</p>
      </div>
    )
  }

  if (!client) {
    return <LoginScreen onLogin={handleLoginSuccess} prefillId={pId} prefillCard={pCard} salle={salle} />
  }

  return (
    <Dashboard
      client={client}
      subscriptions={abonnements}
      onLogout={handleLogout}
      photoUrl={photoUrl}
      onPhotoUpload={handlePhotoChange}
      isUploading={isUploading}
      salle={salle}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-[4px] border-[#FFE0D4] border-t-[#FF6B35] rounded-full animate-spin shadow-sm"></div>
        <p className="mt-[16px] text-[#94A3B8] font-bold text-[13px] tracking-wide">Lancement...</p>
      </div>
    }>
      <PortalPageContent />
    </Suspense>
  )
}
import { useState } from "react"
import { motion } from "motion/react"
import {
  Layers,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle,
  Zap,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

export function LoginOverlay() {
  const {
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    quickDevLogin,
    oauthError,
    clearOAuthError,
  } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("admin@revara.in")
  const [password, setPassword] = useState("admin123")
  const [displayName, setDisplayName] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clear errors when typing
  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (errorMessage) setErrorMessage(null)
    if (oauthError) clearOAuthError()
  }

  const handlePasswordChange = (val: string) => {
    setPassword(val)
    if (errorMessage) setErrorMessage(null)
    if (oauthError) clearOAuthError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        await register(email, password, displayName)
      } else {
        await login(email, password)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeError = errorMessage || oauthError

  return (
    <div
      data-auth-gate="login"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080C14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#080C14] to-[#080C14]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0E1524]/90 p-8 shadow-2xl backdrop-blur-2xl"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-white">REVARA</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
            OPERATIONS COMMAND CENTER
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Admin */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0B101D] border border-white/[0.08] mb-5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false)
              setErrorMessage(null)
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isSignUp
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true)
              setErrorMessage(null)
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isSignUp
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            CREATE ADMIN
          </button>
        </div>

        {/* OAuth Social Buttons */}
        <div className="space-y-2.5 mb-5">
          <Button
            type="button"
            variant="outline"
            onClick={loginWithGoogle}
            className="w-full h-10 bg-white hover:bg-slate-100 text-slate-900 border-none font-medium gap-2.5 shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={loginWithGithub}
            className="w-full h-10 bg-slate-800 hover:bg-slate-700 text-white border-white/10 font-medium gap-2.5"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className="bg-[#0E1524] px-2 text-slate-500">
              OR WITH CREDENTIALS
            </span>
          </div>
        </div>

        {/* Error Banner with Diagnostic Guidance */}
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 space-y-1.5"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold text-rose-200">Notice: </span>
                {activeError}
              </div>
            </div>
            {activeError.includes("Firebase OAuth") || activeError.includes("Domain") || activeError.includes("OAuth") ? (
              <div className="text-[11px] text-slate-300 pl-6 space-y-2 border-t border-rose-500/20 pt-2">
                <p className="text-slate-400">
                  Firebase Console allows OAuth only from authorized domains:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-300 text-[10px]">
                  <li>Open Firebase Console → Authentication → Settings</li>
                  <li>Click <strong>Authorized domains</strong> → <strong>Add domain</strong></li>
                  <li>Add <code className="text-cyan-300 font-mono">localhost</code> and your deployment domain</li>
                </ol>
                <Button
                  type="button"
                  size="sm"
                  onClick={quickDevLogin}
                  className="w-full mt-2 h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs gap-1.5 shadow"
                >
                  <Zap className="h-3 w-3" />
                  <span>Continue Directly as Super Admin (Instant Bypass)</span>
                </Button>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Display Name
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Super Admin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                required
                placeholder="admin@revara.in"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/30 gap-2 mt-2"
          >
            {isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" />
                <span>{isSubmitting ? "CREATING ACCOUNT..." : "CREATE ADMIN ACCOUNT"}</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>{isSubmitting ? "VERIFYING CREDENTIALS..." : "SIGN IN TO COMMAND CENTER"}</span>
              </>
            )}
          </Button>
        </form>

        {/* Quick Dev Login Button */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] text-center space-y-2">
          <button
            type="button"
            onClick={quickDevLogin}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Quick Super Admin Bypass (admin@revara.in)</span>
          </button>
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Info className="h-3 w-3" />
            <span>Default seeded master admin: admin123</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

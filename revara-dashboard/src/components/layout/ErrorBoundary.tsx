import React, { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard caught rendering exception:", error, errorInfo)
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public handleResetState = () => {
    try {
      localStorage.removeItem("revara_widget_layout")
    } catch {}
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-[#0E1524] p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {this.props.fallbackTitle || "Interface Render Exception"}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {this.state.error?.message || "An unexpected error occurred while rendering this view."}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleResetState}
                className="text-xs border-white/10 text-slate-300"
              >
                Reset Layout Cache
              </Button>
              <Button
                size="sm"
                onClick={this.handleReload}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload View</span>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

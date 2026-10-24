import React, { useState, useEffect } from "react"

export type Theme = "light" | "dark"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lumen_theme") as Theme | null
      if (stored === "light" || stored === "dark") return stored
      return document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
    return "dark"
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", theme)
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
    localStorage.setItem("lumen_theme", theme)
  }, [theme])

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme = theme === "dark" ? "light" : "dark"

    // View Transitions API circular reveal if supported
    const doc = document as unknown as {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>
      }
    }

    if (doc.startViewTransition && e) {
      const x = e.clientX
      const y = e.clientY
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      )

      const transition = doc.startViewTransition(() => {
        setTheme(nextTheme)
      })

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "cubic-bezier(0.65, 0, 0.35, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
        .catch(() => {
          setTheme(nextTheme)
        })
    } else {
      setTheme(nextTheme)
    }
  }

  return { theme, setTheme, toggleTheme }
}

"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "./ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 h-8 w-8 text-xs font-medium transition-all duration-200 hover:text-foreground/80 text-foreground/60 hover:bg-accent rounded-md"
      title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">切换主题</span>
    </Button>
  )
} 
import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, FileText, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold text-center">Jharkhand Civic Reporter</h1>
      </header>
      
      <main className="pb-20">{children}</main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex justify-around py-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Home className="h-6 w-6 mb-1" />
            Dashboard
          </NavLink>
          
          <NavLink
            to="/report"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Plus className="h-6 w-6 mb-1" />
            Report Issue
          </NavLink>
          
          <NavLink
            to="/my-issues"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <FileText className="h-6 w-6 mb-1" />
            My Issues
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <User className="h-6 w-6 mb-1" />
            Profile
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/hooks/use-notifications"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppDispatch } from "@/redux/useDispatch"
import { logout } from "@/redux/features/authFeature"

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps = {}) {
  const pathname = usePathname()
    const router = useRouter();
  
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [user, setUser] = useState<{name?: string; email?: string} | null>(null); // Local state for user
 const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    setUser(null); // Reset user state on logout
  };

  const getPageTitle = () => {
    const path = pathname.split("/").filter(Boolean)
    if (path.length === 0) return "Dashboard"

    // Handle special cases
    if (path[0] === "dashboard") return "Dashboard"
    if (path.length === 1) return path[0].charAt(0).toUpperCase() + path[0].slice(1)

    // Handle nested routes
    if (path.length >= 2) {
      const section = path[0].charAt(0).toUpperCase() + path[0].slice(1)
      const subsection = path[1].charAt(0).toUpperCase() + path[1].slice(1)
      return `${section} / ${subsection}`
    }

    return pathname
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center border-b bg-background px-3 sm:px-4 md:px-6">
      <div className="flex flex-1 items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          <Button variant="outline" size="icon" className="md:hidden shrink-0 h-9 w-9" onClick={() => onMenuClick?.()}>
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-base sm:text-lg md:text-xl font-semibold truncate">{getPageTitle()}</h1>
        </div>
        <div className="hidden md:flex md:w-1/3 lg:w-2/5 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full bg-background pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-md">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="text-sm sm:text-base">Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs sm:text-sm">
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-60 sm:h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs sm:text-sm text-muted-foreground">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-2 sm:p-3 ${notification.read ? "" : "bg-muted/50"}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="font-medium text-xs sm:text-sm">{notification.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{notification.message}</div>
                      <div className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src={ ""} alt={ "User"} />
                  <AvatarFallback className="text-xs sm:text-sm">{  "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base">{  "User"}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{  "user@example.com"}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="text-xs sm:text-sm">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/company-profile" className="text-xs sm:text-sm">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive text-xs sm:text-sm"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

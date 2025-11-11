"use client"
import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSetRecoilState } from "recoil"
import { userState } from "@/lib/recoil/atoms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAppDispatch } from "@/redux/useDispatch"
import { useLoginMutation } from "@/redux/Service/auth"
import { setCredentials } from "@/redux/features/authFeature"
import { Loader2, Mail, Lock, Sparkles } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const setUser = useSetRecoilState(userState)
  const dispatch = useAppDispatch()
  const [login] = useLoginMutation()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const userData = await login({ email, password }).unwrap()

      dispatch(setCredentials(userData))

      toast({
        title: "Success",
        description: "Logged in successfully",
      })

      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-1/4 h-72 w-72 animate-blob rounded-full bg-primary/10 opacity-70 blur-3xl" />
        <div className="animation-delay-2000 absolute right-1/4 top-1/3 h-72 w-72 animate-blob rounded-full bg-accent/10 opacity-70 blur-3xl" />
        <div className="animation-delay-4000 absolute bottom-1/4 left-1/3 h-72 w-72 animate-blob rounded-full bg-muted/20 opacity-70 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md animate-fade-in-up border-border/50 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-scale-in">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>

          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-base">Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2 animate-fade-in-up animation-delay-200">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="peer pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 animate-fade-in-up animation-delay-400">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="peer pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* <div className="flex justify-end animate-fade-in-up animation-delay-600">
              <button
                type="button"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div> */}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 animate-fade-in-up animation-delay-800">
            <Button
              type="submit"
              className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

           
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

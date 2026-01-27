import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils.ts";
import { useAuth } from '@/hooks/use-auth';


const Auth = () => {
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const { login, signup, isLoading } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(loginData.email, loginData.password);
        if (success) {
            toast({ title: "Login successful" });
            handleAuthSuccess();
        } else {
            toast({ title: "Error!", description: "Invalid credentials", variant: "destructive" });
        }
    };

    const handleAuthSuccess = () => {
        const redirectTo = new URLSearchParams(window.location.search).get("from") || "/";
        navigate(redirectTo, { replace: true });
    };

    return (
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side: Brand & Social Proof (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-950 p-12 flex-col justify-between overflow-hidden">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 flex items-center gap-2">
                    <div className="p-2 bg-primary rounded-lg">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tighter italic">VENTURE PULSE</span>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-medium text-white leading-tight tracking-tight">
                        The Operating System for <br />
                        <span className="text-primary italic">High-Velocity</span> Venture Studios.
                    </h2>
                    <div className="flex gap-8">
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-white">42%</p>
                            <p className="text-sm text-slate-400">Faster Analysis</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-white">2.4x</p>
                            <p className="text-sm text-slate-400">Pilot Conversion</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <p className="text-sm text-slate-300 italic">
                        "Mattar AI has transformed how we evaluate our portfolio runway. It's like having a senior analyst available 24/7."
                    </p>
                    <p className="mt-4 text-xs font-medium text-white uppercase tracking-widest">Head of Portfolio, Mattar Ventures</p>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-card">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
                        <p className="text-muted-foreground text-sm">
                            Verify your identity to access the studio dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Work Email
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                        <Mail className="text-slate-400 w-4 h-4" />
                                    </div>                                  
                                    <Input
                                        name="email"
                                        id="email"
                                        type="email"
                                        className={`h-12 pl-10 pr-10 border-slate-200 text-left`}
                                        placeholder="name@example.com"
                                        required
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Password
                                    </Label>
                                    <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="password"
                                        id="password"
                                        type="password"
                                        className="pl-10 h-12 bg-background border-border/60 transition-all focus:ring-offset-2"
                                        required
                                        placeholder="••••••••"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full h-12 text-md font-medium group relative overflow-hidden transition-all active:scale-95" type="submit" disabled={isLoading}>
                            <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
                                Secure Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="w-5 h-5 animate-pulse text-primary-foreground" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Enterprise Security</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button variant="outline" className="w-full h-11 border-border/60 hover:bg-muted font-normal text-sm gap-2">
                            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                            Sign in with Okta (SSO)
                        </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                        Protected by hardware-level encryption. <br />
                        Authorized personnel only.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
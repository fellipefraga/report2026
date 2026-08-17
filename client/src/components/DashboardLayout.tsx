import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BookOpenText, FileOutput, Files, LayoutDashboard, LogOut, PanelLeft, Presentation, Settings2 } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão geral", path: "/" },
  { icon: Files, label: "Fontes", path: "/fontes" },
  { icon: Presentation, label: "Slides", path: "/slides" },
  { icon: BookOpenText, label: "Sumário", path: "/sumario" },
  { icon: FileOutput, label: "Exportar", path: "/exportar" },
  { icon: Settings2, label: "Configurações", path: "/configuracoes" },
];

const SIDEBAR_WIDTH_KEY = "stellar-sidebar-width";
const DEFAULT_WIDTH = 274;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground font-black">S</div>
          <p className="eyebrow mb-3">Stellar Gaming</p>
          <h1 className="text-2xl font-semibold tracking-tight">Acesso editorial protegido</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Entre com sua conta Manus para verificar a autorização de membro da equipe Stellar.</p>
          <Button onClick={() => startLogin()} size="lg" className="mt-7 w-full">Entrar com Manus OAuth</Button>
        </div>
      </div>
    );
  }

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div ref={sidebarRef} className="relative">
        <Sidebar collapsible="icon" className="border-r border-border bg-[#10130f]" disableTransition={isResizing}>
          <SidebarHeader className="h-24 justify-center px-3">
            <div className="flex w-full items-center gap-3">
              <button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Alternar navegação"><PanelLeft className="h-4 w-4" /></button>
              {!isCollapsed && <div className="min-w-0"><p className="text-[10px] font-bold tracking-[0.16em] text-primary">STELLAR GAMING</p><p className="mt-1 truncate text-sm font-semibold text-foreground">Report App <span className="font-normal text-muted-foreground">/ 2026</span></p></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.14em] text-muted-foreground group-data-[collapsible=icon]:hidden">ESPAÇO EDITORIAL</p>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 rounded-lg font-medium"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-3">
            <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3 group-data-[collapsible=icon]:hidden"><p className="text-[10px] font-bold tracking-widest text-primary">RELATÓRIO SETORIAL</p><p className="mt-1 text-xs leading-5 text-muted-foreground">81 slides · inteligência editorial assistida</p></div>
            <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-data-[collapsible=icon]:justify-center"><Avatar className="h-8 w-8 border border-border"><AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{user?.name?.charAt(0).toUpperCase() || "S"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium text-foreground">{user?.name || "Equipe Stellar"}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user?.email || "Acesso editorial"}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!isCollapsed && <div className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-primary/25" onMouseDown={() => setIsResizing(true)} />}
      </div>
      <SidebarInset className="bg-background">
        {isMobile && <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg" /><span className="text-sm font-medium">{activeMenuItem?.label ?? "Stellar Report App"}</span></header>}
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}

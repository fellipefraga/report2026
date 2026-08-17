import DashboardLayout from "@/components/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import { DashboardPage, ExportPage, OutlinePage, SettingsPage, SlidesPage, SourcesPage } from "@/pages/ReportWorkspace";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function WorkspaceRoute({ children }: { children: React.ReactNode }) { return <DashboardLayout>{children}</DashboardLayout>; }
function Router() { return <Switch><Route path="/"><WorkspaceRoute><DashboardPage /></WorkspaceRoute></Route><Route path="/fontes"><WorkspaceRoute><SourcesPage /></WorkspaceRoute></Route><Route path="/slides"><WorkspaceRoute><SlidesPage /></WorkspaceRoute></Route><Route path="/sumario"><WorkspaceRoute><OutlinePage /></WorkspaceRoute></Route><Route path="/exportar"><WorkspaceRoute><ExportPage /></WorkspaceRoute></Route><Route path="/configuracoes"><WorkspaceRoute><SettingsPage /></WorkspaceRoute></Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><Toaster theme="dark" richColors /><Router /></ThemeProvider></ErrorBoundary>; }

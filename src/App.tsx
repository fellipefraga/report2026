import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Fontes from './pages/Fontes'
import Sumario from './pages/Sumario'
import Slides from './pages/Slides'
import Textos from './pages/Textos'
import Exportar from './pages/Exportar'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="fontes" element={<Fontes />} />
          <Route path="sumario" element={<Sumario />} />
          <Route path="slides" element={<Slides />} />
          <Route path="textos" element={<Textos />} />
          <Route path="exportar" element={<Exportar />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

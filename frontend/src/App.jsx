import 'leaflet/dist/leaflet.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import FullConsole from './pages/FullConsole'
import IncidentDetail from './pages/IncidentDetail'
import ExpandedMap from './pages/ExpandedMap'
import LoginScreen from './components/auth/LoginScreen'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<FullConsole />} />
            <Route path="/incident/:id" element={<IncidentDetail />} />
            <Route path="/map" element={<ExpandedMap />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

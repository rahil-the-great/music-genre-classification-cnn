import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Predict from './pages/Predict'

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/predict" element={<Predict />} />
      </Routes>
    </ThemeProvider>
  )
}

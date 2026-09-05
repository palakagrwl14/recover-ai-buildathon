import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/layout/Nav';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import Policy from './pages/Policy';
import History from './pages/History';
import About from './pages/About';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Nav />
        <main style={{ padding: '0 1rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/policy" element={<Policy />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

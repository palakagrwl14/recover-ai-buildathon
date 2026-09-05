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
      <div className="w-full min-h-screen bg-[#8B939E] p-3 md:p-6">
        <div className="ambient-dashboard-canvas w-full min-h-[calc(100vh-3rem)] shadow-2xl">
          <div className="ambient-glow-yellow" />
          <div className="ambient-glow-silver" />
          <div className="relative z-10">
            <Nav />
            <main className="w-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/policy" element={<Policy />} />
                <Route path="/history" element={<History />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

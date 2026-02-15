import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Disassembly from './pages/Disassembly';
import Processing from './pages/Processing';
import Workshop from './pages/Workshop';
import Scrap from './pages/Scrap';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/disassembly" element={<Disassembly />} />
                    <Route path="/processing" element={<Processing />} />
                    <Route path="/workshop" element={<Workshop />} />
                    <Route path="/scrap" element={<Scrap />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;

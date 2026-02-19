import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import MainPage from './pages/MainPage';
import InsertDisassembly from './pages/InsertDisassembly';
import InsertProcessing from './pages/InsertProcessing';
import ProcessingAddNew from './pages/ProcessingAddNew';
import ProcessingDetails from './pages/ProcessingDetails';
import Scrap from './pages/Scrap';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/insert-disassembly" replace />} />
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/insert-disassembly" element={<InsertDisassembly />} />
                    <Route path="/insert-processing" element={<InsertProcessing />} />
                    <Route path="/processing-add-new" element={<ProcessingAddNew />} />
                    <Route path="/processing-details/:rollerId/:lifecycleId" element={<ProcessingDetails />} />
                    <Route path="/processing" element={<InsertProcessing />} />
                    <Route path="/scrap" element={<Scrap />} />
                    <Route path="/scrap-roller" element={<Scrap />} />
                    <Route path="/scrap-axle" element={<Scrap />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;

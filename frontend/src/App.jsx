import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import UpdateAssets from './pages/UpdateAssets';
import ViewAssets from './pages/ViewAssets';
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
                    <Route path="/insert-disassembly" element={<InsertDisassembly />} />
                    <Route path="/insert-processing" element={<InsertProcessing />} />
                    <Route path="/update" element={<UpdateAssets />} />
                    <Route path="/view" element={<ViewAssets />} />
                    <Route path="/processing-add-new" element={<ProcessingAddNew />} />
                    <Route path="/processing-details/:rollerId/:lifecycleId" element={<ProcessingDetails />} />
                    <Route path="/processing" element={<InsertProcessing />} />
                    <Route path="/scrap" element={<Scrap />} />
                    <Route path="/scrap-roller" element={<Scrap />} />
                    <Route path="/scrap-axle" element={<Scrap />} />
                    {/* Placeholder for asset details until implemented */}
                    <Route path="/asset-details/:id" element={<UpdateAssets />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;

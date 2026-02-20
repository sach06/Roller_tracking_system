import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import UpdateAssets from './pages/UpdateAssets';
import ViewAssets from './pages/ViewAssets';
import InsertDisassembly from './pages/InsertDisassembly';
import InsertProcessing from './pages/InsertProcessing';
import ProcessingAddNew from './pages/ProcessingAddNew';
import ProcessingDetails from './pages/ProcessingDetails';
import ScrapRoller from './pages/ScrapRoller';
import ScrapAxle from './pages/ScrapAxle';
import WSRoller from './pages/WSRoller';
import WSRollerDetails from './pages/WSRollerDetails';
import WSAxle from './pages/WSAxle';
import WSAxleDetails from './pages/WSAxleDetails';
import './index.css';

const RoleRedirect = () => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return <Navigate to="/login" replace />;

    const user = JSON.parse(userJson);
    if (user.role_code === 'REF_OP' || user.role_code === 'REF_ADMIN') {
        return <Navigate to="/processing-add-new" replace />;
    } else if (user.role_code === 'WS_OP' || user.role_code === 'WS_ADMIN') {
        return <Navigate to="/ws-axle" replace />;
    }
    return <Navigate to="/insert-disassembly" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Layout />}>
                    <Route path="/" element={<RoleRedirect />} />
                    <Route path="/insert-disassembly" element={<InsertDisassembly />} />
                    <Route path="/insert-processing" element={<InsertProcessing />} />
                    <Route path="/update" element={<UpdateAssets />} />
                    <Route path="/view" element={<ViewAssets />} />
                    <Route path="/processing-add-new" element={<ProcessingAddNew />} />
                    <Route path="/processing-details/:rollerId/:lifecycleId" element={<ProcessingDetails />} />
                    <Route path="/processing" element={<InsertProcessing />} />
                    <Route path="/scrap-roller" element={<ScrapRoller />} />
                    <Route path="/scrap-axle" element={<ScrapAxle />} />
                    {/* Workshop Routes */}
                    <Route path="/ws-roller" element={<WSRoller />} />
                    <Route path="/ws-roller-details/:lifecycleId/:rollerId" element={<WSRollerDetails />} />
                    <Route path="/ws-axle" element={<WSAxle />} />
                    <Route path="/ws-axle-details/:lifecycleId/:axleId" element={<WSAxleDetails />} />
                    {/* Placeholder for asset details until implemented */}
                    <Route path="/asset-details/:id" element={<UpdateAssets />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;

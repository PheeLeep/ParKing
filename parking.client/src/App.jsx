import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ParkingSpace from './pages/ParkingSpace';
import Tickets from './pages/Tickets';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Users from './pages/Users';
import { AlertProvider } from './AlertProvider';
import PageTitle from './controls/PageTitle';
import { MessageBoxProvider } from './NoInteractMsgBoxProvider';
import NoInteractMsgBox from './Modals/MessageBoxes/NoInteractMsgBox';
function App() {
    return (
        <MessageBoxProvider>
            <AlertProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<PageTitle title="Welcome"><Login /></PageTitle>} />
                        <Route path="/dashboard" element={<PageTitle title="Dashboard"><Dashboard /></PageTitle>} />
                        <Route path="/parking-spaces" element={<PageTitle title="Parking Spaces"><ParkingSpace /></PageTitle>} />
                        <Route path="/tickets" element={<PageTitle title="Tickets"><Tickets /></PageTitle>} />
                        <Route path="/payments" element={<PageTitle title="Payments"><Payments /></PageTitle>} />
                        <Route path="/reports" element={<PageTitle title="Reports">< Reports /></PageTitle >} />
                        <Route path="/users" element={<PageTitle title="User Management">< Users /></PageTitle >} />
                    </Routes>
                    <NoInteractMsgBox />
                </BrowserRouter>
            </AlertProvider>
        </MessageBoxProvider>
    );
}

export default App;
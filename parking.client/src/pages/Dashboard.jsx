import { faNoteSticky, faCarAlt, faTicketSimple, faMoneyBill, faPeopleLine } from '@fortawesome/free-solid-svg-icons';
import BootstrapButton from '../controls/BootstrapButton';
import Layout from '../controls/Layout';
import DashboardCard from '../controls/DashboardCard';
import RecentActivityCard from '../controls/RecentActivityCard';
import ParkingOverviewCard from '../controls/ParkingOverviewCard';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { useMessageBox } from '../NoInteractMsgBoxProvider';
import { useAlert, AlertStatus } from '../AlertProvider';

const Dashboard = () => {
    const [slotData, setSlotData] = useState(null); 
    const [error, setError] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const { showMessageBox, closeMessageBox } = useMessageBox();
    const { showAlertMessage } = useAlert();

    const fetchSlot = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_DASHBOARD, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSlotData(data); 
                setRecentActivities(data.LatestParkActivities || []);
            } else {
                setError(data.message || 'Failed to fetch data');
                console.error('Failed to fetch slots:', data.message);
            }
        } catch (error) {
            setError('An error occurred while fetching slots');
            console.error('Error fetching slots:', error);
        }
    };

    useEffect(() => {
        fetchSlot(); 
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(value);
    };
    const cards = [
        { icon: faCarAlt, text: 'Occupied Spaces', value: `${slotData?.OccupiedSlots || 0}/${slotData?.TotalSlots || 0}` },
        { icon: faTicketSimple, text: 'Active Tickets', value: `${slotData?.ActiveTickets || 0}` },
        { icon: faMoneyBill, text: 'Daily Revenue', value: `${formatCurrency(slotData?.DailyRevenue) || 0}` },
        { icon: faPeopleLine, text: 'Current Visitors', value: `${slotData?.CurrentVisitors || 0}` },
    ];


    const generatePDF = async () => {
        try {
            showMessageBox("Generating reports. Please wait.", "OK");
            const response = await ExecuteHTTP(COMMAND_URLS.GET_REPORTS, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                const doc = new jsPDF();

                doc.setFontSize(18);
                doc.text('Park_King', 14, 20);

                doc.setFontSize(12);
                doc.text('This PDF contains activities occurred. (Date Generated: '+format(new Date(), 'yyyy/MM/dd hh:mm:ss')+')', 14, 30);

                const columns = ['Date', 'Plate No.', 'Customer', 'Description'];
                const rows = data.map(item => [
                    item.Date || '',
                    item.VehiclePlateNumber || '',
                    item.CustomerName || '',
                    item.Description || ''
                ]);

                // Generate table
                doc.autoTable({
                    head: [columns],
                    body: rows,
                    startY: 40,
                    styles: {
                        cellPadding: 4,
                        fontSize: 10,
                        halign: 'justify', // Justifies text horizontally
                    },
                    headStyles: { fillColor: [22, 160, 133] }, // Table header style
                });


                doc.save(`Generated Reports (${format(new Date(), 'yyyy-MM-dd hh-mm-ss')}).pdf`);
            } else {
                showAlertMessage("Failed to generate report. (" + data.message + ")", AlertStatus.ERROR);
                console.error('Failed to fetch data:', data.message);
            }
        } catch (error) {
            showAlertMessage("Failed to generate report. (" + error + ")", AlertStatus.ERROR);
            console.error('Error fetching data:', error);
        } finally {
            closeMessageBox();
        }
    };

    return (
        <Layout>
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h3 className="h3 mb-0 text-gray-800">Dashboard Overview</h3>
                <BootstrapButton
                    text="Generate Report"
                    icon={faNoteSticky}
                    onClick={generatePDF}
                />
            </div>
            <div className="container my-4">
                {error ? (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                ) : (
                    <div className="row g-3">
                        {cards.map((card, index) => (
                            <DashboardCard
                                key={index}
                                icon={card.icon}
                                text={card.text}
                                value={card.value}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="container py-4">
                <div className="row">
                    <RecentActivityCard activities={recentActivities} /> 
                    <ParkingOverviewCard />
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;

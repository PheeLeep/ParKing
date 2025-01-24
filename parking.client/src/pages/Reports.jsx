import Layout from '../controls/Layout';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy';
import { useEffect, useState } from 'react';
import TableControl from '../controls/TableControl';
import { useAlert, AlertStatus } from '../AlertProvider';
const Reports = () => {
    const [tickets, setTickets] = useState([]);
    const [violations, setViolation] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const { showAlertMessage } = useAlert();

    const columns1 = [
        { key: 'Date', display: 'Date' },
        { key: 'Description', display: 'Description' },
        { key: 'VehiclePlateNumber', display: 'Plate Number' },
        { key: 'CustomerName', display: 'Customer' },
    ];

    const columns2 = [
        { key: 'DateOccurred', display: 'Date' },
        { key: 'Reason', display: 'Reason' },
        { key: 'CustomerName', display: 'Customer' },
    ];

    const refreshTickets = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_REPORTS, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                setTickets(data);
            } else {
                setTickets([]);
                showAlertMessage("Failed to fetch tickets. (" + data.message + ")", AlertStatus.WARNING);
                console.error('Failed to fetch users:', data.message);
            }
        } catch (error) {
            showAlertMessage("Failed to fetch tickets. (" + error + ")", AlertStatus.ERROR);
            console.error('Error fetching users:', error);
        }
    };

    const refreshViolations = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_VIOLATIONS, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                setViolation(data);
            } else {
                setViolation([]);
                showAlertMessage("Failed to fetch violations. (" + data.message + ")", AlertStatus.WARNING);
                console.error('Failed to fetch users:', data.message);
            }
        } catch (error) {
            showAlertMessage("Failed to fetch violations. (" + error + ")", AlertStatus.ERROR);
            console.error('Error fetching users:', error);
        }
    };
    useEffect(() => {
        refreshTickets();
        refreshViolations();

        const intervalId = setInterval(() => {
            refreshTickets();
            refreshViolations();
        }, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
            <Layout>
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                    <h3 className="h3 mb-0 text-gray-800">Reports</h3>
                </div>

                {/* Tab Control */}
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                    <li className="nav-item" role="presentation">
                        <a
                            className={`nav-link ${activeTab === 0 ? 'active' : ''}`}
                            id="tab1-tab"
                            data-bs-toggle="tab"
                            href="#tab1"
                            role="tab"
                            aria-controls="tab1"
                            aria-selected={activeTab === 0}
                            onClick={() => setActiveTab(0)}
                        >
                            Reports Occurred
                        </a>
                    </li>
                    <li className="nav-item" role="presentation">
                        <a
                            className={`nav-link ${activeTab === 1 ? 'active' : ''}`}
                            id="tab2-tab"
                            data-bs-toggle="tab"
                            href="#tab2"
                            role="tab"
                            aria-controls="tab2"
                            aria-selected={activeTab === 1}
                            onClick={() => setActiveTab(1)}
                        >
                            Violations
                        </a>
                    </li>
                </ul>

                <div className="tab-content" id="myTabContent" style={{marginTop: "10px"} }>
                    <div
                        className={`tab-pane fade ${activeTab === 0 ? 'show active' : ''}`}
                        id="tab1"
                        role="tabpanel"
                        aria-labelledby="tab1-tab"
                    >
                        <TableControl
                            columns={columns1}
                            data={tickets}
                            itemsPerPage={10}
                            searchable={true}
                        />
                    </div>
                    <div
                        className={`tab-pane fade ${activeTab === 1 ? 'show active' : ''}`}
                        id="tab2"
                        role="tabpanel"
                        aria-labelledby="tab2-tab"
                    >
                        <TableControl
                            columns={columns2}
                            data={violations}
                            itemsPerPage={10}
                            searchable={true}
                        />
                    </div>
                </div>
            </Layout>
        </>
    );
}

export default Reports;
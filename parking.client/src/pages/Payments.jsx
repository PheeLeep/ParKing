import Layout from '../controls/Layout'
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy';
import { useEffect, useState } from 'react';
import TableControl from '../controls/TableControl';
import DashboardCard from '../controls/DashboardCard';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import { faCashRegister, faMoneyBill, faMoneyBillTrendUp } from '../../../node_modules/@fortawesome/free-solid-svg-icons/index';
import CheckoutModal from '../Modals/CheckoutModal';
import { useAlert, AlertStatus } from '../AlertProvider';
import { formatInTimeZone } from 'date-fns-tz';

const Payments = () => {
    const date = new Date(); // Current date
    const taipeiTimeZone = 'Asia/Taipei';

    // Adjust the date to one day before
    const adjustedDate = new Date(date.setDate(date.getDate() - 1));

    // Format the date in 'yyyy/MM/dd' for Taipei Standard Time
    const formattedDate = formatInTimeZone(adjustedDate, taipeiTimeZone, 'yyyy/MM/dd');

    const [payments, setPayments] = useState([]);
    const [slotData, setSlotData] = useState(null);
    const { showAlertMessage } = useAlert();
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const cards = [
        { icon: faMoneyBill, text: 'Daily Revenue', value: `PHP ${slotData?.dailyRevenue || 0.00}` },
        { icon: faMoneyBillTrendUp, text: `Trend (vs ${formattedDate})`, value: `${slotData?.percentage || 0}%` },
    ];

    const columns = [
        { key: 'dateOccurred', display: 'Date' },
        { key: 'customerName', display: 'Ticket' },
        { key: 'price', display: 'Price' },
        { key: 'method', display: 'Method' },
        { key: 'reference', display: 'Reference ID' },
    ];

    const refreshTickets = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_PAYMENT, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                setPayments(data);
            } else {
                setPayments([]);
                showAlertMessage(`Failed to fetch payments. ${data.message}`, AlertStatus.WARNING);
                console.error('Failed to fetch users:', data.message);
            }
        } catch (error) {
            showAlertMessage(`Failed to fetch payments. ${error}`, AlertStatus.ERROR);
            console.error('Error fetching users:', error);
        }
    };

    const fetchSlot = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_PAYMENT_TREND, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSlotData(data);
            } else {
                showAlertMessage(`Failed to fetch slots. ${data.message}`, AlertStatus.WARNING);
                console.error('Failed to fetch slots:', data.message);
            }
        } catch (error) {
            showAlertMessage(`Failed to fetch slots. ${error}`, AlertStatus.ERROR);
            console.error('Error fetching slots:', error);
        }
    };


    useEffect(() => {
        refreshTickets();
        fetchSlot();
    }, []);

    return (
        <>
            <Layout>
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                    <h3 className="h3 mb-0 text-gray-800">Payments</h3>
                    
                </div>
                <div className="d-sm-flex align-items-center justify-content-start gap-3 mb-4">
                    <BootstrapButton
                        text={"Checkout"}
                        type={ButtonType.Primary}
                        icon={faCashRegister}
                        onClick={() => {
                            setShowCheckoutModal(true);
                        } }
                    />
                </div>
                <div className="container my-4">
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
                </div>
                <TableControl
                    columns={columns}
                    data={payments}
                    itemsPerPage={10}
                    searchable={true }
                />

                <CheckoutModal
                    isModalOpen={showCheckoutModal}
                    handleCloseModal={() => {
                        setShowCheckoutModal(false);
                        refreshTickets();
                        fetchSlot();
                    } }
                />
            </Layout>

        </>
    );
}

export default Payments;
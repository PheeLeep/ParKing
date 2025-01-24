import Layout from '../controls/Layout'
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy';
import { useEffect, useState } from 'react';
import TableControl from '../controls/TableControl';
import { faExclamationTriangle, faXmarkCircle, faPrint, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import YesNoMessageBox from '../Modals/MessageBoxes/YesNoMsgBox';
import OccupySlotModal from '../Modals/OccupySlotModal';
import ViolationsModal from '../Modals/ViolationsModal';
import { useAlert, AlertStatus } from '../AlertProvider';
import { useMessageBox } from '../NoInteractMsgBoxProvider';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import CurrentUser from '../CurrentUser';

const Tickets = () => {
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViolationsModal, setShowViolationsModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [tickets, setTickets] = useState([]);
    const { showAlertMessage } = useAlert();
    const { showMessageBox, closeMessageBox } = useMessageBox();

    const columns = [
        { key: 'dateOccupied', display: 'Date' },
        { key: 'customerName', display: 'Customer Name' },
        { key: 'plateNo', display: 'Plate Number' },
        { key: 'vehicleType', display: 'Vehicle Type' },
        { key: 'isOvernight', display: 'Parking Type' },
        {
            key: 'status',
            display: 'Status',
            customRender: (value) => {
                let label = '';
                let className = '';
                let textColor = 'white';
                switch (value) {
                    case 'Paid':
                        label = 'Paid';
                        className = 'bg-success';
                       
                        break;
                    case 'Unpaid':
                        label = 'Unpaid';
                        className = 'bg-warning';
                        textColor = 'black';
                        break;
                    case 'Canceled':
                        label = 'Canceled';
                        className = 'bg-danger';
                        break;
                    default:
                        label = 'Unknown';
                        className = 'bg-secondary';
                }

                return (
                    <div
                        className={`${className} d-flex justify-content-center align-items-center rounded`}
                        style={{ color: textColor, height: '100%', width: '100%' }}
                    >
                        {label}
                    </div>
                );
            },
        },
    ];

    const actions = (row) => {
        const buttons = [];

        buttons.push({
            variant: 'danger',
            icon: faExclamationTriangle,
            onClick: () => {
                setSelectedTicket(row["ticketID"]);
                setShowViolationsModal(true);
            },
        });

        buttons.push({
            variant: 'primary',
            icon: faPrint,
            onClick: () => {
                print(row["ticketID"]);
            },
        });

        if (row['status'] !== 'Paid' && row['status'] !== 'Canceled') {
            buttons.push({
                variant: 'primary',
                icon: faPencilAlt,
            onClick: () => {
                setSelectedTicket(row["ticketID"]);
                setShowEditModal(true);
            },
        });
            buttons.push({
                variant: 'danger',
                icon: faXmarkCircle,
                onClick: () => {
                    setSelectedTicket(row["ticketID"]);
                    setShowCancelConfirmation(true);
                },
            });
        }

        return buttons;
    };

    const { userData } = CurrentUser();
    const print = async (ticketID) => {
        try {
            showMessageBox("Generating ticket... Please wait.", "");
            const response3 = await ExecuteHTTP(
                `${COMMAND_URLS.GET_PAYMENT_BY_TICKET}?id=${ticketID}`,
                HTTP_COMMANDS.GET
            );
            const response2 = await ExecuteHTTP(
                `${COMMAND_URLS.FETCH_TICKET}?ticketId=${ticketID}`,
                HTTP_COMMANDS.GET
            );
            const response = await ExecuteHTTP(
                `${COMMAND_URLS.GET_VIOLATIONS_BY_TICKETID}?id=${ticketID}`,
                HTTP_COMMANDS.GET
            );

            const violations = await response.json();
            const ticketDetails = await response2.json();
            const paymentDetails = await response3.json();

            if (response.ok && response2.ok) {
                const doc = new jsPDF();
                doc.setFontSize(18);
                let yPos = 20;
                doc.text('Park_King', 14, yPos);
                yPos += 10;

                doc.setFontSize(12);
                doc.text(`Date Generated: ${format(new Date(), "yyyy/MM/dd hh:mm:ss")}`, 14, yPos);
                yPos += 20;

                doc.text(`Ticket ID: ${ticketID}`, 14, yPos);
                yPos += 10;
                doc.text(`Issue Date: ${ticketDetails.dateOccupied}`, 14, yPos);
                yPos += 10;
                doc.text(`Customer: ${ticketDetails.customerName}`, 14, yPos);
                yPos -= 20;

                doc.text(`Vehicle: ${ticketDetails.vehicleNumber} (${ticketDetails.vehicleType})`, 105, yPos);
                yPos += 10;
                doc.text(`Parking Slot: ${ticketDetails.section}-${ticketDetails.slotName} (${ticketDetails.isOvernight})`, 105, yPos);
                yPos += 10;
                doc.text(`Status: ${ticketDetails.status}`, 105, yPos);
                yPos += 10;

                doc.line(14, yPos, 200, yPos);
                if (violations.length > 0) {
                    const columns = ['Date', 'Reason'];
                    const rows = violations.map(item => [
                        item.DateOccurred || '',
                        item.Reason || ''
                    ]);
                    doc.setFontSize(16);
                    yPos += 10;
                    doc.text(`Violations (${rows.length} count/s)`, 14, yPos);
                    yPos += 5;
                    doc.autoTable({
                        head: [columns],
                        body: rows,
                        startY: yPos,
                        styles: {
                            cellPadding: 4,
                            fontSize: 10,
                            halign: 'justify',
                        },
                        headStyles: { fillColor: [22, 160, 133] },
                        margin: { top: 5, bottom: 5 },
                    });
                    yPos = doc.lastAutoTable.finalY + 5;
                } else {
                    yPos += 10;
                    doc.text(`No violations occurred on this customer.`, 14, yPos);
                    yPos += 5;
                }
                doc.line(14, yPos, 200, yPos);
                yPos += 10;
                if (response3.ok && ticketDetails.status === 'Paid') {
                    doc.setFontSize(16);
                    doc.text(`Payment`, 14, yPos);
                    doc.setFontSize(12);
                    yPos += 10;
                    doc.text(`Amount: PHP ${paymentDetails.price}`, 14, yPos);
                    yPos += 10;
                    doc.text(`Payment Method: ${paymentDetails.method}`, 14, yPos);
                    yPos += 10;
                    if (paymentDetails.method !== 'Cash on Hand') {
                        doc.text(`Reference ID: ${paymentDetails.reference}`, 14, yPos);
                        yPos += 10;
                    }
                } else {
                    doc.text(`No payment occurred or canceled.`, 14, yPos);
                    yPos += 5;
                }

                doc.line(14, yPos, 200, yPos);
                yPos += 5;
                doc.setFontSize(12);
                doc.setFont("helvetica", "italic"); 
                doc.text(`Generated by: ${userData.name} (${format(new Date(), "yyyy/MM/dd hh:mm:ss")})`, 14, yPos);
                // Save the document
                doc.save(`Ticket for ${ticketID} (${format(new Date(), 'yyyy-MM-dd hh-mm-ss')}).pdf`);
                return;
            }

            console.error(violations.message);
            console.error(ticketDetails.message);
            throw new Error("An error occurred during fetching.");
        } catch (error) {
            showAlertMessage(error, AlertStatus.ERROR);
        } finally {
            closeMessageBox();
        }
    }

    const handleYesDelete = async () => {
        if (selectedTicket) {
            setLoading(true);
            try {
                const response = await ExecuteHTTP(COMMAND_URLS.SET_TICKET_CANCEL, HTTP_COMMANDS.PATCH, {
                    id: selectedTicket
                }, {});
                const data = await response.json();
                if (response.ok) {
                    showAlertMessage("Successfully canceled.", AlertStatus.SUCCESS);
                    setShowCancelConfirmation(false);
                    setSelectedTicket(null);
                    refreshTickets();
                    setLoading(false);
                    return;
                }

                showAlertMessage(data.message, AlertStatus.ERROR);
            } catch (error) {
                showAlertMessage(error, AlertStatus.ERROR);
            }
            setLoading(false);
        }
    };

    const handleNoDelete = () => {
        setShowCancelConfirmation(false);
        setSelectedTicket(null);
    };


    const refreshTickets = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_TICKETS, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                setTickets(data); // Update the user list
            } else {
                setTickets([]);
                console.error('Failed to fetch users:', data.message);
                showAlertMessage('Failed to fetch tickets: ' + data.message, AlertStatus.WARNING);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showAlertMessage('Failed to fetch tickets: ' + error, AlertStatus.ERROR);
        }
    };

    useEffect(() => {
        refreshTickets(); // Fetch users on initial render
    }, []);

    return (
        <>
            <Layout>
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                    <h3 className="h3 mb-0 text-gray-800">Tickets</h3>
                </div>
                <TableControl
                    columns={columns}
                    data={tickets}
                    itemsPerPage={10}
                    actions={actions} 
                    searchable={true}
                />
            </Layout>


            <OccupySlotModal
                handleCloseModal={() => {
                    setSelectedTicket("");
                    setShowEditModal(false);
                    refreshTickets();
                }}
                isModalOpen={showEditModal}
                selectedTicket={selectedTicket}
            />
            <YesNoMessageBox
                show={showCancelConfirmation}
                message={`Are you sure you want to cancel this ticket?`}
                onYes={handleYesDelete}
                onNo={handleNoDelete}
                isLoading={isLoading}
            />
            <ViolationsModal
                isModalOpen={showViolationsModal}
                handleCloseModal={() => {
                    setSelectedTicket("");
                    setShowViolationsModal(false);
                    refreshTickets();
                }}
                selectedTicket={selectedTicket}
            />
        </>
    );
}

export default Tickets;
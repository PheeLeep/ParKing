import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import { useForm } from 'react-hook-form';
import Modal from '../controls/Modal';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react'
import ComboBox from '../controls/ComboBox';
import CheckBox from '../controls/CheckBox';
import { useAlert, AlertStatus } from '../AlertProvider';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const occupySlotSchema = z.object({
    section: z.string().optional(),
    slot: z.string().optional(),
    customerName: z.string().min(2, { message: "Customer name is required." }),
    vehicleNumber: z.string().min(1, { message: "Vehicle plate is required." }),
    vehicleType: z.string().optional(),
});

const OccupySlotModal = ({ isModalOpen, handleCloseModal, selectedTicket }) => {
    const { showAlertMessage } = useAlert();
    const [sections, setSections] = useState([]);
    const [slots, setSlots] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [isOvernight, setIsOvernight] = useState(false);

    const vehicleTypes = useMemo(() => ["Car", "Motorcycle", "Van", "Others"], []);

    const {
        register,
        handleSubmit,
        setError,
        reset,
        clearErrors,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(occupySlotSchema),
        defaultValues: {
            section: selectedSection,
            slot: selectedSlot,
            customerName: customerName,
            vehicleNumber: vehicleNumber,
            vehicleType: selectedType,
        },
    });

    useEffect(() => {
        const fetchTicketDetails = async () => {
            if (!selectedTicket) return;

            try {
                const response = await ExecuteHTTP(
                    `${COMMAND_URLS.FETCH_TICKET}?ticketId=${selectedTicket}`,
                    HTTP_COMMANDS.GET
                );

                const ticketData = await response.json();

                if (response.ok) {
                    setSelectedSection(ticketData.section);
                    setSelectedSlot(ticketData.slotName);
                    setSelectedType(ticketData.vehicleType);
                    setCustomerName(ticketData.customerName);
                    setVehicleNumber(ticketData.vehicleNumber);
                    setIsOvernight(ticketData.isOvernight === 'Overnight');
                } else {
                    console.error("Failed to fetch ticket details:", ticketData.message);
                }
            } catch (error) {
                console.error("Error fetching ticket details:", error);
            }
        };

        if (selectedTicket) {
            fetchTicketDetails();
        }
    }, [selectedTicket]);

    useEffect(() => {
        refreshSections();
        if (isModalOpen) {
            reset({
                section: selectedSection,
                slot: selectedSlot,
                customerName: customerName,
                vehicleNumber: vehicleNumber,
                vehicleType: selectedType,
            });
        } else {
            reset();
            setSelectedSection("");
            setSelectedSlot("");
            setSelectedType("");
            setCustomerName("");
            setVehicleNumber("");
            setIsOvernight(false);
        }
    }, [isModalOpen, reset, selectedSection, selectedSlot, customerName, vehicleNumber, selectedType]);

    const refreshSections = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.POPULATE_SLOT_SECTIONS, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSections(data);
            } else {
                console.error("Failed to fetch sections:", data.message);
            }
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const occupySlotSubmit = async (data) => {
        try {
            clearErrors();

            if (!selectedSection) {
                setError("section", { message: "Please select the section." });
            }
            if (!selectedSlot) {
                setError("slot", { message: "Please select the slot." });
            }
            if (!selectedType) {
                setError("vehicleType", { message: "Please select the vehicle type." });
            }

            if (!selectedSection || !selectedSlot || !selectedType) {
                return;
            }

            if (selectedTicket) {
                data.selectedTicket = selectedTicket;
            }
            data.vehicleType = selectedType;
            data.isOvernight = isOvernight;
            data.section = selectedSection;
            data.slot = selectedSlot;
            data.customerName = customerName;
            data.vehicleNumber = vehicleNumber;

            const response = await ExecuteHTTP(selectedTicket ? COMMAND_URLS.UPDATE_TICKET : COMMAND_URLS.OCCUPY_SLOT,
                selectedTicket ? HTTP_COMMANDS.PATCH : HTTP_COMMANDS.POST,
                data, {});
            const value = await response.json();

            if (response.ok) {
                console.log(value);
                const doc = new jsPDF();

                // Define card dimensions
                const cardX = 10; // X position of the card
                const cardY = 10; // Y position of the card
                const cardWidth = 190; // Width of the card
                const cardHeight = 280; // Height of the card
                const pageWidth = doc.internal.pageSize.getWidth();
                doc.setFillColor(240, 240, 240); // Light gray background
                doc.rect(cardX, cardY, cardWidth, cardHeight, 'F'); // 'F' for fill

                let yPos = cardY + 10;
                doc.setFontSize(18);
                doc.text('Park_King', (pageWidth - doc.getTextWidth('Park_King')) / 2, yPos);
                yPos += 10;

                doc.setFontSize(16);
                doc.text('Official Ticket Receipt', (pageWidth - doc.getTextWidth('Official Ticket Receipt')) / 2, yPos);
                yPos += 5;
                doc.line(14, yPos, 200, yPos);
                yPos += 5;

                doc.setFontSize(12);
                doc.text(`Date Generated: ${format(new Date(), "yyyy/MM/dd hh:mm:ss")}`, cardX + 4, yPos);
                yPos += 10;

                doc.text(`Ticket ID: ${value.ticketID}`, cardX + 4, yPos);
                yPos += 5;
                doc.text(`Issue Date: ${value.dateOccurred}`, cardX + 4, yPos);
                yPos += 5;
                doc.text(`Customer: ${customerName}`, cardX + 4, yPos);
                yPos -= 10;

                doc.text(`Vehicle: ${vehicleNumber} (${selectedType})`, cardX + 95, yPos);
                yPos += 5;
                doc.text(`Parking Slot: ${selectedSection}-${selectedSlot} (${isOvernight ? 'Overnight' : 'Normal Parking'})`, cardX + 95, yPos);
                yPos += 10;
                doc.line(14, yPos, 200, yPos);
                yPos += 5;
                doc.text(`Cut the line here`, 14, yPos);
                yPos += 10;

              
                doc.save(`Generated Ticket (${format(new Date(), 'yyyy-MM-dd hh-mm-ss')}).pdf`);
                handleCloseModal();
                showAlertMessage("Parking occupied.", AlertStatus.SUCCESS);
            } else {
                alert(value.message);
            }
        } catch (error) {
            console.error(error);
            alert("Unknown error occurred. Please contact the developer.");
        }
    };

    useEffect(() => {
        refreshSections();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            const fetchSlotsForSection = async () => {
                try {
                    const response = await ExecuteHTTP(
                        `${COMMAND_URLS.POPULATE_SLOTS}?sectionId=${selectedSection}`,
                        HTTP_COMMANDS.GET
                    );
                    const data = await response.json();
                    if (response.ok) {
                        setSlots(data);
                    } else {
                        console.error("Failed to fetch slots:", data.message);
                    }
                } catch (error) {
                    console.error("Error fetching slots:", error);
                }
            };

            fetchSlotsForSection();
        }
    }, [selectedSection]);

    return (
        <Modal
            show={isModalOpen}
            title="Edit Slot"
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            preventCloseOnSubmit={true}
            isSubmitting={isSubmitting}
        >
            <form onSubmit={handleSubmit(occupySlotSubmit)}>
                <div className="mb-3">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <ComboBox
                                inputname="section"
                                register={register}
                                textBoxLabel="Parking Section"
                                options={sections.map((s) => s.section)}
                                value={selectedSection}
                                placeholderText="Select a section..."
                                onChange={(event) => {
                                    setSelectedSection(event.target.value);
                                    setSelectedSlot("");
                                }}
                                error={errors.section}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="col-md-6">
                            <ComboBox
                                inputname="slot"
                                register={register}
                                textBoxLabel="Parking Slot"
                                options={slots.map((s) => !s.ticketOccupation && s.name)}
                                value={selectedSlot}
                                placeholderText="Select a parking slot..."
                                onChange={(event) => {
                                    setSelectedSlot(event.target.value);
                                }}
                                error={errors.slot}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>
                <div className="mb-3">
                    <TextBox
                        type={InputType.Text}
                        textBoxLabel={"Customer Name"}
                        placeholderText={"Enter the customer name."}
                        inputname={"customerName"}
                        register={register}
                        error={errors.customerName}
                        onChange={(e) => {
                            setCustomerName(e.target.value);
                            setValue('customerName', e.target.value);
                        }}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3">
                    <TextBox
                        type={InputType.Text}
                        textBoxLabel={"Plate Number"}
                        placeholderText={"Enter the Plate Number"}
                        inputname={"vehicleNumber"}
                        register={register}
                        error={errors.vehicleNumber}
                        onChange={(e) => {
                            setVehicleNumber(e.target.value);
                            setValue('vehicleNumber', e.target.value);
                        }}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3">
                    <ComboBox
                        inputname="vehicleType"
                        register={register}
                        textBoxLabel="Select a vehicle type."
                        options={vehicleTypes}
                        value={selectedType}
                        placeholderText="Select a vehicle..."
                        onChange={(event) => {
                            setSelectedType(event.target.value);
                        }}
                        error={errors.vehicleType}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3">
                    <CheckBox
                        label={"Overnight Parking (Fixed at PHP 250.00)"}
                        name={"isOvernightCheckBox"}
                        disabled={isSubmitting}
                        checked={isOvernight}
                        onChange={(e) => setIsOvernight(e)}
                    />
                </div>
                <hr />
                <div className="mb-3">
                    <BootstrapButton
                        type={ButtonType.Success}
                        text={selectedTicket ? "Edit" : "Occupy"}
                        disabled={isSubmitting}
                    />
                </div>
            </form>
        </Modal>
    );
};

OccupySlotModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired,
    handleCloseModal: PropTypes.func.isRequired,
    selectedTicket: PropTypes.string,
};

export default OccupySlotModal;

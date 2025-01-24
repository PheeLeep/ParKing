import { faBook, faAdd } from '@fortawesome/free-solid-svg-icons';
import CurrentUser from '../CurrentUser';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import Layout from '../controls/Layout'
import { ExecuteHTTP, HTTP_COMMANDS, COMMAND_URLS } from '../HTTPProxy';
import { useState, useEffect } from 'react';
import AddSlotsModal from '../Modals/AddSlotsModal';
import AddSectionModal from '../Modals/AddSectionModal';
import OccupySlotModal from '../Modals/OccupySlotModal';
import ShowSpaceModal from '../Modals/ShowSpaceModal';
import ComboBox from '../controls/ComboBox';
import DashboardCard from '../controls/DashboardCard';
import { faCarAlt } from '../../../node_modules/@fortawesome/free-solid-svg-icons/index';
import { useAlert, AlertStatus } from '../AlertProvider';


const ParkingSpace = () => {

    const [slots, setSlots] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");
    const { loading, userData } = CurrentUser();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [showOccupyModal, setShowOccupyModal] = useState(false);
    const [showSpaceModal, setShowSpaceModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState("");
    const { showAlertMessage } = useAlert();


    const refreshSections = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.POPULATE_SLOT_SECTIONS, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSections(data);
            } else {
                showAlertMessage("Failed to fetch. (" + data.message + ")", AlertStatus.WARNING);
                console.error('Failed to fetch sections:', data.message);
            }
        } catch (error) {
            showAlertMessage("Failed to fetch. (" + error + ")", AlertStatus.ERROR);
            console.error('Error fetching sections:', error);
        }
    };

    const fetchSlotsForSection = async (sectionId) => {
        try {
            const response = await ExecuteHTTP(`${COMMAND_URLS.POPULATE_SLOTS}?sectionId=${sectionId}`, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSlots(data);
            } else {
                showAlertMessage("Failed to fetch. (" + data.message + ")", AlertStatus.WARNING);
                console.error('Failed to fetch slots:', data.message);
            }
        } catch (error) {
            showAlertMessage("Failed to fetch slots. (" + error + ")", AlertStatus.ERROR);
            console.error('Error fetching slots:', error);
        }
    };

    useEffect(() => {
        if (!loading && !userData.id) {
            window.location.href = '/';
        }
    }, [userData, loading]);

    useEffect(() => {
        refreshSections();
    }, []);

    useEffect(() => {
        if (sections.length > 0) {
            setSelectedSection((prev) => prev || sections[0].section);
        }
    }, [sections]);

    useEffect(() => {
        if (selectedSection) {
            fetchSlotsForSection(selectedSection); 
        }
    }, [selectedSection]);

    return (
        <>
            <Layout>
                <div className="d-sm-flex align-items-center justify-content-between mb-4">
                    <h3 className="h3 mb-0 text-gray-800">Parking Spaces</h3>
                </div>
                <div className="d-sm-flex align-items-center justify-content-start gap-3 mb-4">
                    <BootstrapButton
                        text={"Occupy Slot"}
                        type={ButtonType.Secondary}
                        icon={faBook}
                        onClick={() => setShowOccupyModal(true) }
                    />
                    {userData.isAdmin && (
                        <>
                            <BootstrapButton
                                text={"Add Section"}
                                type={ButtonType.Primary}
                                icon={faAdd}
                                onClick={() => setShowAddSectionModal(true)}
                            />
                            <BootstrapButton
                                text={"Add Slots"}
                                type={ButtonType.Primary}
                                icon={faAdd}
                                onClick={() => setShowAddModal(true)}
                            />
                        </>
                    )}

                    {/* ComboBox for selecting section */}
                    <ComboBox
                        inputname="exampleComboBox"
                        textBoxLabel="Select a section."
                        options={sections.map(s => s.section)} // Map the section name or id as needed
                        value={ selectedSection} // Set default value for the dropdown
                        placeholderText="Select an option..."
                        onChange={(event) => setSelectedSection(event.target.value)} // Update selected section
                    />
                </div>

                <div className="container my-4">
                    <div className="row g-3">
                        <DashboardCard
                            icon={faCarAlt}
                            text={"Occupied Spaces"}
                            value={`${slots.filter(s => s.ticketOccupation).length}/${slots.length}`}
                        />
                    </div>
                </div>

                <div
                    className="container d-flex flex-wrap justify-content-center align-items-center"
                    style={{
                        maxHeight: "300px",
                        overflowY: "auto", // Enable vertical scrolling
                        overflowX: "hidden", // Prevent horizontal overflow
                        border: "1px solid #ccc", // Optional: adds a visible boundary
                    }}
                >
                    {/* Display the slots */}
                    {slots.map((slot, i) => (
                        <div
                            key={i}
                            className={`box ${(slot.ticketOccupation ? 'bg-success' : 'bg-primary')} text-white p-3 m-2 border rounded d-flex justify-content-center align-items-center`}
                            style={{ width: "100px", height: "50px" }}
                            onClick={() => {
                                setSelectedSlot(slot.id);
                                setShowSpaceModal(true);
                            } }
                        >
                            {`${slot.name}`}
                        </div>
                    ))}
                </div>

                <div className="container mt-4">
                    <h5 className="mb-3">Legend</h5>
                    <div className="d-flex gap-3 align-items-center">
                        <div
                            className="box bg-success text-white p-3 border rounded d-flex justify-content-center align-items-center"
                            style={{ width: "100px", height: "50px" }}
                        >
                            Occupied
                        </div>
                        <div
                            className="box bg-primary text-white p-3 border rounded d-flex justify-content-center align-items-center"
                            style={{ width: "100px", height: "50px" }}
                        >
                            Available
                        </div>
                    </div>
                </div>


                {/* Add Slots Modal */}
                <AddSlotsModal
                    isModalOpen={showAddModal}
                    handleCloseModal={() => {
                        setShowAddModal(false);
                        refreshSections(); if (selectedSection) {
                            fetchSlotsForSection(selectedSection); 
                        }
                    }}
                />

                {/* Add Section Modal */}
                <AddSectionModal
                    isModalOpen={showAddSectionModal}
                    handleCloseModal={() => {
                        setShowAddSectionModal(false);
                        refreshSections(); 
                        if (selectedSection) {
                            fetchSlotsForSection(selectedSection);
                        }
                    }}
                />

                <ShowSpaceModal
                    isModalOpen={showSpaceModal}
                    handleCloseModal={() => {
                        setShowSpaceModal(false);
                        setSelectedSlot("");
                    }}
                    selectedID={selectedSlot}
                />
                <OccupySlotModal
                    isModalOpen={showOccupyModal}
                    handleCloseModal={() => {
                        setShowOccupyModal(false);
                        refreshSections(); 
                        if (selectedSection) {
                            fetchSlotsForSection(selectedSection);
                        }
                    }}

                />


            </Layout>
        </>
    );
}

export default ParkingSpace;

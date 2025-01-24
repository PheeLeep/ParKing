
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import Modal from '../controls/Modal';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react'

const ShowSpaceModal = ({ isModalOpen, handleCloseModal, selectedID }) => {

    const [slotData, setSlotData] = useState([]);

    const fetchSlot = async (sectionId) => {
        try {
            const response = await ExecuteHTTP(`${COMMAND_URLS.GET_SLOT}?slotID=${sectionId}`, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSlotData(data);
            } else {
                console.error('Failed to fetch slots:', data.message);
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    useEffect(() => {
        if (selectedID) {
            fetchSlot(selectedID);
        }
    }, [selectedID]);
  return (
      <Modal
          show={isModalOpen}
          title="Slot"
          onClose={handleCloseModal}
          preventCloseOnSubmit={true}
      >
          <>
              <div className="mb-3">
                  <p><b>Slot Name: </b>{slotData.name}</p>
                  <p><b>Slot Section: </b>{slotData.section}</p>
              </div>
              <div className="mb-3 d-flex align-items-center">
                  <p className="mb-0 me-2"><b>Status: </b></p>
                  <div
                      className={`box ${(slotData.ticketOccupation ? 'bg-success' : 'bg-primary')} text-white p-3 border rounded d-flex justify-content-center align-items-center`}
                      style={{ width: "100px", height: "30px" }}
                  >
                      {(slotData.ticketOccupation ? 'Occupied' : 'Available')}
                  </div>
              </div>
              {slotData.ticketOccupation && (
                  <>
                      <hr />
                      <div className="mb-3">
                          <p><b>Customer Name: </b>{slotData.customerName}</p>
                          <p><b>Vehicle Plate Number: </b>{slotData.plateNo}</p>
                          <p><b>Vehicle Type: </b>{slotData.vehicleType}</p>
                      </div>
                  </>
              ) }
           
          </>
      </Modal>
  );
}

ShowSpaceModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired, 
    handleCloseModal: PropTypes.func.isRequired,
    selectedID: PropTypes.string.isRequired
};


export default ShowSpaceModal;
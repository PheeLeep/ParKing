import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import { useForm } from 'react-hook-form';
import Modal from '../controls/Modal';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react'
import ComboBox from '../controls/ComboBox';
import { useAlert, AlertStatus } from '../AlertProvider';

const AddSlotsModal = ({ isModalOpen, handleCloseModal }) => {
    const addSlotSchema = z.object({
        addSection: z.string().optional(),
        addSlots: z.coerce.number().min(1, { message: "Value must be 1 or greater." }),
    });
    const { showAlertMessage } = useAlert();

    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(addSlotSchema),
    });
    const refreshSections = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.POPULATE_SLOT_SECTIONS, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                setSections(data);
            } else {
                console.error('Failed to fetch sections:', data.message);
            }
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    const addSlotSubmit = async (data) => {
        try {
            if (!selectedSection) {
                setError("addSection", { message:"Please select the slot." });
                return;
            } 
            data.addSection = selectedSection;
            const response = await ExecuteHTTP(
                COMMAND_URLS.ADD_SLOTS,
                HTTP_COMMANDS.POST,
                data, {});
            const value = await response.json();
            if (response.ok) {
                handleCloseModal();
                showAlertMessage("Slot added", AlertStatus.SUCCESS);
            } else {
                setError("addSlots", { message: value.message });
            }
        } catch (error) {
            if (error instanceof Error) {
                setError("addSlots", { message: error.message });
            } else {
                setError("addSlots", { message: "Unknown error occurred. Please contact to the developer." });
            }
            console.error(error);
        }
    };
    useEffect(() => {
        refreshSections(); 
    }, []);

    useEffect(() => {
        if (!isModalOpen) {
            reset();
            refreshSections();
        }
    }, [isModalOpen, reset]);
  return (
      <Modal
          show={isModalOpen}
          title="Add Slots"
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          preventCloseOnSubmit={true}
          isSubmitting={isSubmitting}
      >
          <form onSubmit={handleSubmit(addSlotSubmit)}>
              <div className="mb-3">
                  <ComboBox
                      inputname="addSection"
                      register={register}
                      textBoxLabel="Select a section."
                      options={sections.map(s => s.section)} 
                      value={selectedSection} 
                      placeholderText="Select an option..."
                      onChange={(event) => {
                          console.log(event.target.value);
                          setSelectedSection(event.target.value)
                      }} 
                      error={errors.addSection }
                  />
              </div>
              <div className="mb-3">
                  <TextBox
                      type={InputType.Number}
                      textBoxLabel={"Add number of parking slots." }
                      placeholderText={"Add number of parking slots."}
                      inputname={"addSlots"}
                      register={register}
                      error={errors.addSlots}
                      defaultValue={1}
                      min={1 }
                      disabled={isSubmitting}
                  />
              </div>
              <hr />
              <div className="mb-3">
                  <BootstrapButton
                      type={ButtonType.Success}
                      disabled={isSubmitting}
                      text="Add"
                  />
              </div>
          </form>
      </Modal>
  );
}

AddSlotsModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired,
    handleCloseModal: PropTypes.func.isRequired,
};


export default AddSlotsModal;
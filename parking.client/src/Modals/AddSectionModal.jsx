import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import { useForm } from 'react-hook-form';
import Modal from '../controls/Modal';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import { useEffect } from 'react'
import { useAlert, AlertStatus } from '../AlertProvider';
const addSectionSchema = z.object({
    addSection: z.string().min(1, { message: "Enter the section." }),
});

const AddSectionModal = ({ isModalOpen, handleCloseModal }) => {
    const { showAlertMessage } = useAlert();
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(addSectionSchema),
    });


    const addSectionSubmit = async (data) => {
        try {
            const response = await ExecuteHTTP(
                COMMAND_URLS.ADD_SLOT_SECTION,
                HTTP_COMMANDS.POST,
                data, {});
            const value = await response.json();
            if (response.ok) {
                handleCloseModal();
                showAlertMessage("Section Added", AlertStatus.SUCCESS);
            } else {
                setError("addSection", { message: value.message });
            }
        } catch (error) {
            if (error instanceof Error) {
                setError("addSection", { message: error.message });
            } else {
                setError("addSection", { message: "Unknown error occurred. Please contact to the developer." });
            }
            console.error(error);
        }

    };

    useEffect(() => {
        if (!isModalOpen) {
            reset();
        }
    }, [isModalOpen, reset]);
  return (
      <Modal
          show={isModalOpen}
          title="Add Section"
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          preventCloseOnSubmit={true}
          isSubmitting={isSubmitting}
      >
          <form onSubmit={handleSubmit(addSectionSubmit)}>
              <div className="mb-3">
                  <TextBox
                      type={InputType.Text}
                      placeholderText={"Enter new parking slot section."}
                      inputname={"addSection"}
                      register={register}
                      error={errors.addSection}
                      disabled={isSubmitting}
                  />
              </div>
              <hr />
              <div className="mb-3">
                  <BootstrapButton
                      type={ButtonType.Success}
                      disabled={isSubmitting}
                      text="Add Section"
                  />
              </div>
          </form>
      </Modal>
  );
}

AddSectionModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired, 
    handleCloseModal: PropTypes.func.isRequired, 
};


export default AddSectionModal;

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import { useForm } from 'react-hook-form';
import Modal from '../controls/Modal';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(5, { message: "Password must be at least 6 characters" }),
    newPassword: z.string().min(5, { message: "Password must be at least 6 characters" }),
    retypeNewPassword: z.string().min(5, { message: "Retype password must be at least 6 characters" })
}).refine((data) => data.newPassword === data.retypeNewPassword, {
    message: "Passwords do not match",
    path: ["regRetypePassword"],
});

const ChangePasswordModal = ({ isModalOpen, handleCloseModal }) => {
   
    const {
        register,
        handleSubmit,
        setError, 
        reset,
        formState: { errors,  isSubmitting},
    } = useForm({
        resolver: zodResolver(changePasswordSchema),
    });


    const changePassSubmit = async (data) => {
        try {
            const response = await ExecuteHTTP(
                COMMAND_URLS.EMPLOYEE_CHANGE_PASSWORD,
                HTTP_COMMANDS.PATCH,
                data, {});
            const value = await response.json();
            if (response.ok) {
                window.location.href = "/";
            } else {
                setError("retypeNewPassword", { message: value.message });
            }
        } catch (error) {
            if (error instanceof Error) {
                setError("retypeNewPassword", { message: error.message });
            } else {
                setError("retypeNewPassword", { message: "Unknown error occurred. Please contact to the developer." });
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
      <>
          <Modal
              show={isModalOpen}
              title="Change Password"
              onClose={handleCloseModal}
              onSubmit={handleSubmit}
              preventCloseOnSubmit={true}
              isSubmitting={isSubmitting}
          >
              <form onSubmit={handleSubmit(changePassSubmit)}>
                  <div className="mb-3">
                      <TextBox
                          type={InputType.Password}
                          textBoxLabel={"Password"}
                          placeholderText={"Enter your old password"}
                          inputname={"currentPassword"}
                          register={register}
                          error={errors.currentPassword}
                          disabled={isSubmitting}
                      />
                  </div>
                  <div className="mb-3">
                      <TextBox
                          type={InputType.Password}
                          textBoxLabel={"Password"}
                          placeholderText={"Enter your new password"}
                          inputname={"newPassword"}
                          register={register}
                          error={errors.newPassword}
                          disabled={isSubmitting}
                      />
                  </div>
                  <div className="mb-3">
                      <TextBox
                          type={InputType.Password}
                          textBoxLabel={"Password"}
                          placeholderText={"Re-type your new password"}
                          inputname={"retypeNewPassword"}
                          register={register}
                          error={errors.retypeNewPassword}
                          disabled={isSubmitting}
                      />
                  </div>
                  <div className="mb-3" style={{ color: "red", display: "flex", alignItems: "center" }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span style={{ marginLeft: "8px", display: "inline-flex" }} >
                          After you changed your password, you&apos;ll be automatically logged out from the main page.
                      </span>
                  </div>
                  <hr />
                  <div className="mb-3">
                      <BootstrapButton
                          type={ButtonType.Success}
                          disabled={isSubmitting}
                          text="Change Password"
                      />
                  </div>
              </form>
          </Modal>
      </>
  );
}

ChangePasswordModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired, 
    handleCloseModal: PropTypes.func.isRequired,
};

export default ChangePasswordModal;
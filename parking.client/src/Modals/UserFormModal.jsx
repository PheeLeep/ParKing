import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy';
import { useForm } from 'react-hook-form';
import Modal from '../controls/Modal';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import CheckBox from '../controls/CheckBox';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import CurrentUser from '../CurrentUser';
import { useAlert, AlertStatus } from '../AlertProvider';

export const UserFormModal = ({ show, onClose, userID }) => {
    const [formData, setFormData] = useState({
        regFullName: "",
        regEmail: "",
        isAdmin: false,
    });
    const { showAlertMessage } = useAlert();
    const userFormSchema = (userID) =>
        z
            .object({
                regFullName: z
                    .string()
                    .min(5, { message: "Must have at least 5 characters." }),
                regEmail: z.string().email({ message: "Please enter a valid email" }),
                regPassword: !userID
                    ? z.string().min(6, { message: "Password must be at least 6 characters" })
                    : z.string().optional(),
                regRetypePassword: !userID
                    ? z
                        .string()
                        .min(6, { message: "Retype password must be at least 6 characters" })
                    : z.string().optional(),
            })
            .refine((data) => data.regPassword === data.regRetypePassword, {
                message: "Passwords do not match",
                path: ["regRetypePassword"],
            });

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(userFormSchema(userID)),
        defaultValues: formData
    });

    const { userData } = CurrentUser();
    const onUserFormSubmit = async (data) => {
        data.isAdmin = formData.isAdmin; 
        if (userID) {
            data.id = userID;
        }
        try {
            const str = userID ? COMMAND_URLS.EDIT_USER : COMMAND_URLS.ADD_USER;
            const comm = userID ? HTTP_COMMANDS.PATCH : HTTP_COMMANDS.POST;
            const response = await ExecuteHTTP(str, comm, data, {});
            const result = await response.json();
            if (response.ok) {
                showAlertMessage("User added.", AlertStatus.SUCCESS);
                onClose();
                return;
            }
            alert(result.message);
        } catch (error) {
            setError("regFullName", { message: error });
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ExecuteHTTP(COMMAND_URLS.GET_ONE_USER,
                    HTTP_COMMANDS.POST,
                    { "userID": userID });
                const data = await response.json();

                if (response.ok) {
                    setFormData({
                        regFullName: data.name || "",
                        regEmail: data.emailAddress || "",
                        isAdmin: data.isAdmin || false,
                    });
                    return;
                }

                alert(data.message);
                onClose();
            } catch (error) {
                console.warn("Invalid user string passed to UserFormDialog:", error);
                setFormData({ regFullName: "", regEmail: "", isAdmin: false });
            }
        }

        if (userID) {
            fetchData();
        }
    }, [userID, onClose]);

    useEffect(() => {
        if (formData) {
            reset(formData);
        }
    }, [formData, reset]);

    return (
        <Modal
            show={show}
            title={(userID ? "Edit" : "Add New") + " User"}
            onClose={onClose}
            onSubmit={handleSubmit}
            preventCloseOnSubmit={true}
            isSubmitting={isSubmitting}
        >
            <form onSubmit={handleSubmit(onUserFormSubmit)}>
                <div className="mb-3">
                    <TextBox
                        type={InputType.Text}
                        textBoxLabel={"Full Name"}
                        placeholderText={"Enter the full name."}
                        inputname={"regFullName"}
                        register={register}
                        error={errors.regFullName}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3">
                    <TextBox
                        type={InputType.Text}
                        textBoxLabel={"Email Address"}
                        placeholderText={"Enter the email address."}
                        inputname={"regEmail"}
                        register={register}
                        error={errors.regEmail}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="mb-3" style={{ display: userID && userID !== userData.id ? 'block' : 'none' }} >
                        <CheckBox
                            label={"Is Administrator"}
                            name={"isAdminCheckBox"}
                            disabled={isSubmitting}
                            checked={formData.isAdmin} // Sync checked with formData
                            onChange={(e) => setFormData((prev) => ({ ...prev, isAdmin: e }))} // Update formData directly
                        />
                    </div>
              
                {!userID && (
                    <>
                        <div className="mb-3">
                            <TextBox
                                type={InputType.Password}
                                textBoxLabel={"New Password"}
                                placeholderText={"Enter the new password."}
                                inputname={"regPassword"}
                                register={register}
                                error={errors.regPassword}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="mb-3">
                            <TextBox
                                type={InputType.Password}
                                textBoxLabel={"Retype New Password"}
                                placeholderText={"Retype the new password."}
                                inputname={"regRetypePassword"}
                                register={register}
                                error={errors.regRetypePassword}
                                disabled={isSubmitting}
                            />
                        </div>
                    </>
                )}
                <hr />
                <div className="mb-3">
                    <BootstrapButton
                        text={userID ? "Save Changes" : "Add User"}
                        type={ButtonType.Success}
                        disabled={isSubmitting}
                    />
                </div>
            </form>
        </Modal>
    );
}

UserFormModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userID: PropTypes.string,
};

UserFormModal.defaultProps = {
    userID: "",
};

export default UserFormModal;

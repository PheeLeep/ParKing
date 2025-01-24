import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import { useForm } from 'react-hook-form';
import Modal from '../controls/Modal';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react'
import TableControl from '../controls/TableControl';
import { faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import YesNoMessageBox from '../Modals/MessageBoxes/YesNoMsgBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const addViolationsSchema = z.object({
    violation: z.string().min(1, { message: "Enter the violation." }),
});

const ViolationsModal = ({ isModalOpen, handleCloseModal, selectedTicket }) => {

    const [selectedViolation, setSelectedViolation] = useState("");
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const columns = [
        { key: 'DateOccurred', display: 'Date' },
        { key: 'Reason', display: 'Reason' },
    ];

    const actions = (row) => {
        const buttons = [];

        if (isUnpaid) {
            buttons.push({
                variant: 'danger',
                icon: faTrash,
                onClick: () => {
                    setSelectedViolation(row.ID); 
                    setShowDeleteConfirmation(true);
                },
            });
        }
        return buttons;
    };

    const {
        register,
        handleSubmit,
        setError,
        reset,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(addViolationsSchema),
    });

    const [isUnpaid, setIsUnpaid] = useState(false);
    const [violations, setViolations] = useState([]);

    const fetchViolations = async () => {
        if (!selectedTicket) return;

        try {
            const response = await ExecuteHTTP(
                `${COMMAND_URLS.GET_VIOLATIONS_BY_TICKETID}?id=${selectedTicket}`,
                HTTP_COMMANDS.GET
            );

            const ticketData = await response.json();

            if (response.ok) {
                setViolations(ticketData);
            } else {
                console.error("Failed to fetch ticket details:", ticketData.message);
            }
        } catch (error) {
            console.error("Error fetching ticket details:", error);
        }
    };


    const addViolationSubmit = async (data) => {
        try {
            data.ticket = selectedTicket;
            const response = await ExecuteHTTP(
                COMMAND_URLS.ADD_VIOLATION,
                HTTP_COMMANDS.POST,
                data, {});
            const value = await response.json();
            if (response.ok) {
                reset();
                clearErrors();
                fetchViolations();
            } else {
                setError("violation", { message: value.message });
            }
        } catch (error) {
            if (error instanceof Error) {
                setError("violation", { message: error.message });
            } else {
                setError("violation", { message: "Unknown error occurred. Please contact to the developer." });
            }
            console.error(error);
        }

    };

    const handleYesDelete = async () => {
        if (selectedViolation) {
            setLoading(true);
            try {
                const response = await ExecuteHTTP(`${COMMAND_URLS.REMOVE_VIOLATION}?id=${selectedViolation}`, HTTP_COMMANDS.DELETE);
                const data = await response.json();
                if (response.ok) {
                    setShowDeleteConfirmation(false);
                    setSelectedViolation(null); 
                    fetchViolations();
                    setLoading(false);
                    return;
                }

                alert(data.message);
            } catch (error) {
                alert(error);
            }
            setLoading(false);
        }
    };

    const handleNoDelete = () => {
        setShowDeleteConfirmation(false);
        setSelectedViolation(null);
    };

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
                    setIsUnpaid(ticketData.status === 'Unpaid');
                } else {
                    console.error("Failed to fetch ticket details:", ticketData.message);
                }
            } catch (error) {
                console.error("Error fetching ticket details:", error);
            }
        };

       
        if (selectedTicket) {
            fetchTicketDetails();
            fetchViolations();
        }
    }, [selectedTicket]);

    useEffect(() => {
        if (!isModalOpen) {
            reset();
        }
    }, [isModalOpen, reset]);
  return (
      <Modal
          show={isModalOpen}
          title="Violations"
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          preventCloseOnSubmit={true}
          isSubmitting={isSubmitting}
      >
          {isUnpaid && (
              <form onSubmit={handleSubmit(addViolationSubmit)}>
                  <div className="mb-3">
                      <TextBox
                          type={InputType.Text}
                          placeholderText={"Enter a violation note."}
                          inputname={"violation"}
                          register={register}
                          error={errors.violation}
                          disabled={isSubmitting}
                      />
                  </div>
                  <hr />
                  <div className="mb-3">
                      <BootstrapButton
                          type={ButtonType.Danger}
                          disabled={isSubmitting}
                          text="Add Violation"
                      />
                  </div>
              </form>
          )}

          <TableControl
              columns={columns}
              data={violations}
              itemsPerPage={10}
              actions={actions }
          />
          <div className="mb-3" style={{ color: "red", display: "flex", alignItems: "center" }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span style={{ marginLeft: "8px", display: "inline-flex" }} >
                  Each violation costs PHP 200
              </span>
          </div>
          <YesNoMessageBox
              show={showDeleteConfirmation}
              message={`Are you sure you want to remove this violation?`}
              onYes={handleYesDelete}
              onNo={handleNoDelete}
              isLoading={isLoading}
          />
      </Modal>
  );
}

ViolationsModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired, 
    handleCloseModal: PropTypes.func.isRequired,
    selectedTicket: PropTypes.string.isRequired
};


export default ViolationsModal;
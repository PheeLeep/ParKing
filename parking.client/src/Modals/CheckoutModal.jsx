import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import Modal from '../controls/Modal';
import { useForm } from 'react-hook-form';
import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react'
import ComboBox from '../controls/ComboBox';
import { useAlert, AlertStatus } from '../AlertProvider';

const CheckoutModal = ({ isModalOpen, handleCloseModal }) => {
    const checkOutModal = z.object({
        ticket: z.string().optional(),
        price: z.coerce.number().min(1, { message: "Value must be 1 or greater." }),
        method: z.string().optional(),
        refID: z.string().optional()
    });

    const { showAlertMessage } = useAlert();
    const [ticketInfo, setTicketInfo] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState("");
    const [selectedPayment, setSelectedPayment] = useState("");
  
    const paymentTypes = useMemo(() => ["Cash on Hand", "Debit/Credit Card", "GCash", "Maya"], []);

    const refreshTickets = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_TICKETS, HTTP_COMMANDS.GET);
            const data = await response.json();
            if (response.ok) {
                const unpaidTickets = data.filter(ticket => ticket.status === 'Unpaid');
                setTickets(unpaidTickets);
            } else {
                console.error('Failed to fetch tickets:', data.message);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };


    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(checkOutModal),
    });


    const checkoutSubmit = async (data) => {
        try {
            clearErrors();
            data.ticket = selectedTicket;
            data.method = selectedPayment;
            let errorCount = 0;
            if (!selectedPayment) {
                setError("method", { message: "Please select the paymen method." });
                errorCount++;
            }

            data.price = parseFloat(data.price);
            
            if (isNaN(data.price) || data.price < 1) {
                setError("price", { message: "Price must be a valid decimal number greater than or equal to 1." });
                errorCount++;
            }

            if (selectedPayment === "Cash on Hand") {
                data.refID = "(none)";
            } else {
                if (!data.refID) {
                    setError("refID", { message: "Reference ID cannot be empty." });
                    errorCount++;
                }
            }

            let priceToPay = parseFloat(ticketInfo.totalPrice) - data.price;
            if (priceToPay > 0) {
                setError("price", { message: "Amount is too low." });
                errorCount++;
            }
            
            if (errorCount > 0) return;
       

            const response = await ExecuteHTTP(
                COMMAND_URLS.PAY_TICKET,
                HTTP_COMMANDS.POST,
                data, {});
            const value = await response.json();
            if (response.ok) {
                showAlertMessage("Successfully paid.", AlertStatus.SUCCESS);
                priceToPay = Math.abs(priceToPay);
                if (priceToPay > 0) {
                    alert(`Change: PHP ${priceToPay}`);
                }
                handleCloseModal();
                reset();
            } else {
                alert(value.message);
            }
        } catch (error) {
            if (error instanceof Error) {
               alert(error.message);
            } else {
                alert("Unknown error occurred. Please contact to the developer.");
            }
            console.error(error);
        }
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
                    console.log(ticketData);
                    setTicketInfo(ticketData);
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
        if (!isModalOpen) {
            reset();
            refreshTickets();
            setSelectedTicket("");
            setSelectedPayment("");
        }
    }, [isModalOpen, reset]);

    useEffect(() => {
        refreshTickets(); // Fetch sections on initial render
    }, []);

  return (
      <Modal
          show={isModalOpen}
          title="Checkout Payment"
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          preventCloseOnSubmit={true}
          isSubmitting={isSubmitting}
      >
          <form onSubmit={handleSubmit(checkoutSubmit)}>
              <div className="mb-3">
                  <ComboBox
                      inputname="ticket"
                      register={register}
                      defaultValue={selectedTicket}
                      disabled={isSubmitting}
                      textBoxLabel="Ticket"
                      options={tickets.map(s => s.ticketID)} 
                      placeholderText="Select an unpaid ticket..."
                      onChange={(event) => {
                          setSelectedTicket(event.target.value);
                      }} 
                      error={errors.ticket}
                  />
              </div>
              {selectedTicket && (
                  <>
                      <hr />
                      <h5 className="h5">Summary</h5>
                      <div className="d-sm-flex align-items-center justify-content-between">
                          <p>Parking:</p>
                          <p dir="rtl">{ticketInfo.section}-{ticketInfo.slotName} ({ticketInfo.isOvernight}) (Customer: {ticketInfo.customerName})</p>
                      </div>
                      <div className="d-sm-flex align-items-center justify-content-between">
                          <p>Subtotal:</p>
                          <p style={{ whiteSpace: 'pre-line' }}>{ticketInfo.priceCalculation}</p>
                      </div>
                      <div className="d-sm-flex align-items-center justify-content-between">
                          <p>Violation Amount:</p>
                          <p style={{ whiteSpace: 'pre-line' }}>{ticketInfo.violationCount}</p>
                      </div>
                      <div className="d-sm-flex align-items-center justify-content-between">
                          <h4 className="h4">Total:</h4>
                          <p className="h4">PHP {ticketInfo.totalPrice}</p>
                      </div>
                      <hr />
                      <div className="mb-3">
                          <div className="row mb-3">
                              <div className="col-md-6">
                                  <TextBox
                                      type={InputType.Number}
                                      textBoxLabel={"Price (in PHP)"}
                                      placeholderText={"Enter the amount of price."}
                                      inputname={"price"}
                                      register={register}
                                      error={errors.price}
                                      defaultValue={1}
                                      min={1}
                                      step="0.01"
                                      disabled={isSubmitting}
                                  />
                              </div>
                              <div className="col-md-6">
                                  <ComboBox
                                      inputname="method"
                                      register={register}
                                      textBoxLabel="Payment Method"
                                      options={paymentTypes.map((s) => s)}
                                      placeholderText="Select a payment option..."
                                      onChange={(event) => {
                                          setSelectedPayment(event.target.value);
                                      }}
                                      error={errors.method}
                                      disabled={isSubmitting} />
                              </div>
                          </div>
                      
                      </div>
                      <div className="mb-3">
                          <TextBox
                              type={InputType.Text}
                              textBoxLabel={"Reference ID (for non-Cash on Hand only)"}
                              placeholderText={"Enter the reference ID"}
                              inputname={"refID"}
                              register={register}
                              error={errors.refID}
                              disabled={isSubmitting || selectedPayment === 'Cash on Hand'}
                          />
                      </div>
                      <div className="mb-3">
                          <BootstrapButton
                              type={ButtonType.Success}
                              disabled={isSubmitting}
                              text="Pay Now"
                          />
                      </div>
                  </>
              )}
          </form>
      </Modal>
  );
}


CheckoutModal.propTypes = {
    isModalOpen: PropTypes.bool.isRequired, // Ensures `isModalOpen` is a required boolean
    handleCloseModal: PropTypes.func.isRequired, // Ensures `handleCloseModal` is a required function
};
export default CheckoutModal;
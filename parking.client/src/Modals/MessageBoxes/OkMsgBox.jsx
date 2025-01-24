import PropTypes from "prop-types";
import Modal from "../../controls/Modal";

const OkMsgBox = ({ show, message, onOK }) => {
    return (
        <Modal
            show={show}
            title="Confirmation"
            onClose={onOK} 
            preventCloseOnSubmit={false}
            isSubmitting={false}
        >
            <p>{message}</p>
            <div className="text-center">
                <button className="btn btn-primary" onClick={onOK}  >
                    OK
                </button>
            </div>
        </Modal>
    );
};
OkMsgBox.propTypes = {
    show: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onOK: PropTypes.func.isRequired,
};

export default OkMsgBox;

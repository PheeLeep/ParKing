import PropTypes from "prop-types";
import Modal from "../../controls/Modal";

const YesNoMsgBox = ({ show, message, onYes, onNo, isLoading }) => {
    return (
        <Modal
            show={show}
            title="Confirmation"
            onClose={onNo} 
            preventCloseOnSubmit={false}
            isSubmitting={isLoading}
        >
            <p>{message}</p>
            <div className="text-center">
                <button className="btn btn-primary" onClick={onYes} style={{ marginRight: '15px' }} disabled={isLoading} >
                    Yes
                </button>
                <button className="btn btn-secondary" onClick={onNo} disabled={isLoading} >
                    No
                </button>
            </div>
        </Modal>
    );
};
YesNoMsgBox.propTypes = {
    show: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onYes: PropTypes.func.isRequired,
    onNo: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired
};

export default YesNoMsgBox;

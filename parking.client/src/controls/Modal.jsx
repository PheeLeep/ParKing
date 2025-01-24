import PropTypes from "prop-types";

const Modal = ({
    show,
    title,
    children,
    onClose,
    preventCloseOnSubmit = false,
    isSubmitting = false,
}) => {
    const handleBackdropClick = (e) => {
        if (preventCloseOnSubmit && isSubmitting) return;
        if (e.target.classList.contains("modal")) {
            onClose();
        }
    };

    const handleModalClose = () => {
        if (preventCloseOnSubmit && isSubmitting) return;
        onClose();
    };

    return (
        <>
            {show && <div className="modal-backdrop fade show"></div>}
            <div
                className={`modal fade ${show ? "show d-block" : ""}`}
                tabIndex="-1"
                onClick={handleBackdropClick}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleModalClose}
                                disabled={preventCloseOnSubmit && isSubmitting}
                            ></button>
                        </div>
                        <div className="modal-body">{children}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

Modal.propTypes = {
    show: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    preventCloseOnSubmit: PropTypes.bool,
    isSubmitting: PropTypes.bool,
};

Modal.defaultProps = {
    children: null,
    preventCloseOnSubmit: false,
    isSubmitting: false,
};

export default Modal;

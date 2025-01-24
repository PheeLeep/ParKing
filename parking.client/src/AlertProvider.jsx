import  { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const AlertContext = createContext();
export const AlertStatus = {
    SUCCESS: 'alert-success',
    ERROR: 'alert-danger',
    WARNING: 'alert-warning',
    INFO: 'alert-info',
    PRIMARY: 'alert-primary',
};

export const AlertProvider = ({ children }) => {
    const [alertMessage, setAlertMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertStatus, setAlertStatus] = useState(AlertStatus.PRIMARY); // Default status

    const showAlertMessage = (message, status = AlertStatus.PRIMARY) => {
        setAlertMessage(message);
        setAlertStatus(status);
        if (!message) {
            setShowAlert(false);
            return;
        }
        setShowAlert(true);
        setTimeout(() => {
            setShowAlert(false);
        }, 10000);
    };

    return (
        <AlertContext.Provider value={{ showAlertMessage, alertMessage, showAlert, alertStatus }}>
            {children}
        </AlertContext.Provider>
    );
};

AlertProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAlert = () => {
    return useContext(AlertContext);
};
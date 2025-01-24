import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const MessageBoxContext = createContext();

export const useMessageBox = () => {
    return useContext(MessageBoxContext);
};

export const MessageBoxProvider = ({ children }) => {
    const [show, setShow] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('');

    const showMessageBox = (newMessage, newTitle) => {
        setTitle(newTitle || '');
        setMessage(newMessage || 'Please wait while we process your request.');
        setShow(true);
        setIsSubmitting(true);
    };

    const closeMessageBox = () => {
        setShow(false);
        setIsSubmitting(false);
        setMessage('');
        setTitle('');
    };

    return (
        <MessageBoxContext.Provider value={{ show, isSubmitting, message, title, showMessageBox, closeMessageBox }}>
            {children}
        </MessageBoxContext.Provider>
    );
};

MessageBoxProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
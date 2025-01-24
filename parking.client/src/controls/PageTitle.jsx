import { useEffect } from 'react';
import PropTypes from 'prop-types';

function PageTitle({ title, children }) {

    useEffect(() => {
        document.title = `${title} | Park_King`; 
    }, [title]);

    return (
        <>{children}</>
    );
}

PageTitle.propTypes = {
    title: PropTypes.string.isRequired, 
    children: PropTypes.node.isRequired,
};

export default PageTitle;
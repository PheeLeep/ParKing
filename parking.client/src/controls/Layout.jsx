import PropTypes from 'prop-types';
import { Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';
import {
    faHome,
    faCreditCard,
    faUserAlt,
    faCar,
    faTicketSimple,
    faChartLine,
    faBars,
    faPowerOff
} from '@fortawesome/free-solid-svg-icons';
import BootstrapButton, { ButtonType, ButtonSize } from './BootstrapButton';
import { useEffect, useState } from 'react';
import {  faKey, faUserCog } from '../../../node_modules/@fortawesome/free-solid-svg-icons/index';
import { ExecuteHTTP, HTTP_COMMANDS, COMMAND_URLS } from '../HTTPProxy';
import ChangePasswordModal from '../Modals/ChangePasswordModal';
import CurrentUser from '../CurrentUser';
import { useAlert, AlertStatus } from '../AlertProvider';


const Layout = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCloseModal = () => setIsModalOpen(false);
    const { showAlertMessage, alertMessage, showAlert, alertStatus } = useAlert();

    const handleLogout = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.LOGOUT, HTTP_COMMANDS.DELETE, {}, {});
            if (response.ok) {
                window.location.href = '/'; 
            } else {
                showAlertMessage("Logout Failed. Please try again.", AlertStatus.ERROR);
                console.error('Logout failed');
            }
        } catch (error) {
            showAlertMessage("An error has occurred.", AlertStatus.ERROR);
            console.error('Error during logout:', error);
        }
    };


    const handleLogoutClick = async () => {
        if (isLoggingOut) return;  
        setIsLoggingOut(true);  
        await handleLogout();
        setIsLoggingOut(false);    
    };


    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const location = useLocation();
    const links = [
        { path: '/dashboard', label: 'Dashboard', icon: faHome },
        { path: '/parking-spaces', label: 'Parking Spaces', icon: faCar },
        { path: '/tickets', label: 'Tickets', icon: faTicketSimple },
        { path: '/reports', label: 'Reports', icon: faChartLine },
        { path: '/payments', label: 'Payment', icon: faCreditCard },
    ];

    const adminLinks = [
        { path: '/users', label: 'User Management', icon: faUserCog },
    ];
    const { userData, loading } = CurrentUser();

    useEffect(() => {
        if (!loading && (!userData.name || !userData.email)) {
            window.location.href = '/';
        }
    }, [loading, userData]);

    return (
        <div className="vh-100 d-flex flex-column">

            {showAlert && (
                <div className="alert-wrapper">
                    <div
                        className={`alert ${alertStatus} alert-dismissible fade show alert-custom`}
                        role="alert"
                    >
                        {alertMessage}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => showAlertMessage("")}
                            aria-label="Close"
                        ></button>
                    </div>
                </div>
            )}


            {/* Top Navbar */}
            <nav
                className="bg-dark px-4 py-3 d-flex justify-content-between align-items-center position-relative"
                style={{ color: 'white' }}
            >            

                <div className="d-flex align-items-center">
                    <button
                        className="btn btn-dark me-3 d-lg-none"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#sidebarMenu"
                        aria-controls="sidebarMenu"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                    <h3>Park_King</h3>
                </div>

                <div className="d-flex gap-3">
                    <div className="dropdown" style={{ position: 'relative' }}>
                        <BootstrapButton
                            icon={faUserAlt}
                            type={ButtonType.NoType}
                            size={ButtonSize.Large}
                            onClick={toggleDropdown}
                        />
                        {isOpen && (
                            <div className="dropdown-menu show" aria-labelledby="dropdownMenuButton" style={{ position: 'absolute', top: '100%', right: 0 }}>
                                <p className="dropdown-item" style={{ fontWeight: "bold", marginBottom: '5px', marginRight: '5px' }}>
                                    {userData.name}
                                </p>
                                {userData.isAdmin && (
                                    <div className="dropdown-item">
                                        <span
                                            className="badge bg-success"
                                            style={{ fontSize: '0.8rem', color: 'white' }}>
                                            Admin
                                        </span>
                                    </div>  
                                )}
                                <p className="dropdown-item" style={{ marginTop: '0', marginBottom: '5px' }}>{userData.email}</p>

                                <hr />

                                <a className="dropdown-item"
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                                >
                                    <FontAwesomeIcon icon={faKey} />
                                    <span>   Change Password</span>
                                </a>
                                <a className="dropdown-item"
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();  // Prevent the default anchor behavior
                                        handleLogoutClick();
                                    }}
                                    style={{ color: "red" }}>
                                    <FontAwesomeIcon icon={faPowerOff} />

                                    <span>   Log Out</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

               
            </nav>



            {/* Main Content with Sidebar */}
            <div className="d-flex flex-grow-1">
                {/* Sidebar */}
                <div
                    className="bg-light collapse d-lg-block vh-100"
                    id="sidebarMenu"
                    style={{ width: '16rem' }}
                >
                    <p style={{ marginTop: "20px", marginLeft: "15px" }}>Main Functions</p>
                    <hr />
                    <ul className="list-unstyled mt-3" style={{ marginTop: '20px' }}>
                        {links.map((link) => (
                            <li
                                key={link.path}
                                className={`mb-2 ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                <a
                                    href={link.path}
                                    className={`d-flex align-items-center px-3 py-2 text-decoration-none text-dark`}
                                    style={{
                                        backgroundColor: location.pathname === link.path ? '#dbeafe' : '#f8f9fa',
                                    }}
                                >
                                    <FontAwesomeIcon icon={link.icon} className="me-3" />
                                    <span>{link.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    {userData.isAdmin && (
                        <>
                            <p style={{ marginTop: "20px", marginLeft: "15px" }}>Administrative Functions</p>
                            <hr />
                            <ul className="list-unstyled mt-3" style={{ marginTop: '20px' }}>
                                {adminLinks.map((link) => (
                                    <li
                                        key={link.path}
                                        className={`mb-2 ${location.pathname === link.path ? 'active' : ''}`}
                                    >
                                        <a
                                            href={link.path}
                                            className={`d-flex align-items-center px-3 py-2 text-decoration-none text-dark`}
                                            style={{
                                                backgroundColor: location.pathname === link.path ? '#dbeafe' : '#f8f9fa',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={link.icon} className="me-3" />
                                            <span>{link.label}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                  
                </div>

                {/* Main Content Area */}
                <div className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#f3f4f6' }}>
                    <Row>
                        <Col>{children}</Col>
                    </Row>
                </div>
            </div>

            <ChangePasswordModal
                isModalOpen={isModalOpen}
                handleCloseModal={handleCloseModal}
            />

        </div>
    );
};

Layout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Layout;

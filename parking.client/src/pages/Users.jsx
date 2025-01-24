import Layout from '../controls/Layout';
import BootstrapButton from '../controls/BootstrapButton';
import TableControl from '../controls/TableControl';
import { faKey, faPencil, faTrashRestore, faTrash, faUserPlus } from '../../../node_modules/@fortawesome/free-solid-svg-icons/index';
import { useState, useEffect } from 'react';
import { ExecuteHTTP, HTTP_COMMANDS, COMMAND_URLS } from '../HTTPProxy';
import { UserFormModal } from '../Modals/UserFormModal';
import CurrentUser from '../CurrentUser';
import UserChangePasswordModal from '../Modals/UserChangePasswordModal';
import YesNoMessageBox from '../Modals/MessageBoxes/YesNoMsgBox';
import { useAlert, AlertStatus } from '../AlertProvider';
const Users = () => {

    const [showUserFormModal, setShowUserFormModal] = useState(false);
    const [selectedUserID, setSelectedUserID] = useState(null);
    const [isDeactivated, setIsDeactivated] = useState(false);

    const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const { showAlertMessage } = useAlert();

    const handleOpenUserFormModal = (userID = null) => {
        setSelectedUserID(userID); 
        setShowUserFormModal(true);
    };

    const handleCloseUserFormModal = () => {
        setShowUserFormModal(false);
        setSelectedUserID(null);
        refreshUsers();
    };

    const handleOpenPasswordChangeModal = (userID) => {
        setSelectedUserID(userID);
        setShowPasswordChangeModal(true);
    };

    const handleClosePasswordChangeModal = () => {
        setShowPasswordChangeModal(false);
        setSelectedUserID(null);
    };

    const [users, setUsers] = useState([]);
    const columns = [
        { key: 'id', display: 'ID' },
        { key: 'name', display: 'Name' },
        { key: 'emailAddress', display: 'Email' },
        {
            key: 'isAdmin',
            display: 'Role',
            customRender: (value) => (
                <div
                    className={`bg-primary d-flex justify-content-center align-items-center rounded`}
                    style={{ color: 'white', height: '100%', width: '100%' }}
                >
                    {value ? 'Admin' : 'Staff'}
                </div>
            ),
        },
        { key: 'lastLoggedIn', display: 'Last Logged In'}
    ];

    const { loading, userData } = CurrentUser();

    const handleDelete = (userID, isActive) => {
        setSelectedUserID(userID);
        setIsDeactivated(!isActive);
        setShowDeleteConfirmation(true); 
    };

    const handleYesDelete = async () => {
        if (selectedUserID) {
            setLoading(true);
            try {
                const response = await ExecuteHTTP(COMMAND_URLS.CHANGE_ACTIVE_USER, HTTP_COMMANDS.PATCH, {
                    id: selectedUserID
                }, {});
                const data = await response.json();
                if (response.ok) {
                    setShowDeleteConfirmation(false);
                    setSelectedUserID(null);
                    refreshUsers();
                    setLoading(false);
                    return;
                }

                showAlertMessage(data.message, AlertStatus.SUCCESS);
            } catch (error) {
                showAlertMessage(error, AlertStatus.ERROR);
            }
            setLoading(false);
        }
    };

    const handleNoDelete = () => {
        setShowDeleteConfirmation(false);
        setSelectedUserID(null);
    };

    const actions = (row) => {
        const buttons = [];

        buttons.push({
            variant: 'primary',
            icon: faPencil,
            onClick: () => {
                handleOpenUserFormModal(row['id']);
            },
        });

        if (row['id'] !== userData.id) {
            buttons.push({
                variant: 'primary',
                icon: faKey,
                onClick: () => {
                    handleOpenPasswordChangeModal(row['id']);
                },
            });

         
            if (row.isActive) {
                buttons.push({
                    variant: 'danger',
                    icon: faTrash,
                    onClick: () => handleDelete(row['id'], row.isActive),
                });
            } else {
                buttons.push({
                    variant: 'success',
                    icon: faTrashRestore,
                    onClick: () => handleDelete(row['id'], row.isActive),
                });
            }
        }

        return buttons;
    };

    const refreshUsers = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_USERS, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                setUsers(data); 
            } else {
                console.error('Failed to fetch users:', data.message);
                showAlertMessage('Failed to fetch users: ' + data.message, AlertStatus.WARNING);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showAlertMessage('Failed to fetch users: ' + error, AlertStatus.ERROR);
        }
    };
    useEffect(() => {
        if (!loading && (!userData.isAdmin || !userData.id)) {
            window.location.href = '/dashboard';
        }
    }, [userData, loading]);

    useEffect(() => {
        refreshUsers(); 
    }, []);

    return (
        <Layout>
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h3 className="h3 mb-0 text-gray-800">User Management</h3>
                <BootstrapButton
                    text="Create User"
                    icon={faUserPlus}
                    onClick={() => handleOpenUserFormModal(null)} // Open user form modal
                />
            </div>
            <TableControl
                columns={columns}
                data={users}
                itemsPerPage={10}
                actions={actions} // Pass actions for buttons in the last column
            />
            {/* User Form Modal */}
            <UserFormModal
                show={showUserFormModal}
                onClose={handleCloseUserFormModal}
                userID={selectedUserID}
            />
            {/* User Change Password Modal */}
            <UserChangePasswordModal
                isModalOpen={selectedUserID !== null && showPasswordChangeModal}
                handleCloseModal={handleClosePasswordChangeModal}
                userID={selectedUserID}
            />
            <YesNoMessageBox
                show={showDeleteConfirmation}
                message={`Are you sure you want to ${(isDeactivated ? "reactivate" : "deactivate")} this user?`}
                onYes={handleYesDelete}
                onNo={handleNoDelete}
                isLoading={isLoading}
            />
        </Layout>
    );
};

export default Users;

import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DashboardCard = ({ icon, text, value }) => {
    return (
        <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center">
                    <div
                        className="rounded-2 d-flex justify-content-center align-items-center me-3"
                        style={{
                            backgroundColor: '#dbeafe',
                            width: '50px',
                            height: '50px',
                            fontSize: '24px',
                            color: '#3b74ed'
                        }}
                    >
                        <FontAwesomeIcon icon={icon} />
                    </div>
                    <div>
                        <h6 className="card-title text-muted mb-1">{text}</h6>
                        <h5 className="fw-bold">{value}</h5>
                    </div>
                </div>
            </div>
        </div>
    );
};

DashboardCard.propTypes = {
    icon: PropTypes.object.isRequired,
    text: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default DashboardCard;

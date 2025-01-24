import PropTypes from 'prop-types';
import DivCard from "./DivCard";

const RecentActivityCard = ({ activities }) => {
    return (
        <DivCard title={"Recent Activity"}>
            {activities.length > 0 ? (
                activities.map((activity, index) => {
                    let statusCircle = 'bg-success';
                    switch (activity.Status) {
                        case 'danger':
                            statusCircle = 'bg-danger';
                            break;
                        
                    }
                    return (
                        <div
                            key={index}
                            className="d-flex align-items-center mb-3 border-bottom pb-2"
                        >
                            <span
                                className={`rounded-circle ${statusCircle} d-inline-block me-2`}
                                style={{ width: '10px', height: '10px' }}
                            ></span>
                            <div>
                                <span className="fw-bold">{activity.Description}</span>
                                <div className="text-muted small">{activity.TimeAgo}</div>
                                <div className="text-muted small">Vehicle: {activity.VehiclePlateNumber}</div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-muted">No recent activity available</div>
            )}
        </DivCard>
    );
};

RecentActivityCard.propTypes = {
    activities: PropTypes.arrayOf(
        PropTypes.shape({
            Description: PropTypes.string.isRequired, 
            TimeAgo: PropTypes.string.isRequired, 
            VehiclePlateNumber: PropTypes.string.isRequired,
        })
    ).isRequired, 
};


export default RecentActivityCard;

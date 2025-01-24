import PropTypes from 'prop-types';

const DivCard = ({ children, title }) => {
  return (
      <div className="col-12 col-md-6 mb-4">
          <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                  <h5
                      className="card-title fw-bold"
                      style={{ marginTop: "10px", marginBottom: "30px" }}
                  >
                      {title }
                  </h5>
                  {children}
              </div>
          </div>
      </div>
  );
}

DivCard.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.node.isRequired,
};
export default DivCard;
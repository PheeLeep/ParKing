import { useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextBox from './TextBox';

const TableControl = ({
    data,
    columns,
    itemsPerPage = 5,
    actions = null,
    searchable = false,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const totalPages = Math.ceil(data.length / itemsPerPage);

    const filteredData = searchTerm
        ? data.filter((row) =>
            columns.some((column) =>
                row[column.key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
        : data;

    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="table-responsive">
            {searchable && (
                <div className="mb-3">
                    <TextBox
                        placeholderText="Search an item..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            )}

            <Table hover striped>
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index}>{column.display}</th>
                        ))}
                        {actions && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {currentData.length > 0 ? (
                        currentData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>
                                        {column.customRender
                                            ? column.customRender(row[column.key], row)
                                            : row[column.key] || '-'}
                                    </td>
                                ))}
                                {actions && (
                                    <td>
                                        {actions(row).map((action, actionIndex) => (
                                            <button
                                                key={actionIndex}
                                                className={`btn btn-sm btn-${action.variant} mx-1`}
                                                onClick={() => action.onClick(row)}
                                            >
                                                {action.icon ? <FontAwesomeIcon icon={action.icon} /> : ''}
                                                {action.label ?? ''}
                                            </button>
                                        ))}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center">
                                No items to display.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {totalPages > 1 && (
                <Pagination>
                    <Pagination.First
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    />
                    {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                            key={index}
                            active={currentPage === index + 1}
                            onClick={() => handlePageChange(index + 1)}
                        >
                            {index + 1}
                        </Pagination.Item>
                    ))}
                    <Pagination.Next
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    />
                </Pagination>
            )}
        </div>
    );
};

TableControl.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    columns: PropTypes.arrayOf(PropTypes.object).isRequired,
    itemsPerPage: PropTypes.number,
    actions: PropTypes.func,
    searchable: PropTypes.bool,
};

export default TableControl;

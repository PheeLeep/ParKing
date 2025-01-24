import PropTypes from "prop-types";
import { useState, useEffect } from "react";

const ComboBox = ({
    inputname,
    textBoxLabel,
    options = [],
    error,
    value,
    placeholderText,
    register,
    disabled,
    onChange,
    defaultValue,
    dropdownClassName = "dropdown-menu",
}) => {
    const [selectedValue, setSelectedValue] = useState(value || defaultValue);

    const handleSelect = (option) => {
        setSelectedValue(option); // Update the selected value
        onChange && onChange({ target: { name: inputname, value: option } });
    };

    useEffect(() => {
        setSelectedValue(value || defaultValue); // Sync with props
    }, [value, defaultValue]);


    return (
        <div className="form-group">
            {textBoxLabel && inputname && (
                <label htmlFor={inputname} className="font-medium">
                    {textBoxLabel}
                </label>
            )}

            <div className="dropdown" >
                <button
                    className="btn btn-light dropdown-toggle w-100 d-flex justify-content-between align-items-center"
                    type="button"
                    id="dropdownMenuButton"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    disabled={disabled}
                >
                    <span>{selectedValue || placeholderText}</span>
                </button>
                <ul className={dropdownClassName} aria-labelledby="dropdownMenuButton">
                    {options.map((option, index) => (
                        <li key={index}>
                            <a
                                className="dropdown-item"
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSelect(option);
                                }}
                            >
                                {option}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>


            {register && (
                <input
                    type="hidden"
                    name={inputname}
                    value={selectedValue || ""}
                    {...register(inputname)} 
                />
            )}

            {error && (
                <p className="text text-sm" style={{ color: "#ff0000" }}>
                    {error.message}
                </p>
            )}
        </div>
    );
};

ComboBox.propTypes = {
    inputname: PropTypes.string.isRequired,
    textBoxLabel: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    error: PropTypes.object,
    value: PropTypes.string,
    placeholderText: PropTypes.string,
    maxLength: PropTypes.number,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    dropdownClassName: PropTypes.string,
    register: PropTypes.func,
};

ComboBox.defaultProps = {
    textBoxLabel: "",
    error: null,
    value: "",
    placeholderText: "Select an option...",
    maxLength: null,
    disabled: false,
    readonly: false,
    className: "form-control",
    defaultValue: "",
    dropdownClassName: "dropdown-menu w-100",
};

export default ComboBox;

/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */

import { useState, useEffect } from 'react'


export const CheckboxSize = {
    None: '',
    Large: 'form-check-lg',
    Small: 'form-check-sm',
};

const CheckBox = ({
    name,
    label = "",
    checked = false,
    onChange,
    size = CheckboxSize.None,
    disabled = false,
    inline = false,
}) => {

    const [isChecked, setIsChecked] = useState(checked);

    const handleChange = (e) => {
        const newChecked = e.target.checked;
        setIsChecked(newChecked); // Update local state
        if (onChange) {
            onChange(newChecked); // Notify parent if callback is provided
        }
    };

    useEffect(() => {
        // Sync internal state with the updated checked prop value
        setIsChecked(checked);
    }, [checked]);
    return (
        <div className={`form-check ${inline ? 'form-check-inline' : ''} ${size}`}>
            <input
                id={name }
                className="form-check-input"
                type="checkbox"
                checked={isChecked}
                onChange={handleChange}
                disabled={disabled}
            />
            {label && <label className="form-check-label">{label}</label>}
        </div>
    );
};

export default CheckBox;

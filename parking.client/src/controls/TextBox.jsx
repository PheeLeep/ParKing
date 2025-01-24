/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */

import  { useState } from "react";

export const InputType = {
    Text: "text",
    Password: "password",
    Number: "number",
};

const TextBox = ({
    inputname,
    textBoxLabel,
    type = InputType.Text,
    register,
    error,
    value,
    placeholderText,
    maxLength,
    disabled,
    readonly,
    className = "form-control form-control-user",
    onChange,
    defaultValue,
    step,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword((prevState) => !prevState);
    };

    return (
        <div className="form-group">
            {textBoxLabel && inputname && (
                <label htmlFor={inputname} className="mb-2 font-medium">
                    {textBoxLabel}
                </label>
            )}
            <div className="input-group">
                <input
                    className={className}
                    id={inputname}
                    type={type === InputType.Password && showPassword ? InputType.Text : type}
                    {...(register ? register(inputname) : {})}
                    value={value}
                    defaultValue={defaultValue}
                    placeholder={placeholderText || ""}
                    maxLength={maxLength || ""}
                    onChange={onChange}
                    readOnly={readonly}
                    disabled={disabled}
                    step={type === InputType.Number ? step || "any" : undefined}
                />
                {type === InputType.Password && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={togglePasswordVisibility}
                        style={{ marginLeft: "5px" }}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                )}
            </div>
            {error && (
                <p className="text text-sm" style={{ color: "#ff0000" }}>
                    {error.message}
                </p>
            )}
        </div>
    );
};

export default TextBox;

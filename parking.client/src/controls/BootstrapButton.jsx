/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Button type options
export const ButtonType = {
    Primary: 'btn-primary',
    Secondary: 'btn-secondary',
    Success: 'btn-success',
    Danger: 'btn-danger',
    Warning: 'btn-warning',
    Info: 'btn-info',
    Light: 'btn-light',
    Dark: 'btn-dark',
    Link: 'btn-link',
    NoType: '',
};

// Button size options
export const ButtonSize = {
    None: '',
    Large: 'lg',
    Small: 'sm',
};


const getBrightness = (color) => {

    const rgb = color.startsWith('#') ? hexToRgb(color) : rgbStringToRgb(color);


    return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
};


const hexToRgb = (hex) => {
    const match = hex.match(/^#([0-9a-f]{3}){1,2}$/i);
    if (!match) return { r: 0, g: 0, b: 0 };

    let color = match[1];
    if (color.length === 3) {
        color = color.split('').map(c => c + c).join('');
    }

    return {
        r: parseInt(color.substr(0, 2), 16),
        g: parseInt(color.substr(2, 2), 16),
        b: parseInt(color.substr(4, 2), 16),
    };
};


const rgbStringToRgb = (color) => {
    const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
    return match ? { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) } : { r: 0, g: 0, b: 0 };
};


const isColorLight = (color) => {
    return getBrightness(color) > 128;
};

const BootstrapButton = ({
    text = "",
    onClick,
    type = ButtonType.Primary,
    size = ButtonSize.None,
    disabled = false,
    isBlockType = false,
    icon,
    className = "",
}) => {

    let iconColor = 'white';

    if (type === ButtonType.Light || type === ButtonType.NoType) {
        iconColor = 'black';
    }


    if (type === ButtonType.NoType) {

        const backgroundColor = window.getComputedStyle(document.documentElement).getPropertyValue('--button-background-color') || 'white'; // fallback color
        iconColor = isColorLight(backgroundColor) ? 'black' : 'white';
    }

    return (
        <button
            className={`btn ${type} ${size ? `btn-${size}` : ''} ${isBlockType ? 'w-100' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={{ color: (iconColor) }}
        >
            {icon && <FontAwesomeIcon icon={icon} style={{ color: (iconColor) }} />}
            <span> {text}</span>
        </button>
    );
};

export default BootstrapButton;

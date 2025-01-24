import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import CheckBox from '../controls/CheckBox';
import { useEffect, useState } from 'react'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import OkMsgBox from '../Modals/MessageBoxes/OkMsgBox';
const loginSchema = z.object({
    loginEmail: z.string().email({ message: "Please enter a valid email" }),
    loginPassword: z.string().min(5, { message: "Password must be at least 6 characters" })
});

const registerSchema = z.object({
    regFullName: z.string().min(5, { message: "Must have at least 5 characters." }),
    regEmail: z.string().email({ message: "Please enter a valid email" }),
    regPassword: z.string().min(5, { message: "Password must be at least 6 characters" }),
    regRetypePassword: z.string().min(5, { message: "Retype password must be at least 6 characters" })
}).refine((data) => data.regPassword === data.regRetypePassword, {
    message: "Passwords do not match",
    path: ["regRetypePassword"],
});

function Login() {
    const [onRegister, setOnRegister] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const {
        register: loginRegister,
        handleSubmit: loginHandler,
        setError: loginSetError,
        formState: { errors: loginErrors, isSubmitting: loginSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const {
        register: regRegister,
        handleSubmit: regHandleSubmit,
        formState: { errors: regErrors, isSubmitting: regSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });


    const onLoginSubmit = async (data) => {
        data.rememberMe = rememberMe;
        try {

            const response = await ExecuteHTTP(
                COMMAND_URLS.EMPLOYEE_LOGIN,
                HTTP_COMMANDS.POST,
                data, {});
            const value = await response.json();
            if (response.ok) {
                window.location.href = "/dashboard";
            } else {
                switch (response.status) {
                    case 404:
                        loginSetError("loginEmail", { message: value.message });
                        break;
                    case 500:
                    case 401:
                        loginSetError("loginPassword", { message: value.message });
                        break;
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                loginSetError("loginPassword", { message: error.message });
            } else {
                loginSetError("loginPassword", { message: "Unknown error occurred. Please contact to the developer." });
            }
            console.error(error);
        }

    };

    const onRegisterSubmit = async (data) => {
        console.log("Form data submitted: ", data);
        window.location.href = "/dashboard";
    };


    useEffect(() => {
        const validate = async () => {
            try {
                const response = await ExecuteHTTP(
                    COMMAND_URLS.EMPLOYEE_CHECK_SESSION,
                    HTTP_COMMANDS.GET);
                if (response.ok) {
                    setIsAuthenticated(true);
                    window.location.href = "/dashboard";
                }
            } catch (error) {
                console.log(error);
            }
        }
        validate();
    }, []);
    return (
        <>
            {isAuthenticated ? (
                <div>Redirecting...</div> 
            ) : (
                    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                        <div className="card shadow-lg" style={{ width: '400px' }}>
                            <div className="text-center mt-4 position-relative" style={{ marginTop: '30px' }}>
                                {
                                    onRegister && (
                                        <div
                                            className="position-absolute top-50 start-0 translate-middle-y"
                                            style={{ marginLeft: "10px" }}
                                        >
                                            <BootstrapButton
                                                type={ButtonType.NoType}
                                                icon={faChevronLeft}
                                                onClick={() => {
                                                    setOnRegister(false)
                                                }
                                                }
                                                disabled={!onRegister && !regSubmitting} />
                                        </div>
                                    )
                                }
                                <h2>{onRegister ? 'Create Account' : 'Park_King Login'}</h2>
                            </div>

                            <div className="card-body">
                                {!onRegister ? (
                                    <>
                                        <form onSubmit={loginHandler(onLoginSubmit)}>
                                            <div className="mb-3">
                                                <TextBox
                                                    type={InputType.Text}
                                                    textBoxLabel={"Email Address"}
                                                    placeholderText={"Enter your email address"}
                                                    inputname={"loginEmail"}
                                                    register={loginRegister}
                                                    error={loginErrors.loginEmail}
                                                    disabled={loginSubmitting}
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <TextBox
                                                    type={InputType.Password}
                                                    textBoxLabel={"Password"}
                                                    placeholderText={"Enter your password"}
                                                    inputname={"loginPassword"}
                                                    register={loginRegister}
                                                    error={loginErrors.loginPassword}
                                                    disabled={loginSubmitting}
                                                />
                                            </div>
                                            <div className="mb-3 d-flex align-items-center ml-auto">
                                                <CheckBox
                                                    inputname={"rememberUser"}
                                                    label="Remember Me"
                                                    disabled={loginSubmitting}
                                                    onChange={(e) => {
                                                        setRememberMe(e)
                                                    }}
                                                />
                                                <BootstrapButton
                                                    type={ButtonType.Link}
                                                    text="Forgot Password?"
                                                    disabled={loginSubmitting}
                                                    onClick={() => {
                                                        setShowForgotPassword(true);
                                                    }}
                                                    style={{color: "black"} }
                                                />
                                            </div>

                                            <hr />
                                            <div className="mb-3">
                                                <BootstrapButton
                                                    type={ButtonType.Success}
                                                    isBlockType={true}
                                                    disabled={loginSubmitting}
                                                    text="Login"
                                                />
                                            </div>
                                        </form>
                                        <hr />
                                        <div className="mb-3">
                                            <BootstrapButton
                                                type={ButtonType.Primary}
                                                isBlockType={true}
                                                disabled={loginSubmitting}
                                                text="Register"
                                                onClick={() => {
                                                    setOnRegister(true);
                                                }}
                                            />
                                        </div>
                                    </>

                                ) : (
                                    <form onSubmit={regHandleSubmit(onRegisterSubmit)}>
                                        <div className="mb-3">
                                            <TextBox
                                                type={InputType.Text}
                                                textBoxLabel={"Full Name"}
                                                placeholderText={"Enter your full name"}
                                                inputname={"regFullName"}
                                                register={regRegister}
                                                error={regErrors.regFullName}
                                                disabled={regSubmitting}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <TextBox
                                                type={InputType.Text}
                                                textBoxLabel={"Email Address"}
                                                placeholderText={"Enter your email address"}
                                                inputname={"regEmail"}
                                                register={regRegister}
                                                error={regErrors.regEmail}
                                                disabled={regSubmitting}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <TextBox
                                                type={InputType.Password}
                                                textBoxLabel={"Password"}
                                                placeholderText={"Enter your password"}
                                                inputname={"regPassword"}
                                                register={regRegister}
                                                error={regErrors.regPassword}
                                                disabled={regSubmitting}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <TextBox
                                                type={InputType.Password}
                                                textBoxLabel={"Re-type Password"}
                                                placeholderText={"Re-enter your password"}
                                                inputname={"regRetypePassword"}
                                                register={regRegister}
                                                error={regErrors.regRetypePassword}
                                                disabled={regSubmitting}
                                            />
                                        </div>
                                        <hr />
                                        <div className="mb-3">
                                            <BootstrapButton
                                                type={ButtonType.Success}
                                                isBlockType={true}
                                                text="Register"
                                            />
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        <OkMsgBox
                            show={showForgotPassword}
                            message={"Please contact the administrator to reset your password."}
                            onOK={() => {
                                setShowForgotPassword(false);
                            } }
                        />
                    </div>
            )}

        </>
    );
}

export default Login;
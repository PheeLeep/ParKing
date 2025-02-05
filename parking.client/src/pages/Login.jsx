import BootstrapButton, { ButtonType } from '../controls/BootstrapButton';
import TextBox, { InputType } from '../controls/TextBox';
import CheckBox from '../controls/CheckBox';
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HTTP_COMMANDS, ExecuteHTTP, COMMAND_URLS } from '../HTTPProxy'
import OkMsgBox from '../Modals/MessageBoxes/OkMsgBox';
const loginSchema = z.object({
    loginEmail: z.string().email({ message: "Please enter a valid email" }),
    loginPassword: z.string().min(5, { message: "Password must be at least 6 characters" })
});

function Login() {
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
                                <h2>Park_King Login</h2>
                            </div>

                            <div className="card-body">
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
                                                style={{ color: "black" }}
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
                                </>

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
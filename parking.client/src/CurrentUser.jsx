import { useEffect, useState } from 'react';
import { ExecuteHTTP, COMMAND_URLS, HTTP_COMMANDS } from './HTTPProxy';

const CurrentUser = () => {
    const [userData, setUserData] = useState({
        id: '',
        name: '',
        email: '',
        isAdmin: false,
    });

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const validate = async () => {
            try {
                const response = await ExecuteHTTP(
                    COMMAND_URLS.EMPLOYEE_CHECK_SESSION,
                    HTTP_COMMANDS.GET
                );
                const data = await response.json();

                if (!response.ok) {
                    setUserData({ id :'',  name: '', email: '', isAdmin: false });
                } else {
                    setUserData(data);
                }
            } catch (error) {
                console.log(error);
                setUserData({ id: '', name: '', email: '', isAdmin: false });
            }
            setLoading(false);
        };


        validate();
    }, []);

    return { userData, loading };
};

export default CurrentUser;

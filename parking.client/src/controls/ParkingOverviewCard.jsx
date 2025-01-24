import { useEffect, useState } from "react";
import { COMMAND_URLS, HTTP_COMMANDS, ExecuteHTTP } from '../HTTPProxy';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import DivCard from "./DivCard";
import { format } from 'date-fns';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ParkingOverviewCard = () => {
    const [chartData, setChartData] = useState(null);
    const [error, setError] = useState(null);


    const fetchDailyRevenue = async () => {
        try {
            const response = await ExecuteHTTP(COMMAND_URLS.GET_TICKET_REVENEUE_TREND, HTTP_COMMANDS.GET);
            const data = await response.json();

            if (response.ok) {
                const labels = data.map((item) => format(item.date, 'yyyy/MM/dd'));
                const revenues = data.map((item) => item.revenue);

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: "Daily Revenue",
                            data: revenues,
                            borderColor: "rgba(75,192,192,1)",
                            backgroundColor: "rgba(75,192,192,0.2)",
                            tension: 0.4, // Smooth curves
                        },
                    ],
                });
            } else {
                setError(data.message || "Failed to fetch daily revenue");
            }
        } catch (err) {
            setError("An error occurred while fetching daily revenue");
            console.error("Error:", err);
        }
    };

    useEffect(() => {
        fetchDailyRevenue();
    }, []);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Daily Payment Revenue (Last 7 Days)",
            },
        },
    };

    return (
        <DivCard title="Parking Overview">
            <div className="d-flex align-items-center justify-content-center">
                {chartData ? (
                    <Line data={chartData} options={options} />
                ) : error ? (
                    <div className="text-danger">{error}</div>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </DivCard>
    );
};

export default ParkingOverviewCard;

using Microsoft.AspNetCore.Mvc;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;
using System.Text.Json;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase {

        private readonly DBContext _context;

        public DashboardController(IConfiguration configuration) {
            _context = new DBContext(configuration.GetConnectionString("DeploymentConnection"));
        }

        [HttpGet]
        public async Task<IActionResult> Get() {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }
                var data = new Dictionary<string, object>();

                var r1 = await _context.ExecuteQueryAsync("SELECT COUNT(*) AS TotalSlots, COUNT(CASE WHEN TicketOccupation IS NOT NULL AND TicketOccupation <> '' THEN 1 END) AS OccupiedSlots FROM slots", []);
                if (r1.Rows.Count != 1) {
                    return BadRequest(new {
                        Message = "No items found."
                    });
                }

                var row = r1.Rows[0];
                data.Add("TotalSlots", row["TotalSlots"]);
                data.Add("OccupiedSlots", row["OccupiedSlots"]);

                var r2 = await _context.ExecuteQueryAsync("SELECT COUNT(*) AS ActiveTickets FROM tickets WHERE Status = 'Unpaid'", []);
                if (r2.Rows.Count != 1) {
                    return BadRequest(new {
                        Message = "No items found."
                    });
                }

                row = r2.Rows[0];
                data.Add("ActiveTickets", row["ActiveTickets"]);

                var r3 = await _context.ExecuteQueryAsync("SELECT SUM(Price) AS TotalPrice FROM payment WHERE CAST(DateOccurred AS DATE) = CAST(GETDATE() AS DATE)", []);

                if (r3.Rows.Count != 1) {
                    return BadRequest(new {
                        Message = "No items found."
                    });
                }

           

                row = r3.Rows[0];
                var totalPrice = row["TotalPrice"] != DBNull.Value ? Convert.ToDecimal(row["TotalPrice"]) : 0;

                data.Add("DailyRevenue", totalPrice);


                var r5 = await _context.ExecuteQueryAsync("SELECT COUNT(*) AS totalVisitors FROM tickets WHERE CAST(DateOccupied AS DATE) = CAST(GETDATE() AS DATE)");
                if (r5.Rows.Count != 1) {
                    return BadRequest(new {
                        Message = "No items found."
                    });
                }
                row = r5.Rows[0];
                data.Add("CurrentVisitors", row["totalVisitors"]);

                string parkActivityQuery = @"
                    SELECT TOP 3 
                        pa.ParkActivityID,
                        pa.DateOccurred,
                        pa.TicketID,
                        pa.Description,
                        pa.Status,
                        t.VehiclePlateNumber
                    FROM 
                        park_activities pa
                    INNER JOIN 
                        tickets t ON pa.TicketID = t.TicketID
                    ORDER BY 
                        pa.DateOccurred DESC;
                ";


                var r4 = await _context.ExecuteQueryAsync(parkActivityQuery, []);

                // Add the latest park activities to the response data
                var parkActivities = new List<Dictionary<string, object>>();
                foreach (DataRow parkActivityRow in r4.Rows) {
                    if (!DateTime.TryParse(parkActivityRow["DateOccurred"].ToString(), out DateTime dt)) {
                        continue;
                    }

                    string timeAgo = GetTimeAgo(dt);

                    parkActivities.Add(new Dictionary<string, object> {
                        { "TimeAgo", timeAgo },
                        { "Description", parkActivityRow["Description"] },
                        { "Status", parkActivityRow["Status"] },
                        { "VehiclePlateNumber", parkActivityRow["VehiclePlateNumber"] }
                    });
                }

                data.Add("LatestParkActivities", parkActivities);

                string jsonString = JsonSerializer.Serialize(data, new JsonSerializerOptions {
                    WriteIndented = true
                });
                return Ok(jsonString);
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }
        }


        [HttpGet("reports")]
        public async Task<IActionResult> GetReports() {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }

                string parkActivityQuery = @"
                    SELECT
                        pa.ParkActivityID,
                        pa.DateOccurred,
                        pa.TicketID,
                        pa.Description,
                        pa.Status,
                        t.VehiclePlateNumber,
                        t.CustomerName
                    FROM 
                        park_activities pa
                    INNER JOIN 
                        tickets t ON pa.TicketID = t.TicketID
                    ORDER BY 
                        pa.DateOccurred DESC;
                ";


                var r4 = await _context.ExecuteQueryAsync(parkActivityQuery, []);

                var parkActivities = new List<Dictionary<string, object>>();
                foreach (DataRow parkActivityRow in r4.Rows) {
                    if (!DateTime.TryParse(parkActivityRow["DateOccurred"].ToString(), out DateTime dateOccurred))
                        continue;


                    parkActivities.Add(new Dictionary<string, object> {
                        { "Date", dateOccurred.ToString("yyyy/MM/dd hh:mm:ss tt") },
                        { "Description", parkActivityRow["Description"] },
                        { "VehiclePlateNumber", parkActivityRow["VehiclePlateNumber"] },
                        { "CustomerName", parkActivityRow["CustomerName"] }
                    });
                }
                string jsonString = JsonSerializer.Serialize(parkActivities, new JsonSerializerOptions {
                    WriteIndented = true
                });
                return Ok(jsonString);

            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error"
                });
            }
        }
        private string GetTimeAgo(DateTime dateTime) {
            DateTime newDate = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);
            var timeSpan = newDate - dateTime;

            if (timeSpan.TotalSeconds < 60) {
                return $"{timeSpan.Seconds} second{(timeSpan.Seconds > 1 ? "s" : "")} ago";
            } else if (timeSpan.TotalMinutes < 60) {
                return $"{timeSpan.Minutes} minute{(timeSpan.Minutes > 1 ? "s" : "")} ago";
            } else if (timeSpan.TotalHours < 24) {
                return $"{timeSpan.Hours} hour{(timeSpan.Hours > 1 ? "s" : "")} ago";
            } else if (timeSpan.TotalDays < 30) {
                return $"{timeSpan.Days} day{(timeSpan.Days > 1 ? "s" : "")} ago";
            } else if (timeSpan.TotalDays < 365) {
                var months = Math.Floor(timeSpan.TotalDays / 30);
                return $"{months} month{(months > 1 ? "s" : "")} ago";
            } else {
                var years = Math.Floor(timeSpan.TotalDays / 365);
                return $"{years} year{(years > 1 ? "s" : "")} ago";
            }
        }

    }
}

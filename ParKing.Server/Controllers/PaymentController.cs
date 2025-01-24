using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase {

        private readonly DBContext _context;

        public PaymentController(IConfiguration configuration) {
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

                var dailyRevenue = new List<object>();

                var query = @"
                            SELECT 
                                p.PaymentID, 
                                p.TicketID, 
                                p.Price, 
                                p.PaymentMethod, 
                                p.ReferenceID, 
                                p.DateOccurred,
                                t.CustomerName
                            FROM 
                                payment p
                            INNER JOIN 
                                tickets t ON p.TicketID = t.TicketID
                            ORDER BY
                                p.DateOccurred DESC";

                var result = await _context.ExecuteQueryAsync(query, []);

                foreach (DataRow row in result.Rows) {
                    if (!DateTime.TryParse(row["DateOccurred"].ToString(), out DateTime dt)) {
                        throw new InvalidOperationException("Date time parse failed");
                    }
                    
                    dailyRevenue.Add(new {
                        PaymentID = row["PaymentID"],
                        TicketID = row["TicketID"],
                        Price = row["Price"],
                        Method = row["PaymentMethod"],
                        Reference = row["ReferenceID"],
                        CustomerName = row["CustomerName"],
                        DateOccurred = dt.ToString("yyyy/MM/dd hh:mm:ss tt")
                    });
                }
                return Ok(dailyRevenue);
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }
        }

        [HttpGet("fetch_payment")]
        public async Task<IActionResult> FetchPayment(string id) {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }

                var dailyRevenue = new List<object>();

                var query = @"
    SELECT 
        p.PaymentID, 
        p.TicketID, 
        p.Price, 
        p.PaymentMethod, 
        p.ReferenceID, 
        p.DateOccurred,
        t.CustomerName
    FROM payment p
    INNER JOIN tickets t ON p.TicketID = t.TicketID
    WHERE p.TicketID = @id"; // Correct the table name and WHERE condition


                var result = await _context.ExecuteQueryAsync(query, new[]
  {
    new SqlParameter("@id", SqlDbType.NVarChar) { Value = id } // Correct parameter binding
});


                if (result.Rows.Count == 0) {
                    return BadRequest(new {
                        Message = "Not found."
                    });
                }

                var row = result.Rows[0];
                if (!DateTime.TryParse(row["DateOccurred"].ToString(), out DateTime dt)) {
                    throw new InvalidOperationException("Date time parse failed");
                }
             
                return Ok(new {
                    PaymentID = row["PaymentID"],
                    TicketID = row["TicketID"],
                    Price = row["Price"],
                    Method = row["PaymentMethod"],
                    Reference = row["ReferenceID"],
                    CustomerName = row["CustomerName"],
                    DateOccurred = dt.ToString("yyyy/MM/dd hh:mm:ss tt")
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }

        }

        [HttpGet("trends")]
        public async Task<IActionResult> GetDailyRevenue() {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }

                var todayQuery = @"
    SELECT SUM(Price) AS TotalPrice 
    FROM payment 
    WHERE CAST(DateOccurred AS DATE) = CAST(GETDATE() AS DATE)";

                var yesterdayQuery = @"
    SELECT SUM(Price) AS TotalPrice 
    FROM payment 
    WHERE CAST(DateOccurred AS DATE) = CAST(GETDATE() - 1 AS DATE)";

                // Query for today's total price
                var todayResult = await _context.ExecuteQueryAsync(todayQuery, []);
                if (todayResult.Rows.Count != 1) {
                    return BadRequest(new { Message = "No items found for today." });
                }

                var todayRow = todayResult.Rows[0];
                var todayTotalPrice = todayRow["TotalPrice"] != DBNull.Value ? Convert.ToDecimal(todayRow["TotalPrice"]) : 0;

                // Query for yesterday's total price
                var yesterdayResult = await _context.ExecuteQueryAsync(yesterdayQuery, []);
                if (yesterdayResult.Rows.Count != 1) {
                    return BadRequest(new { Message = "No items found for yesterday." });
                }

                var yesterdayRow = yesterdayResult.Rows[0];
                var yesterdayTotalPrice = yesterdayRow["TotalPrice"] != DBNull.Value ? Convert.ToDecimal(yesterdayRow["TotalPrice"]) : 0;

                // Calculate percentage difference
                decimal percentageDifference = 0;
                if (yesterdayTotalPrice == 0) {
                    if (todayTotalPrice == 0) {
                        percentageDifference = 0;
                    } else {
                        percentageDifference = todayTotalPrice > 0 ? 100 : -100;
                    }
                } else {
                    // Normal percentage calculation
                    percentageDifference = ((todayTotalPrice - yesterdayTotalPrice) / yesterdayTotalPrice) * 100;
                }

                Debug.Print(todayTotalPrice.ToString());
                return Ok(new {
                    DailyRevenue = todayTotalPrice,
                    Percentage = Math.Round(percentageDifference, 2)
                });

            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }
        }

        [HttpPost("pay")]
        public async Task<IActionResult> PayNow() {
            try {

                var json = await Miscellaneous.Parse(Request.Body);
                string? ticket = json.RootElement.GetProperty("ticket").GetString();
                decimal price = json.RootElement.GetProperty("price").GetDecimal();
                string? method = json.RootElement.GetProperty("method").GetString();
                string? refID = json.RootElement.GetProperty("refID").GetString();

                if (string.IsNullOrEmpty(ticket) ||
                    string.IsNullOrEmpty(method) ||
                    string.IsNullOrEmpty(refID)) {
                    return BadRequest(new { Message = "Cannot be empty." });
                }

                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }


                var res1 = await _context.ExecuteQueryAsync("SELECT * FROM payment WHERE TicketID = @ticket", [
                        new ("@ticket", SqlDbType.NVarChar) {Value = ticket}
                    ]);
                if (res1.Rows.Count > 0) {
                    return BadRequest(new {
                        Message = "Already paid."
                    });
                }

                var (ticketDetails, errorMessage) = await new Tickets(_context).GetTicketDetailsAsync(ticket);

                if (ticketDetails == null) {
                    return Unauthorized(new { Message = errorMessage });
                }

                if (ticketDetails.TotalPrice > price) {
                    return BadRequest(new {
                        Message = "Payment is too low."
                    });
                }

                await _context.ExecuteNonQueryAsync("UPDATE tickets SET Status = 'Paid' WHERE TicketID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticket}
                    ]);

                DateTime dt = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);
                await _context.ExecuteNonQueryAsync("INSERT INTO payment VALUES (@pID, @ticketID, @date, @price, @method, @refID)", [
                     new ("@pID", SqlDbType.NVarChar) {Value = $"PAYM-{dt:yyyyMMddhhmmssfff}"},
                     new ("@ticketID", SqlDbType.NVarChar) {Value = ticket},
                     new ("@date", SqlDbType.DateTime) {Value = dt},
                     new ("@price", SqlDbType.Decimal) {Value = ticketDetails.TotalPrice},
                     new ("@method", SqlDbType.NVarChar) {Value = method},
                     new ("@refID", SqlDbType.NVarChar) {Value = refID},
                    ]);

                await _context.ExecuteNonQueryAsync("UPDATE slots SET TicketOccupation = '' WHERE TicketOccupation = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticket},
                    ]);

                await _context.ExecuteNonQueryAsync("INSERT INTO park_activities VALUES (@id, @dt, @slot, @desc, @status, @user)", [
                    new ("@id", SqlDbType.NVarChar) {Value = $"PARK-{dt:yyyyMMddhhmmssffff}"},
                    new ("@dt", SqlDbType.DateTime) {Value = dt},
                    new ("@slot", SqlDbType.NVarChar) {Value = ticket},
                    new ("@desc", SqlDbType.NVarChar) {Value = $"Parking is now Vacant."},
                    new ("@status", SqlDbType.NVarChar) {Value = "info"},
                    new ("@user", SqlDbType.NVarChar) {Value = result1.profile.ID}
                    ]);
                return Ok(new {
                    Message = "Paid"
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }

        }
    }
}

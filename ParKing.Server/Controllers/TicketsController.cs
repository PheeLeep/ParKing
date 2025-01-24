using Microsoft.AspNetCore.Mvc;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class TicketsController : ControllerBase {

        private readonly DBContext _context;

        public TicketsController(IConfiguration configuration) {
            _context = new DBContext(configuration.GetConnectionString("DeploymentConnection"));
        }

        [HttpGet("get_trend")]
        public async Task<IActionResult> GetTicketTrend() {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }
                var dailyRevenue = new List<object>();
                string query = @"
                        SELECT 
                            CAST(DateOccurred AS DATE) AS Date, 
                            SUM(Price) AS Revenue
                        FROM 
                            payment
                        WHERE 
                            DateOccurred >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE)) -- Past 7 days (inclusive of today)
                        GROUP BY 
                            CAST(DateOccurred AS DATE)
                        ORDER BY 
                            CAST(DateOccurred AS DATE);
                    ";
                var result = await _context.ExecuteQueryAsync(query, []);
               

                foreach (DataRow row in result.Rows) {
                    dailyRevenue.Add(new {
                        Date = row["Date"],
                        Revenue = row["Revenue"]
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

                var result = await _context.ExecuteQueryAsync("SELECT * FROM tickets ORDER BY DateOccupied DESC", []);
      
                foreach (DataRow row in result.Rows) {
                    if (!DateTime.TryParse(row["DateOccupied"].ToString(), out DateTime dt)) {
                        throw new InvalidOperationException("Date time parse failed");
                    }
                    if (!bool.TryParse(row["IsOvernight"].ToString(), out bool isOvernight)) {
                        throw new InvalidOperationException("Boolean parse failed");
                    }

                    dailyRevenue.Add(new {
                        TicketID = row["TicketID"],
                        CustomerName = row["CustomerName"],
                        PlateNo = row["VehiclePlateNumber"],
                        VehicleType = row["VehicleType"],
                        DateOccupied = dt.ToString("yyyy/MM/dd hh:mm:ss tt"),
                        IsOvernight = isOvernight ? "Overnight" : "Normal Parking",
                        Status = row["Status"],
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

        [HttpGet("get_ticket")]
        public async Task<IActionResult> GetTicket(string ticketId) {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new { result1.Message });
                }

                var (ticketDetails, errorMessage) = await new Tickets(_context). GetTicketDetailsAsync(ticketId);

                if (ticketDetails == null) {
                    return Unauthorized(new { Message = errorMessage });
                }

                return Ok(ticketDetails);
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new { Message = "Server Error." });
            }
        }

        [HttpPatch("cancel")]
        public async Task<IActionResult> CancelTicket() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? id = json.RootElement.GetProperty("id").GetString();

                if (string.IsNullOrEmpty(id)) {
                    return BadRequest(new {
                        Message = "No elements found."
                    });
                }

                var result = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null) {
                    return Unauthorized(new {
                        result.Message
                    });
                }


                var r1 = await _context.ExecuteQueryAsync("SELECT * FROM tickets WHERE TicketID = @id AND Status = 'Unpaid'", [
                    new ("@id", SqlDbType.NVarChar) {Value = id}
                    ]);

                if (r1.Rows.Count == 0) {
                    return Unauthorized(new {
                        Message = "No ticket found."
                    });
                }


                var r2 = await _context.ExecuteQueryAsync("SELECT SlotName, Section, SlotID FROM slots WHERE TicketOccupation = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = id}
                    ]);

                if (r2.Rows.Count == 0) {
                    return Unauthorized(new {
                        Message = "No slot found."
                    });
                }

                await _context.ExecuteNonQueryAsync("UPDATE tickets SET Status = 'Canceled' WHERE TicketID = @id", [
                     new ("@id", SqlDbType.NVarChar) {Value = id},
                    ]);


                await _context.ExecuteNonQueryAsync("UPDATE slots SET TicketOccupation = '' WHERE TicketOccupation = @id", [
                     new ("@id", SqlDbType.NVarChar) {Value = id},
                    ]);

                DateTime dt = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);

                await _context.ExecuteNonQueryAsync("INSERT INTO park_activities VALUES (@id, @dt, @slot, @desc, @status, @user)", [
                    new ("@id", SqlDbType.NVarChar) {Value = $"PARK-{dt:yyyyMMddhhmmssffff}"},
                    new ("@dt", SqlDbType.DateTime) {Value = dt},
                    new ("@slot", SqlDbType.NVarChar) {Value = id},
                    new ("@desc", SqlDbType.NVarChar) {Value = $"Parking Canceled and is now Vacant."},
                    new ("@status", SqlDbType.NVarChar) {Value = "danger"},
                    new ("@user", SqlDbType.NVarChar) {Value = result.profile.ID}
                    ]);

                return Ok(new {
                    Message = "Ticket was canceled."
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }

        [HttpPatch("update")]
        public async Task<IActionResult> UpdateTicket() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? ticket = json.RootElement.GetProperty("selectedTicket").GetString();
                string? section = json.RootElement.GetProperty("section").GetString();
                string? slot = json.RootElement.GetProperty("slot").GetString();
                string? customerName = json.RootElement.GetProperty("customerName").GetString();
                string? vehicleNumber = json.RootElement.GetProperty("vehicleNumber").GetString();
                string? vehicleType = json.RootElement.GetProperty("vehicleType").GetString();
                bool isOvernight = json.RootElement.GetProperty("isOvernight").GetBoolean();

                if (string.IsNullOrEmpty(ticket) ||
                    string.IsNullOrEmpty(section) ||
                    string.IsNullOrEmpty(slot) ||
                    string.IsNullOrEmpty(customerName) ||
                    string.IsNullOrEmpty(vehicleNumber) ||
                    string.IsNullOrEmpty(vehicleType)) {
                    return BadRequest(new {
                        Message = "Invalid body found."
                    });
                }

                var result = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null) {
                    return Unauthorized(new {
                        result.Message
                    });
                }
                var slots = await _context.ExecuteQueryAsync("SELECT SlotID FROM slots WHERE Section = @section AND SlotName = @name", [
                    new ("@section", SqlDbType.NVarChar) {Value = section},
                    new ("@name", SqlDbType.NVarChar) {Value = slot}
                    ]);
                string? SlotID;

                if (slots.Rows.Count != 1) {
                    return BadRequest(new {
                        Message = "No selected row found."
                    });
                } else {
                    SlotID = slots.Rows[0]["SlotID"].ToString();
                    if (string.IsNullOrEmpty(SlotID)) {
                        return BadRequest(new {
                            Message = "No selected row found. 2"
                        });
                    }
                }

                var ticketSlot = await _context.ExecuteQueryAsync("SELECT SlotID, SlotName, Section FROM slots WHERE TicketOccupation = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticket},
                    ]);

                if (ticketSlot.Rows.Count > 0) {
                    if (ticketSlot.Rows[0]["SlotID"].ToString() != SlotID) {
                        await _context.ExecuteNonQueryAsync("UPDATE slots SET TicketOccupation = '' WHERE SlotID = @oldID", [
                            new ("@oldID", SqlDbType.NVarChar) {Value = ticketSlot.Rows[0]["SlotID"].ToString()}
                            ]);
                        await _context.ExecuteNonQueryAsync("UPDATE slots SET TicketOccupation = @ticketID WHERE SlotID = @id", [
                          new ("@id", SqlDbType.NVarChar) {Value = SlotID},
                          new ("@ticketID", SqlDbType.NVarChar) {Value = ticket}
                          ]);

                        DateTime dt = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);
                        await _context.ExecuteNonQueryAsync("INSERT INTO park_activities VALUES (@id, @dt, @slot, @desc, @status, @user)", [
                            new ("@id", SqlDbType.NVarChar) {Value = $"PARK-{dt:yyyyMMddhhmmssffff}"},
                            new ("@dt", SqlDbType.DateTime) {Value = dt},
                            new ("@slot", SqlDbType.NVarChar) {Value = ticket},
                            new ("@desc", SqlDbType.NVarChar) {Value = $"Parking was moved from {ticketSlot.Rows[0]["Section"]} {ticketSlot.Rows[0]["SlotName"]} to {section} {slot}."},
                            new ("@status", SqlDbType.NVarChar) {Value = "info"},
                            new ("@user", SqlDbType.NVarChar) {Value = result.profile.ID}
                            ]);

                    }
                }

     
                await _context.ExecuteNonQueryAsync("UPDATE tickets SET " +
                                                    "CustomerName = @cName, " +
                                                    "VehiclePlateNumber = @plate, " +
                                                    "VehicleType = @vType, " +
                                                    "IsOvernight = @overnight, " +
                                                    "SlotOccupied = @slot " +
                                                    "WHERE TicketID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticket},
                    new ("@cName", SqlDbType.NVarChar) {Value = customerName},
                    new ("@plate", SqlDbType.NVarChar) {Value = vehicleNumber},
                    new ("@vType", SqlDbType.NVarChar) {Value = vehicleType},
                    new ("@overnight", SqlDbType.Bit) {Value = isOvernight},
                    new ("@slot", SqlDbType.NVarChar) {Value = SlotID}
                    ]);


                Debug.Print("Yay!");
                return Ok(new {
                    Message = "Updated."
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }

    }
}

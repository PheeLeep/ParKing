using Microsoft.AspNetCore.Mvc;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;
using System.Text.Json;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class ViolationsController : ControllerBase {

        private readonly DBContext _context;

        public ViolationsController(IConfiguration configuration) {
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
                var data = new List<object>();
                var query = @"
                            SELECT 
                                v.ViolationID, 
                                v.TicketID, 
                                v.Reason, 
                                v.DateOccurred, 
                                v.UserID, 
                                t.CustomerName
                            FROM 
                                violations v
                            INNER JOIN 
                                tickets t ON v.TicketID = t.TicketID
                            ORDER BY
                                v.DateOccurred DESC";
                var result = await _context.ExecuteQueryAsync(query, []);

                foreach (DataRow row in result.Rows) {
                    if (!DateTime.TryParse(row["DateOccurred"].ToString(), out DateTime dt)) {
                        throw new InvalidOperationException("Date time parse failed.");
                    }
                    dt = Miscellaneous.ConvertToFilipinoTime(dt);
                    data.Add(new {
                        ID = row["ViolationID"],
                        TicketID = row["TicketID"],
                        DateOccurred = dt.ToString("yyyy/MM/dd hh:mm:ss tt"),
                        Reason = row["Reason"],
                        UserID = row["UserID"],
                        CustomerName = row["CustomerName"]
                    });
                }
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

        [HttpGet("fetch")]
        public async Task<IActionResult> GetByTicketID(string id) {
            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }
                var data = new List<object>();
                var result = await _context.ExecuteQueryAsync("SELECT * FROM violations WHERE TicketID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = id}
                    ]);

                foreach (DataRow row in result.Rows) {
                    if (!DateTime.TryParse(row["DateOccurred"].ToString(), out DateTime dt)) {
                        throw new InvalidOperationException("Date time parse failed.");
                    }
                    dt = Miscellaneous.ConvertToFilipinoTime(dt);
                    data.Add(new {
                        ID = row["ViolationID"],
                        TicketID = row["TicketID"],
                        DateOccurred = dt.ToString("yyyy/MM/dd hh:mm:ss tt"),
                        Reason = row["Reason"],
                        UserID = row["UserID"]
                    });
                }
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

        [HttpPost("add")]
        public async Task<IActionResult> AddViolation() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? violation = json.RootElement.GetProperty("violation").GetString();
                string? ticket = json.RootElement.GetProperty("ticket").GetString();

                if(string.IsNullOrEmpty(violation) || string.IsNullOrEmpty(ticket)) {
                    return BadRequest(new {
                        Message = "Invalid parameter found."
                    });
                }

                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }
                DateTime dt = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);
                await _context.ExecuteNonQueryAsync("INSERT INTO violations VALUES (@id, @ticket, @date, @reason, @userID)", [
                    new ("@id", SqlDbType.NVarChar) {Value = $"V-{dt:yyyyMMddhhmmssfff}"},
                    new ("@ticket", SqlDbType.NVarChar) {Value = ticket},
                    new ("@date", SqlDbType.DateTime) {Value = dt},
                    new ("@reason", SqlDbType.NVarChar) {Value = violation},
                    new ("@userID", SqlDbType.NVarChar) {Value = result1.profile.ID},
                    ]);

                await _context.ExecuteNonQueryAsync("INSERT INTO park_activities VALUES (@id, @dt, @slot, @desc, @status, @user)", [
                            new ("@id", SqlDbType.NVarChar) {Value = $"PARK-{dt:yyyyMMddhhmmssffff}"},
                            new ("@dt", SqlDbType.DateTime) {Value = dt},
                            new ("@slot", SqlDbType.NVarChar) {Value = ticket},
                            new ("@desc", SqlDbType.NVarChar) {Value = $"Violation Occurred"},
                            new ("@status", SqlDbType.NVarChar) {Value = "danger"},
                            new ("@user", SqlDbType.NVarChar) {Value = result1.profile.ID}
                            ]);
                return Ok(new {
                    Message = "Violation added."
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }
        }

        [HttpDelete("remove_violation")]
        public async Task<IActionResult> RemoveViolation(string id) {
            try {

                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }

                var res1 = await _context.ExecuteQueryAsync("SELECT TicketID FROM violations WHERE ViolationID = @id", [
                    new ("@id",SqlDbType.NVarChar) {Value  = id}
                    ]);


                if (res1.Rows.Count == 0) {
                    return Unauthorized(new {
                       Message = "No rows found."
                    });
                }

                await _context.ExecuteNonQueryAsync("DELETE FROM violations WHERE ViolationID = @id", [
                     new ("@id",SqlDbType.NVarChar) {Value  = id}
                     ]);
                DateTime dt = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);
                await _context.ExecuteNonQueryAsync("INSERT INTO park_activities VALUES (@id, @dt, @slot, @desc, @status, @user)", [
                            new ("@id", SqlDbType.NVarChar) {Value = $"PARK-{dt:yyyyMMddhhmmssffff}"},
                            new ("@dt", SqlDbType.DateTime) {Value = dt},
                            new ("@slot", SqlDbType.NVarChar) {Value = res1.Rows[0]["TicketID"]},
                            new ("@desc", SqlDbType.NVarChar) {Value = $"Violation Lifted"},
                            new ("@status", SqlDbType.NVarChar) {Value = "info"},
                            new ("@user", SqlDbType.NVarChar) {Value = result1.profile.ID}
                            ]);
                return Ok(new {
                    Message = "Violation added."
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

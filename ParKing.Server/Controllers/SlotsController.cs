using Microsoft.AspNetCore.Mvc;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;
using System.Text.Json;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class SlotsController : ControllerBase {

        private readonly DBContext _context;

        public SlotsController(IConfiguration configuration) {
            _context = new DBContext(configuration.GetConnectionString("DeploymentConnection"));
        }

        [HttpGet("populate_sections")]
        public async Task<IActionResult> GetSections() {

            try {
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }

                var result = await _context.ExecuteQueryAsync("SELECT * FROM slot_section");
                var users = new List<object>();

                foreach (DataRow row in result.Rows) {
                    var user = new {
                        Section = row["SectionName"],
                    };
                    users.Add(user);
                }

                return Ok(users);
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }
        }

        [HttpGet("get_slot")]
        public async Task<IActionResult> GetSlot(string slotID) {
            try {
                if (string.IsNullOrEmpty(slotID)) {
                    return BadRequest(new {
                        Message = "Invalid data found."
                    });
                }
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }
                var result = await _context.ExecuteQueryAsync("SELECT * FROM slots WHERE SlotID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = slotID}
                    ]);

                if (result.Rows.Count != 1) {
                    return BadRequest(new {
                        Message = "No rows found"
                    });
                }

                var row = result.Rows[0];

                var user = new Dictionary<string, object>() {
                    {"id",row["SlotID"]  },
                    {"name",row["SlotName"]  },
                    {"section",row["Section"]  },
                    {"ticketOccupation",row["TicketOccupation"]  }
                };

                string? ticket = row["TicketOccupation"].ToString();
                if (!string.IsNullOrEmpty(ticket)) {
                    result = await _context.ExecuteQueryAsync("SELECT * FROM tickets WHERE TicketID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticket}
                    ]);

                    if (result.Rows.Count != 1) {
                        return BadRequest(new {
                            Message = "No rows found"
                        });
                    }
                    row = result.Rows[0];
                    user.Add("customerName", row["CustomerName"]);   
                    user.Add("plateNo", row["VehiclePlateNumber"]);
                    user.Add("vehicleType", row["VehicleType"]);
                }
                string jsonString = JsonSerializer.Serialize(user, new JsonSerializerOptions {
                    WriteIndented = true 
                });

                Debug.Print(jsonString);
                return Ok(jsonString);
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }

        }

        [HttpGet("populate_slots")]
        public async Task<IActionResult> PopulateSlots(string sectionId) {
            try {
                if (string.IsNullOrEmpty(sectionId)) {
                    return BadRequest(new {
                        Message = "Invalid data found."
                    });
                }
                var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result1.IsValid || result1.profile is null) {
                    return Unauthorized(new {
                        result1.Message
                    });
                }
                var result = await _context.ExecuteQueryAsync("SELECT * FROM slots WHERE Section = @section ORDER BY CAST(SUBSTRING(SlotName, 6, LEN(SlotName) - 5) AS INT)", [
                    new ("@section", SqlDbType.NVarChar) {Value = sectionId}
                    ]);
                var users = new List<object>();

                foreach (DataRow row in result.Rows) {
                    var user = new {
                        ID = row["SlotID"],
                        Name = row["SlotName"],
                        Section = row["Section"],
                        TicketOccupation = row["TicketOccupation"]
                    };
                    users.Add(user);
                }

                return Ok(users);
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server Error."
                });
            }
        }

        [HttpPost("add_section")]
        public async Task<IActionResult> AddSlotSection() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? new_section = json.RootElement.GetProperty("addSection").GetString();
                if (string.IsNullOrEmpty(new_section)) {
                    return BadRequest(new {
                        Message = "Invalid section given."
                    });
                }

                var result = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null) {
                    return Unauthorized(new {
                        result.Message
                    });
                }

                if (!result.profile.IsAdmin) {
                    return Unauthorized(new {
                        Message = "You cannot access to this method."
                    });
                }


                var r1 = await _context.ExecuteQueryAsync("SELECT COUNT(*) AS [RowCount] FROM slot_section WHERE SectionName = @section", [
                    new ("@section", SqlDbType.NVarChar) {Value = new_section}
                    ]);

                if (r1.Rows.Count > 0) {
                    int rowCount = Convert.ToInt32(r1.Rows[0]["RowCount"]);
                    if (rowCount > 0) {
                        return Unauthorized(new {
                            Message = "A new section already exists."
                        });
                    }

                }

                await _context.ExecuteNonQueryAsync("INSERT INTO slot_section VALUES (@slotID)", [
                        new ("@slotID", SqlDbType.NVarChar) {Value = new_section},
                        ]);

                return Ok(new {
                    Message = "Section added"
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddSlots() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? new_section = json.RootElement.GetProperty("addSection").GetString();
                if (string.IsNullOrEmpty(new_section)) {
                    return BadRequest(new {
                        Message = "Invalid section given."
                    });
                }

                int numberOfSlots = json.RootElement.GetProperty("addSlots").GetInt32();
                if (numberOfSlots < 1) {
                    return BadRequest(new {
                        Message = "Invalid number of slots found."
                    });
                }

                var result = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null) {
                    return Unauthorized(new {
                        result.Message
                    });
                }

                if (!result.profile.IsAdmin) {
                    return Unauthorized(new {
                        Message = "You cannot access to this method."
                    });
                }


                var r1 = await _context.ExecuteQueryAsync("SELECT COUNT(*) AS [RowCount] FROM slots WHERE Section = @section", [
                    new ("@section", SqlDbType.NVarChar) {Value = new_section}
                    ]);

                if (r1.Rows.Count == 0) {
                    return Unauthorized(new {
                        Message = "No rows found."
                    });
                }
                int rowCount = Convert.ToInt32(r1.Rows[0]["RowCount"]);

                for (int i = 0; i < numberOfSlots; i++) {
                    rowCount++;
                    await _context.ExecuteNonQueryAsync("INSERT INTO slots VALUES (@id, @slotID, @section, @str)", [
                         new ("@id", SqlDbType.NVarChar) {Value = $"SLOT-{Guid.NewGuid()}"},
                         new ("@slotID", SqlDbType.NVarChar) {Value = $"Slot {rowCount}"},
                           new ("@section", SqlDbType.NVarChar) {Value = new_section},
                            new ("@str", SqlDbType.NVarChar) {Value = ""}
                        ]);

                }

                return Ok(new {
                    Message = "Rows added"
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }

        [HttpPost("occupy")]
        public async Task<IActionResult> OccupySlot() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? section = json.RootElement.GetProperty("section").GetString();
                string? slot = json.RootElement.GetProperty("slot").GetString();
                string? customerName = json.RootElement.GetProperty("customerName").GetString();
                string? vehicleNumber = json.RootElement.GetProperty("vehicleNumber").GetString();
                string? vehicleType = json.RootElement.GetProperty("vehicleType").GetString();
                bool isOvernight = json.RootElement.GetProperty("isOvernight").GetBoolean();

                var result = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null) {
                    return Unauthorized(new {
                        result.Message
                    });
                }

                if (string.IsNullOrEmpty(section) ||
                    string.IsNullOrEmpty(slot) ||
                    string.IsNullOrEmpty(customerName) ||
                    string.IsNullOrEmpty(vehicleNumber) ||
                    string.IsNullOrEmpty(vehicleType)) {
                    return BadRequest(new {
                        Message = "Invalid body found."
                    });
                }

                var slots = await _context.ExecuteQueryAsync("SELECT SlotID FROM slots WHERE Section = @section AND SlotName = @name AND (TicketOccupation IS NULL OR TicketOccupation = '')", [
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
                            Message = "No selected row found."
                        });
                    }
                }

                DateTime dateOccupied = Miscellaneous.ConvertToFilipinoTime(DateTime.Now);
                string ticketID = $"TICKET-{dateOccupied:yyyyMMddhhmmssffff}";
                await _context.ExecuteNonQueryAsync("INSERT INTO tickets VALUES (@id, @cName, @plate, @vType, @overnight, @dt, @status, @slot)", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticketID},
                    new ("@cName", SqlDbType.NVarChar) {Value = customerName},
                    new ("@plate", SqlDbType.NVarChar) {Value = vehicleNumber},
                    new ("@vType", SqlDbType.NVarChar) {Value = vehicleType},
                    new ("@overnight", SqlDbType.Bit) {Value = isOvernight},
                    new ("@dt", SqlDbType.DateTime) {Value =dateOccupied },
                    new ("@status", SqlDbType.NVarChar) {Value = "Unpaid"},
                    new ("@slot", SqlDbType.NVarChar) {Value = SlotID}
                    ]);

                await _context.ExecuteNonQueryAsync("UPDATE slots SET TicketOccupation = @id WHERE SlotID = @slot", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticketID},
                    new ("@slot", SqlDbType.NVarChar) {Value = SlotID}
                    ]);

                await _context.ExecuteNonQueryAsync("INSERT INTO park_activities VALUES (@id, @dt, @slot, @desc, @status, @user)", [
                    new ("@id", SqlDbType.NVarChar) {Value = $"PARK-{dateOccupied:yyyyMMddhhmmssffff}"},
                    new ("@dt", SqlDbType.DateTime) {Value = dateOccupied},
                    new ("@slot", SqlDbType.NVarChar) {Value = ticketID},
                    new ("@desc", SqlDbType.NVarChar) {Value = $"Parking {section} {slot} Occupied."},
                    new ("@status", SqlDbType.NVarChar) {Value = "info"},
                    new ("@user", SqlDbType.NVarChar) {Value = result.profile.ID}
                    ]);
                Debug.Print("Yay!");
                return Ok(new {
                    Message = "Occupied.",
                    TicketID = ticketID,
                    DateOccurred = dateOccupied.ToString("yyyy/MM/dd hh:mm:ss tt")
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

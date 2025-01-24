using Microsoft.AspNetCore.Mvc;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase {

        private readonly DBContext _context;

        public UsersController(IConfiguration configuration) {
            _context = new DBContext(configuration.GetConnectionString("DeploymentConnection"));
        }

        [HttpGet("populate")]
        public async Task<IActionResult> Get() {

            var result1 = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
            if (!result1.IsValid || result1.profile is null) {
                return Unauthorized(new {
                    result1.Message
                });
            }

            if (!result1.profile.IsAdmin) {
                return Unauthorized(new {
                    Message = "You cannot access to this method."
                });
            }

            var result = await _context.ExecuteQueryAsync("SELECT ID, Name, EmailAddress, IsAdmin, IsActive, LastLoggedIn FROM users");
            var users = new List<object>();

            foreach (DataRow row in result.Rows) {
                if (!DateTime.TryParse(row["LastLoggedIn"].ToString(), out DateTime dt)) {
                    continue;
                }
                var user = new {
                    ID = row["ID"],
                    Name = row["Name"],
                    EmailAddress = row["EmailAddress"],
                    IsAdmin = row["IsAdmin"],
                    IsActive = row["IsActive"],
                    LastLoggedIn = dt.ToString("yyyy/MM/dd hh:mm:ss tt")
                };
                users.Add(user);
            }

            return Ok(users);
        }


        [HttpPost("fetch_one")]
        public async Task<IActionResult> FetchOneUser() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                Debug.WriteLine(json.ToString());
                string? id = json.RootElement.GetProperty("userID").GetString();

                if (string.IsNullOrEmpty(id)) {
                    return BadRequest(new {
                        Message = "No ID found."
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

                var result1 = await _context.ExecuteQueryAsync("SELECT ID, Name, EmailAddress, IsAdmin, IsActive FROM users WHERE ID = @id",
                    [
                    new ("@id", SqlDbType.NVarChar) {Value = id}
                    ]);

                if (result1.Rows.Count == 0) {
                    return NotFound(new {
                        Message = "No user found."
                    });
                }

                var row = result1.Rows[0];

                return Ok(new {
                    ID = row["ID"],
                    Name = row["Name"],
                    EmailAddress = row["EmailAddress"],
                    IsAdmin = row["IsAdmin"],
                    IsActive = row["IsActive"]
                });
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }


        [HttpPost("add")]
        public async Task<IActionResult> AddUser() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? fullName = json.RootElement.GetProperty("regFullName").GetString();
                string? emailAddress = json.RootElement.GetProperty("regEmail").GetString();
                string? password = json.RootElement.GetProperty("regPassword").GetString();
                bool isAdmin = json.RootElement.GetProperty("isAdmin").GetBoolean();

                if (string.IsNullOrEmpty(fullName) || string.IsNullOrEmpty(emailAddress) || string.IsNullOrEmpty(password)) {
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

                if (!result.profile.IsAdmin) {
                    return Unauthorized(new {
                        Message = "You cannot access to this method."
                    });
                }


                var r1 = await _context.ExecuteQueryAsync("SELECT EmailAddress FROM users WHERE EmailAddress = @email", [
                    new ("@email", SqlDbType.NVarChar) {Value = emailAddress}
                    ]);

                if (r1.Rows.Count > 0) {
                    return Unauthorized(new {
                        Message = "Email address already exists."
                    });
                }

                string salt = Auth.GenerateSalt();
                await _context.ExecuteNonQueryAsync("INSERT INTO users VALUES (@id, @name, @email, @active, @admin, @salt, @hash, @loggedIn)", [
                     new ("@id", SqlDbType.NVarChar) {Value = $"ID-{DateTime.Now:yyyyMMddhhmmss}"},
                     new ("@name", SqlDbType.NVarChar) {Value = fullName},
                     new ("@email", SqlDbType.NVarChar) {Value = emailAddress},
                     new ("@active", SqlDbType.Bit) {Value = true},
                     new ("@admin", SqlDbType.Bit) {Value = isAdmin},
                     new ("@salt", SqlDbType.NVarChar) {Value = salt},
                     new ("@hash", SqlDbType.NVarChar) {Value = Auth.Hash(password, salt)},
                     new ("@loggedIn", SqlDbType.DateTime) {Value = DateTime.Now}
                    ]);


                return Ok(new {
                    Message = "User added"
                });
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }
        [HttpPatch("update")]
        public async Task<IActionResult> UpdateUser() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? id = json.RootElement.GetProperty("id").GetString();
                string? fullName = json.RootElement.GetProperty("regFullName").GetString();
                string? emailAddress = json.RootElement.GetProperty("regEmail").GetString();
                bool isAdmin = json.RootElement.GetProperty("isAdmin").GetBoolean();

                if (string.IsNullOrEmpty(fullName) || string.IsNullOrEmpty(emailAddress) || string.IsNullOrEmpty(id)) {
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

                if (!result.profile.IsAdmin) {
                    return Unauthorized(new {
                        Message = "You cannot access to this method."
                    });
                }


                var r1 = await _context.ExecuteQueryAsync("SELECT EmailAddress, ID FROM users WHERE EmailAddress = @email", [
                    new ("@email", SqlDbType.NVarChar) {Value = emailAddress}
                    ]);

                if (r1.Rows.Count > 0) {
                    var row = r1.Rows[0];
                    if (id != row["ID"].ToString()) {
                        return Unauthorized(new {
                            Message = "Email address already exists."
                        });
                    }
                }

                await _context.ExecuteNonQueryAsync("UPDATE users SET Name = @name, EmailAddress = @email, IsAdmin = @admin WHERE ID = @id", [
                     new ("@id", SqlDbType.NVarChar) {Value = id},
                     new ("@name", SqlDbType.NVarChar) {Value = fullName},
                     new ("@email", SqlDbType.NVarChar) {Value = emailAddress},
                     new ("@admin", SqlDbType.Bit) {Value = isAdmin},
                    ]);


                return Ok(new {
                    Message = "User edited"
                });
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }

        [HttpPatch("activate")]
        public async Task<IActionResult> ActivateDeactUser() {
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

                if (!result.profile.IsAdmin) {
                    return Unauthorized(new {
                        Message = "You cannot access to this method."
                    });
                }


                var r1 = await _context.ExecuteQueryAsync("SELECT IsActive FROM users WHERE ID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = id}
                    ]);

                if (r1.Rows.Count ==  0) {
                    return Unauthorized(new {
                        Message = "No user found."
                    });
                }

                string? isBool = r1.Rows[0]["IsActive"].ToString();
                if (string.IsNullOrEmpty(isBool)) {
                    return Unauthorized(new {
                        Message = "No user found."
                    });
                }
                await _context.ExecuteNonQueryAsync("UPDATE users SET IsActive = @active WHERE ID = @id", [
                     new ("@id", SqlDbType.NVarChar) {Value = id},
                     new ("@active", SqlDbType.Bit) {Value = !bool.Parse(isBool)},
                    ]);

                bool isNewActive = !bool.Parse(isBool);
                if (!isNewActive) {
                    await _context.ExecuteNonQueryAsync("DELETE FROM sessions WHERE UserID = @id", [
                     new("@id", SqlDbType.NVarChar) { Value =id }
                  ]);
                }
                return Ok(new {
                    Message = "User active changed."
                });
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new {
                    Message = "Server error."
                });
            }
        }

        [HttpPatch("changepassword")]
        public async Task<IActionResult> ChangePassword() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? id = json.RootElement.GetProperty("userID").GetString();
                string? password = json.RootElement.GetProperty("newPassword").GetString();

                if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(id)) {
                    return BadRequest(new { Message = "Cannot be empty." });
                }

                var result = await new Auth(_context).VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null || string.IsNullOrEmpty(result.profile.ID)) {
                    return Unauthorized(new {
                        result.Message
                    });
                }

                string salt = Auth.GenerateSalt();

                await _context.ExecuteNonQueryAsync("UPDATE users SET Salt = @salt, Hash = @hash WHERE ID = @id", [
                       new("@id", SqlDbType.NVarChar) { Value =id },
                   new("@salt", SqlDbType.NVarChar) { Value =salt },
                   new("@hash", SqlDbType.NVarChar) { Value =Auth.Hash(password, salt) }
                    ]);

                // Wipe everything cookie related to user.
                await _context.ExecuteNonQueryAsync("DELETE FROM sessions WHERE UserID = @id", [
                       new("@id", SqlDbType.NVarChar) { Value =id }
                    ]);


                return Ok(new {
                    Message = "OKEY!"
                });
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
                return StatusCode(500, new {
                    Message = "A server error has occurred. Please contact the developer."
                });
            }
        }

    }
}

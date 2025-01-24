using Microsoft.AspNetCore.Mvc;
using ParKing.Server.Classes;
using System.Data;
using System.Diagnostics;
using System.Security.Cryptography;

namespace ParKing.Server.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase {

        private readonly Auth _context;

        public AuthController(IConfiguration configuration) {
            _context = new(new DBContext(configuration.GetConnectionString("DeploymentConnection")));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? username = json.RootElement.GetProperty("loginEmail").GetString();
                string? password = json.RootElement.GetProperty("loginPassword").GetString();
                bool rememberMe = json.RootElement.GetProperty("rememberMe").GetBoolean();

                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password)) {
                    return BadRequest(new { Message = "Cannot be empty." });
                }
                Debug.Print("Loaded.");
                var result = await _context.Database.ExecuteQueryAsync("SELECT * FROM users WHERE EmailAddress = @Username",
                [
                    new("@Username", SqlDbType.NVarChar) { Value =username }
                ]);

                if (result.Rows.Count == 0) {
                    return Unauthorized(new {
                        Message = "No email address found."
                    });
                }

                var row = result.Rows[0];


                if (!bool.TryParse(row["IsActive"].ToString(), out bool isActive)) {
                    throw new InvalidOperationException("Boolean operation failed.");
                }

                string? salt = row["Salt"].ToString();
                string? hash = row["Hash"].ToString();
                if (string.IsNullOrEmpty(salt) || string.IsNullOrEmpty(hash)) {
                    throw new InvalidOperationException("Hash acquire operation failed.");
                }
                if (!isActive) {
                    return Unauthorized(new {
                        Message = "This account is currently deactivated."
                    });
                }

                if (!Auth.Hash(password, salt).Equals(hash)) {
                    return Unauthorized(new {
                        Message = "Invalid username or password."
                    });
                }

                var result1 = await _context.Database.ExecuteNonQueryAsync("UPDATE users SET LastLoggedIn = @date WHERE ID = @id", [
                    new("@id", SqlDbType.NVarChar) { Value = row["ID"].ToString() },
                    new("@date", SqlDbType.DateTime) { Value = Miscellaneous.ConvertToFilipinoTime( DateTime.Now) }
                ]);


                byte[] cookieData = RandomNumberGenerator.GetBytes(64);
                var value = Convert.ToHexString(SHA256.HashData(cookieData));

                result1 = await _context.Database.ExecuteNonQueryAsync("INSERT INTO sessions VALUES (@token, @id, @date, @exp)", [
                    new("@token", SqlDbType.NVarChar) { Value = value },
                    new("@id", SqlDbType.NVarChar) { Value = row["ID"].ToString() },
                    new("@date", SqlDbType.DateTime) { Value = Miscellaneous.ConvertToFilipinoTime(DateTime.Now) },
                    new("@exp", SqlDbType.DateTime) { Value = Miscellaneous.ConvertToFilipinoTime(DateTime.Now.AddDays(30)) },
                ]);


                var cookieOptions = new CookieOptions {
                    HttpOnly = true,
                    Secure = false,
                    SameSite = SameSiteMode.Strict
                };

                if (rememberMe) {
                    cookieOptions.Expires = DateTimeOffset.UtcNow.AddDays(30); // Persistent for 30 days
                }

                Response.Cookies.Append("session_data", value, cookieOptions);

                return Ok(new {
                    Message = "OKEY!"
                });
            } catch (Exception ex) {
                Debug.Print(ex.Message);
                return StatusCode(500, new {
                    Message = "A server error has occurred. Please contact the developer."
                });
            }
        }

        [HttpGet("session")]
        public async Task<IActionResult> GetProfile() {
            // Retrieve the session ID from the cookie
            var result = await _context.VerifyAsync(Request.Cookies["session_data"]);
            if (!result.IsValid || result.profile is null) {
                return Unauthorized(new {
                    result.Message
                });
            }
            return Ok(new {
                result.profile.ID,
                result.profile.Name,
                result.profile.Email,
                result.profile.IsAdmin
            });
        }


        [HttpPatch("changepassword")]
        public async Task<IActionResult> ChangePassword() {
            try {
                var json = await Miscellaneous.Parse(Request.Body);
                string? currentPassword = json.RootElement.GetProperty("currentPassword").GetString();
                string? password = json.RootElement.GetProperty("newPassword").GetString();

                if (string.IsNullOrEmpty(currentPassword) || string.IsNullOrEmpty(password)) {
                    return BadRequest(new { Message = "Cannot be empty." });
                }

                var result = await _context.VerifyAsync(Request.Cookies["session_data"]);
                if (!result.IsValid || result.profile is null || string.IsNullOrEmpty(result.profile.ID)) {
                    return Unauthorized(new {
                        result.Message
                    });
                }

                var res1 = await _context.ChangePassword(result.profile.ID, currentPassword, password);
                if (!res1.Success) {
                    return Unauthorized(new {
                        res1.Message
                    });
                }
                Response.Cookies.Delete("session_data");

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



        [HttpDelete("logout")]
        public async Task<IActionResult> Logout() {
            var sessionId = Request.Cookies["session_data"];

            if (!string.IsNullOrEmpty(sessionId)) {
                // Remove session from the session store
                await _context.DeleteSessionByCookieID(sessionId);
                // Clear the cookie
                Response.Cookies.Delete("session_data");
            }
            return Ok(new { Message = "Logout successful" });
        }
    }
}

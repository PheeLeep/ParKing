using System.Data;
using System.Security.Cryptography;

namespace ParKing.Server.Classes {

    internal class ProfileBlockClass {
        internal string? ID { get; init; }
        internal string? Name { get; init; }
        internal string? Email { get; init; }
        internal bool IsAdmin { get; init; }
    }
    internal class Auth {
        internal DBContext Database { get; }
        internal Auth(DBContext context) {
            Database = context;
        }

        internal static string GenerateSalt() {
            byte[] newSalt = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(newSalt);
        }

        internal static string Hash(string password, string salt) {
            byte[] inputPass = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(salt + password));
            return Convert.ToHexString(inputPass);
        }

        internal async Task<(bool IsValid, ProfileBlockClass? profile, string Message)> VerifyAsync(string? sessionID) {
            if (string.IsNullOrEmpty(sessionID)) {
                return (false, null, "Invalid or expired session.");
            }
            var result = await Database.ExecuteQueryAsync("SELECT UserID, ExpiresAt FROM sessions WHERE SessionToken = @session",
              [
                  new("@session", SqlDbType.NVarChar) { Value = sessionID }
              ]);

            if (result.Rows.Count == 0) {
                return (false, null, "Invalid or expired session.");
            }

            var row = result.Rows[0];
            string? id = row["UserID"].ToString();
            if (string.IsNullOrEmpty(id) || !DateTime.TryParse(row["ExpiresAt"].ToString(), out DateTime dt)) {
                return (false, null, "Session expired or not found.");
            }
            if (DateTime.Now > dt) {
                return (false, null, "Session expired.");
            }

            var userResult = await Database.ExecuteQueryAsync("SELECT ID, Name, EmailAddress, IsAdmin FROM users WHERE ID = @id",
              [
                  new("@id", SqlDbType.NVarChar) { Value =id }
              ]);

            if (userResult.Rows.Count == 0) {
                return (false, null, "User not found.");
            }
            var userRow = userResult.Rows[0];
            if (!bool.TryParse(userRow["IsAdmin"].ToString(), out bool isAdmin)) {
                return (false, null, "User not found.");
            }
            return (true, new() {
                Name = userRow["Name"].ToString(),
                Email = userRow["EmailAddress"].ToString(),
                IsAdmin = isAdmin,
                ID = userRow["ID"].ToString()
            }, "Session is valid.");
        }

        internal async Task<(bool Success, string Message)> ChangePassword(string id, string oldPass, string password) {
            var result = await Database.ExecuteQueryAsync("SELECT Salt, Hash FROM users WHERE ID = @Username",
               [
                   new("@Username", SqlDbType.NVarChar) { Value =id }
               ]);

            if (result.Rows.Count == 0) {
                return (false, "No user found.");
            }

            var row = result.Rows[0];
            string? saltOld = row["Salt"].ToString();
            string? hashOld = row["Hash"].ToString();

            if (string.IsNullOrEmpty(saltOld) || string.IsNullOrEmpty(hashOld)) {
                return (false, "No user found.");
            }

            if (!hashOld.Equals(Hash(oldPass, saltOld))) {
                return (false, "Old password is incorrect.");
            }
            string salt = GenerateSalt();

            await Database.ExecuteNonQueryAsync("UPDATE users SET Salt = @salt, Hash = @hash WHERE ID = @id", [
                   new("@id", SqlDbType.NVarChar) { Value =id },
                   new("@salt", SqlDbType.NVarChar) { Value =salt },
                   new("@hash", SqlDbType.NVarChar) { Value =Hash(password, salt) }
                ]);

            // Wipe everything cookie related to user.
            await Database.ExecuteNonQueryAsync("DELETE FROM sessions WHERE UserID = @id", [
                   new("@id", SqlDbType.NVarChar) { Value =id }
                ]);
            return (true, "");
        }

        internal async Task<bool> DeleteSessionByCookieID(string id) {
            await Database.ExecuteNonQueryAsync("DELETE FROM sessions WHERE SessionToken = @token",
                         [
                         new ("@token", SqlDbType.NVarChar) {Value = id}
                         ]);
            return true;
        }
    }
}

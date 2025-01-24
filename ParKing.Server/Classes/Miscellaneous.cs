namespace ParKing.Server.Classes {
    internal static class Miscellaneous {

        internal static async Task<System.Text.Json.JsonDocument> Parse(Stream s) {
            using var reader = new StreamReader(s);
            var body = await reader.ReadToEndAsync();
            return System.Text.Json.JsonDocument.Parse(body);
        }

        internal static DateTime ConvertToFilipinoTime(DateTime dt) {
            try {
                DateTime old_dt = dt.ToUniversalTime();
                TimeZoneInfo philTime = TimeZoneInfo.FindSystemTimeZoneById("Taipei Standard Time");
                DateTime newTime = TimeZoneInfo.ConvertTimeFromUtc(old_dt, philTime);
                return newTime;
            } catch {
                return dt;
            }
        }
    }
}

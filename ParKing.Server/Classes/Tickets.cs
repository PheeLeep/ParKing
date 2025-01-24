using System.Data;
using System.Diagnostics;

namespace ParKing.Server.Classes {

    internal class TicketDetails {
        public string? TicketID { get; set; }
        public string? CustomerName { get; set; }
        public string? VehicleNumber { get; set; }
        public string? VehicleType { get; set; }
        public string? DateOccupied { get; set; }
        public string? IsOvernight { get; set; }
        public string? Status { get; set; }
        public string? Section { get; set; }
        public string? SlotName { get; set; }
        public string? PriceCalculation { get; set; }
        public string? ViolationCount { get; set; }
        public decimal TotalPrice { get; set; }
    }


    internal class Tickets {

        internal DBContext Database { get; }
        internal Tickets(DBContext context) {
            Database = context;
        }

        internal async Task<(TicketDetails? ticketDetails, string errorMessage)> GetTicketDetailsAsync(string ticketId) {
            try {
                string query = @"
            SELECT 
                t.TicketID,
                t.SlotOccupied,
                s.SlotName,
                t.Status,
                s.Section,
                t.CustomerName,
                t.VehiclePlateNumber,
                t.VehicleType,
                t.DateOccupied,
                t.IsOvernight
            FROM tickets t
            INNER JOIN slots s ON t.SlotOccupied = s.SlotID
            WHERE t.TicketID = @id";

                var result = await Database.ExecuteQueryAsync(query, [
                    new("@id", SqlDbType.NVarChar) { Value = ticketId }
                ]);

                if (result.Rows.Count == 0) {
                    return (null, "No rows found.");
                }

                var row = result.Rows[0];
                if (!DateTime.TryParse(row["DateOccupied"].ToString(), out DateTime dt)) {
                    return (null, "Date time parse failed");
                }

                if (!bool.TryParse(row["IsOvernight"].ToString(), out bool isOvernight)) {
                    return (null, "Boolean parse failed");
                }

                decimal price = 0;
                string calc = "";
                if (isOvernight) {
                    price = 250;
                    calc = "= PHP 250.00";
                } else {
                    TimeSpan duration = Miscellaneous.ConvertToFilipinoTime(DateTime.Now)- dt;
                    int totalHours = (int)Math.Ceiling(duration.TotalHours);
                    price = 100;

                    if (totalHours > 1) {
                        price += (totalHours - 1) * 50;
                    }
                    calc = $"= PHP 100.00 base rate\n+ ({totalHours - 1} hours x PHP 50.00)";
                }

                var res = await Database.ExecuteQueryAsync("SELECT COUNT(*) AS counter FROM violations WHERE TicketID = @id", [
                    new ("@id", SqlDbType.NVarChar) {Value = ticketId}
                    ]);
                if (!int.TryParse(res.Rows[0]["counter"].ToString(), out int violations))
                    throw new InvalidOperationException("Parse failed.");

                price += 200 * violations;

                var ticketDetails = new TicketDetails {
                    TicketID = row["TicketID"].ToString(),
                    CustomerName = row["CustomerName"].ToString(),
                    VehicleNumber = row["VehiclePlateNumber"].ToString(),
                    VehicleType = row["VehicleType"].ToString(),
                    DateOccupied = dt.ToString("yyyy/MM/dd hh:mm:ss tt"),
                    IsOvernight = isOvernight ? "Overnight" : "Normal Parking",
                    Status = row["Status"].ToString(),
                    Section = row["Section"].ToString(),
                    SlotName = row["SlotName"].ToString(),
                    PriceCalculation = calc,
                    ViolationCount = $"= {violations} violation/s x PHP 200",
                    TotalPrice = price
                };
                Debug.Print(ticketDetails.ToString());
                return (ticketDetails, "");
            } catch (Exception ex) {
                return (null, ex.Message);
            }
        }

    }
}

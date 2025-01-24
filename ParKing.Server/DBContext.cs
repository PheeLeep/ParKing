using Microsoft.Data.SqlClient;
using System.Data;

namespace ParKing.Server {
    public class DBContext {

        private readonly string _connectionString;

        public DBContext(string connectionString) {
            _connectionString = connectionString;
        }

        public async Task<DataTable> ExecuteQueryAsync(string query, SqlParameter[]? parameters = null) {
            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(query, connection);
            if (parameters != null) {
                command.Parameters.AddRange(parameters);
            }

            var dataTable = new DataTable();
            try {
                await connection.OpenAsync();
                using var reader = await command.ExecuteReaderAsync();
                dataTable.Load(reader);
            } catch (Exception ex) {
                // Log exception
                throw new Exception($"Error executing query: {ex.Message}", ex);
            }
            return dataTable;
        }

        public async Task<int> ExecuteNonQueryAsync(string query, SqlParameter[] parameters = null) {
            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand(query, connection);
            if (parameters != null) {
                command.Parameters.AddRange(parameters);
            }

            try {
                await connection.OpenAsync();
                return await command.ExecuteNonQueryAsync();
            } catch (Exception ex) {
                // Log exception
                throw new Exception($"Error executing non-query: {ex.Message}", ex);
            }
        }

    }
}

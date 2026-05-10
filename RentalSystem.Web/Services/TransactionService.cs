using Microsoft.EntityFrameworkCore;
using RentalSystem.Web.Data;

namespace RentalSystem.Web.Services
{
    /// <summary>
    /// Transaction management service for critical business workflows.
    /// Ensures ACID properties (Atomicity, Consistency, Isolation, Durability) for:
    /// - Invoice generation (prevent duplicates, ensure all items are saved)
    /// - Payment processing (prevent overpayment, ensure status updates are atomic)
    /// - Contract creation (prevent double-booking, ensure room status is synchronized)
    /// </summary>
    public interface ITransactionService
    {
        /// <summary>
        /// Executes a work function within a database transaction.
        /// If an exception occurs, the entire transaction is rolled back.
        /// </summary>
        /// <typeparam name="TResult">Return type of the work function</typeparam>
        /// <param name="work">Function to execute within the transaction</param>
        /// <returns>Result of the work function</returns>
        Task<TResult> ExecuteInTransactionAsync<TResult>(Func<Task<TResult>> work);

        /// <summary>
        /// Executes a work function within a transaction with explicit isolation level.
        /// Useful for payment processing where you need serializable isolation to prevent race conditions.
        /// </summary>
        /// <typeparam name="TResult">Return type of the work function</typeparam>
        /// <param name="work">Function to execute within the transaction</param>
        /// <param name="isolationLevel">SQL isolation level</param>
        /// <returns>Result of the work function</returns>
        Task<TResult> ExecuteInTransactionAsync<TResult>(
            Func<Task<TResult>> work,
            System.Data.IsolationLevel isolationLevel);
    }

    /// <summary>
    /// Production implementation of ITransactionService using Entity Framework Core DbContext.
    /// </summary>
    public class TransactionService : ITransactionService
    {
        private readonly RentalDbContext _context;

        public TransactionService(RentalDbContext context)
        {
            _context = context;
        }

        /// <inheritdoc />
        public async Task<TResult> ExecuteInTransactionAsync<TResult>(Func<Task<TResult>> work)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var result = await work();
                await transaction.CommitAsync();
                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<TResult> ExecuteInTransactionAsync<TResult>(
            Func<Task<TResult>> work,
            System.Data.IsolationLevel isolationLevel)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(isolationLevel);
            try
            {
                var result = await work();
                await transaction.CommitAsync();
                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

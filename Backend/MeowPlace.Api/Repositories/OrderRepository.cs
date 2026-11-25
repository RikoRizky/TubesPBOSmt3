using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.Entities;

namespace MeowPlace.Api.Repositories;

public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetOrderWithItemsAsync(string id);
    Task<Order?> FindByIdAndEmailAsync(string id, string email);
    Task<IEnumerable<Order>> GetAllOrdersWithItemsAsync();
    Task<IEnumerable<Order>> GetOrdersByEmailAsync(string email);
}

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(MeowPlaceDbContext context) : base(context) { }

    public async Task<Order?> GetOrderWithItemsAsync(string id)
    {
        return await DbSet.Include(o => o.Items)
                          .ThenInclude(i => i.Product)
                          .Include(o => o.Reviews)
                          .FirstOrDefaultAsync(o => o.Id.ToLower() == id.ToLower());
    }

    public async Task<Order?> FindByIdAndEmailAsync(string id, string email)
    {
        return await DbSet.Include(o => o.Items)
                          .ThenInclude(i => i.Product)
                          .Include(o => o.Reviews)
                          .FirstOrDefaultAsync(o => o.Id.ToLower() == id.ToLower() && o.Email.ToLower() == email.ToLower());
    }

    public async Task<IEnumerable<Order>> GetAllOrdersWithItemsAsync()
    {
        return await DbSet.Include(o => o.Items)
                          .ThenInclude(i => i.Product)
                          .OrderByDescending(o => o.CreatedAt)
                          .ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetOrdersByEmailAsync(string email)
    {
        var cleanEmail = email.Trim().ToLower();
        return await DbSet.Include(o => o.Items)
                          .ThenInclude(i => i.Product)
                          .Where(o => o.Email.ToLower() == cleanEmail)
                          .OrderByDescending(o => o.CreatedAt)
                          .ToListAsync();
    }
}

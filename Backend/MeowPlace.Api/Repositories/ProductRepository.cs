using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.Entities;

namespace MeowPlace.Api.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<IEnumerable<Product>> GetActiveProductsAsync();
    Task<Product?> GetProductWithDetailsAsync(string id);
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(MeowPlaceDbContext context) : base(context) { }

    public async Task<IEnumerable<Product>> GetActiveProductsAsync()
    {
        return await DbSet.Where(p => p.IsActive).OrderBy(p => p.Id).ToListAsync();
    }

    public async Task<Product?> GetProductWithDetailsAsync(string id)
    {
        return await DbSet.Include(p => p.Reviews)
                          .FirstOrDefaultAsync(p => p.Id == id);
    }
}

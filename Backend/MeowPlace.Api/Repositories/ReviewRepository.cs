using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.Entities;

namespace MeowPlace.Api.Repositories;

public interface IReviewRepository : IRepository<Review>
{
    Task<IEnumerable<Review>> GetByProductIdAsync(string productId);
    Task<IEnumerable<Review>> GetAllReviewsWithDetailsAsync();
}

public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(MeowPlaceDbContext context) : base(context) { }

    public async Task<IEnumerable<Review>> GetByProductIdAsync(string productId)
    {
        return await DbSet.Include(r => r.Product)
                          .Where(r => r.ProductId == productId)
                          .OrderByDescending(r => r.CreatedAt)
                          .ToListAsync();
    }

    public async Task<IEnumerable<Review>> GetAllReviewsWithDetailsAsync()
    {
        return await DbSet.Include(r => r.Product)
                          .OrderByDescending(r => r.CreatedAt)
                          .ToListAsync();
    }
}

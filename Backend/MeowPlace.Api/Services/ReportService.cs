using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Services;

public interface IReportService
{
    Task<AdminSummaryDto> GetAdminSummaryAsync();
}

public class ReportService : IReportService
{
    private readonly MeowPlaceDbContext _context;

    public ReportService(MeowPlaceDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSummaryDto> GetAdminSummaryAsync()
    {
        var totalRevenue = await _context.Orders
            .Where(o => o.Status != OrderStatus.Dibuat)
            .SumAsync(o => o.Total);

        var totalOrders = await _context.Orders.CountAsync();
        var totalProducts = await _context.Products.CountAsync(p => p.IsActive);
        var lowStockCount = await _context.Products.CountAsync(p => p.Stock <= 10 && p.IsActive);

        var avgProductRating = await _context.Reviews.AnyAsync()
            ? await _context.Reviews.AverageAsync(r => r.ProductRating)
            : 5.0;

        var avgServiceRating = await _context.Reviews.AnyAsync()
            ? await _context.Reviews.AverageAsync(r => r.ServiceRating)
            : 5.0;

        var recentOrders = await _context.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .ToListAsync();

        var recentReviews = await _context.Reviews
            .Include(r => r.Product)
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .ToListAsync();

        return new AdminSummaryDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            TotalProducts = totalProducts,
            LowStockProductsCount = lowStockCount,
            AverageProductRating = Math.Round(avgProductRating, 1),
            AverageServiceRating = Math.Round(avgServiceRating, 1),
            RecentOrders = recentOrders.Select(o => o.ToDto()).ToList(),
            RecentReviews = recentReviews.Select(r => r.ToDto()).ToList()
        };
    }
}

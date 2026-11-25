using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Repositories;

namespace MeowPlace.Api.Services;

public interface IInventoryService
{
    Task<IEnumerable<ProductDto>> GetInventoryListAsync();
    Task<ProductDto?> UpdateStockAsync(string productId, int stock, decimal? price);
    Task<IEnumerable<ProductDto>> GetLowStockProductsAsync(int threshold = 10);
}

public class InventoryService : IInventoryService
{
    private readonly IProductRepository _productRepository;

    public InventoryService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<IEnumerable<ProductDto>> GetInventoryListAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return products.Select(p => p.ToDto());
    }

    public async Task<ProductDto?> UpdateStockAsync(string productId, int stock, decimal? price)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null) return null;

        product.Stock = stock;
        if (price.HasValue && price.Value >= 0)
        {
            product.Price = price.Value;
        }

        await _productRepository.UpdateAsync(product);
        return product.ToDto();
    }

    public async Task<IEnumerable<ProductDto>> GetLowStockProductsAsync(int threshold = 10)
    {
        var products = await _productRepository.FindAsync(p => p.Stock <= threshold && p.IsActive);
        return products.Select(p => p.ToDto());
    }
}
